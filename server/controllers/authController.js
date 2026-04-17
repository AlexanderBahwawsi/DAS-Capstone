const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {generateToken} = require('../middleware/auth')

exports.login = async (req, res)=>{
    try{
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findByEmail(email); 
      if (!user|| !await bcrypt.compare(password, user.password_hash)){
          return res.status(401).json({error: 'Invalid credentials'});
      }

      const token = generateToken(user);
      res.json({token, user: {id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role} });
    } catch(err){
      console.error(err);
      res.status(500).json({error: 'Something went wrong'});
    }

};

exports.register = async(req, res) =>{
  try{
  const { first_name, last_name, email, password, bio } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, last_name, email, and password are required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // role is always 'submitter' on self-registration; admins promote via /api/admin/users/:id/role
  const user = await User.create({
    first_name,
    last_name,
    email,
    password_hash: hashedPassword,
    bio: bio || '',
    role: 'submitter'
  });

  const token = generateToken(user);
  res.status(201).json({ token, user: {  id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role} });
}catch(err){
  console.error(err);
  res.status(500).json({error: 'Something went wrong'});
}
};

exports.me = async(req, res) => {
    try {
    // Fetch user details using decoded token
    const user = await User.findById(req.user.id );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({  id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, bio: user.bio, created_at: user.created_at});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};