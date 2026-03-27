// const router = require('express').Router();
// const express = require('express')
// const {createClient} = require('@supabase/supabase-js');


// const app = express()
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {generatetoken} = require('../middleware/auth')



exports.login = async (req, res)=>{ //Add input validation
    const { email, password } = req.body;

    const user = await User.findByEmail(email); 
    if (!user|| !await bcrypt.compare(password, user.password_hash)){
        return res.status(401).json({error: 'Invalid credentials'});
    }

    const token = generateToken(user.id);
    res.json({token, user: {id: user.id, email: user.email} });

};



exports.register = async(req, res) =>{ //add input validation
    const { first_name, last_name, email, password, bio, role} = req.body;

    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    };

  // Check if user exists
  const existingUser = await User.findByEmail( email );
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
    password_hash: hashedPassword,
    bio,
    role //I'm thinking this will be moved somewhere else later.
  });

  const token = generateToken(user.id);
  res.status(201).json({ token, user: { id: user.id, email } });
};


exports.me = async(req, res) => {
    try {
    // Fetch user details using decoded token
    const user = await User.findById(req.user.id );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ id: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// TODO: Add auth routes (POST /register, POST /login, GET /me)