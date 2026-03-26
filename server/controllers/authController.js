// const router = require('express').Router();
// const express = require('express')
// const {createClient} = require('@supabase/supabase-js');


// const app = express()
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 *
 *
 * @param {*} userID
 * @return {*} 
 */
const generateToken = (userID) => {
    return jwt.sign(
        {id : userID},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
    );
};


/**
 * Description placeholder
 *
 * @type {*}
 */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});


app.post('/api/auth/login', (req, res)=>{
    const { email, password } = req.body;

    const user = await User.findByEmail({email}); //I don't know how to make this reference the USER model yet
    if (!user|| !await bcrypt.compare(password, user.password)){
        return res.status(401).json({error: 'Invalid credentials'});
    }

    const token = generateToken = generateToken(user._id);
    res.json({token, user: {id: user._id, email: user.email} });

});


/**
 * Hash Password before saving
 *
 * @async
 * @param {*} password 
 * @returns {unknown} hash of the password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};


app.post('api/auth/register', async(req, res) =>{
    const { first_name, last_name, email, password, bio, role} = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    first_name, 
    last_name,
    email,
    password: hashedPassword,
    bio,
    role //I'm thinking this will be moved somewhere else later.
  });

  const token = generateToken(user._id);
  res.status(201).json({ token, user: { id: user._id, email } });
});

app.get('api/auth/me', async(req, res) => {
    try {
    // Fetch user details using decoded token
    const user = await User.findById({ email: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
})

// TODO: Add auth routes (POST /register, POST /login, GET /me)

module.exports = router;