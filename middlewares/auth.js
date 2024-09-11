const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require('dotenv').config();

/**
 * Debug function to log messages when DEBUG environment variable is set.
 * @param {string} message - The message to log.
 */
const debug = (message) => {
  if (process.env.DEBUG) {
    console.log(message);
  }
};

/**
 * Authentication middleware.
 * Verifies the JWT token, finds the corresponding user, and removes expired tokens.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const auth = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const token = req.header('Authorization').replace('Bearer ', '');
    debug(`Received token: ${token.substr(0, 10)}...`);

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    debug(`Decoded token: ${JSON.stringify(decoded)}`);

    // Find the user with the correct id and token
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    if (!user) {
      debug('User not found or token not in user\'s tokens array');
      throw new Error('User not found or token not in user\'s tokens array');
    }

    // Remove expired tokens
    const now = new Date();
    const validTokens = user.tokens.filter(t => {
      const isValid = new Date(t.expiresAt) > now && !jwt.verify(t.token, process.env.JWT_SECRET).exp;
      debug(`Token ${t.token.substr(0, 10)}... expires at ${t.expiresAt}, isValid: ${isValid}`);
      return isValid;
    });

    // Check if the current token is expired
    const currentToken = validTokens.find(t => t.token === token);
    if (!currentToken) {
      debug('Current token is expired or not found in valid tokens');
      throw new Error('Token expired');
    }

    // Only update if tokens have changed
    if (validTokens.length !== user.tokens.length) {
      debug(`Updating user tokens. Old count: ${user.tokens.length}, New count: ${validTokens.length}`);
      user.tokens = validTokens;
      await user.save();
    }

    // Attach the token and user to the request object
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    debug(`Authentication error: ${e.message}`);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

module.exports = auth;