const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require('dotenv').config(); // Load environment variables from .env file

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    // console.log('Received token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Decoded token:', decoded);
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if the token already exists in the user's tokens array
    const tokenExists = user.tokens.some(t => t.token === token);
    if (!tokenExists) {
      user.tokens = user.tokens.concat({ token });
      await user.save();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    // console.log('Auth error:', error.message);
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;