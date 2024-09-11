const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Category Schema
 * Defines the structure for category documents embedded in user documents.
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^#[0-9A-Fa-f]{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid color code. Use hexadecimal format (e.g., #FF0000).`
    }
  }
});

/**
 * User Schema
 * Defines the structure for user documents in the database.
 */
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9_]+$/.test(v);
      },
      message: props => `${props.value} is not a valid username. Use only alphanumeric characters and underscores.`
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!validator.isEmail(v)) {
          throw new Error('Email is invalid');
        }
      },
      message: props => `${props.value} is not a valid email address.`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if the password is being modified
        if (this.isModified('password')) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
        }
        return true;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    }
  },
  categories: [categorySchema],
  tokens: [{
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }]
});

/**
 * toJSON method
 * Customizes the JSON representation of the user document.
 * @returns {Object} The formatted user object without sensitive information
 */
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  // Remove sensitive information before sending user data
  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

/**
 * generateAuthToken method
 * Generates a new authentication token for the user.
 * @returns {string} The generated authentication token
 */
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours

  user.tokens = user.tokens.concat({ token, expiresAt });
  await user.save();

  return token;
};

/**
 * removeExpiredTokens method
 * Removes expired tokens from the user's tokens array.
 */
userSchema.methods.removeExpiredTokens = async function () {
  const user = this;
  const currentTime = new Date();

  user.tokens = user.tokens.filter(tokenObj => tokenObj.expiresAt > currentTime);
  await user.save();
};

/**
 * findByCredentials static method
 * Finds a user by email and password for authentication.
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @returns {Object} The authenticated user object
 * @throws {Error} If login fails
 */
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }

  // Compare provided password with stored hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }

  // Remove expired tokens before returning the user
  await user.removeExpiredTokens();

  return user;
};

/**
 * Pre-save middleware
 * Hashes the password before saving to the database.
 */
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8); // Hash the password with a salt round of 8
  }

  next();
});

/**
 * Custom validation for categories
 * Ensures that category names are unique for each user.
 */
userSchema.path('categories').validate(function (categories) {
  const categoryNames = categories.map(cat => cat.name.toLowerCase());
  const uniqueNames = new Set(categoryNames);
  return categoryNames.length === uniqueNames.size;
}, 'Duplicate category names are not allowed for the same user');

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User; // Export user model for use in other files
