const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require('dotenv').config(); // Load environment variables from .env file

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      throw new Error();
    }

    // Remove expired tokens
    await user.removeExpiredTokens();

    // Check if the current token is still in the user's tokens array after removal
    const tokenStillValid = user.tokens.some(t => t.token === token);
    if (!tokenStillValid) {
      throw new Error('Token has expired');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    if (res.json) {
      res.json({ error: 'Please authenticate.' });
    } else {
      res.send({ error: 'Please authenticate.' });
    }
  }
};

module.exports = auth;