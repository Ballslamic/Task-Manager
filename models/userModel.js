const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Define the schema for categories
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  colorCode: {
    type: String,
    required: true
  }
});

// Define the schema for users
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true, // Ensures the username is unique
    trim: true, // Removes any surrounding spaces
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures the email is unique
    lowercase: true, // Converts email to lowercase before saving
    trim: true, // Removes any surrounding spaces
  },
  password: {
    type: String,
    required: true,
    minlength: 7, // Minimum password length
    trim: true, // Removes any surrounding spaces
  },
  categories: {
    type: [categorySchema],
    validate: {
      // Custom validator to ensure category names are unique for a user
      validator: function(categories) {
        const categoryNames = categories.map(cat => cat.name);
        const uniqueNames = new Set(categoryNames);
        return categoryNames.length === uniqueNames.size;
      },
      message: 'Duplicate category names are not allowed'
    }
  },
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

// Custom method to convert user object to JSON
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();
  
  // Remove sensitive information before sending user data
  delete userObject.password;
  delete userObject.tokens;
  
  return userObject;
};

// Custom method to generate authentication token with expiration
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  // Create a new JWT token with 30 minutes expiration
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );
  
  // Add the token to the user's tokens array with expiration time
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30);
  
  user.tokens = user.tokens.concat({ token, expiresAt: expirationTime });
  await user.save();
  
  return token;
};

// Method to remove expired tokens
userSchema.methods.removeExpiredTokens = async function() {
  const user = this;
  const currentTime = new Date();
  
  user.tokens = user.tokens.filter(tokenObj => tokenObj.expiresAt > currentTime);
  await user.save();
};

// Static method to find user by credentials
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

// Hash the password before saving to the database
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8); // Hash the password with a salt round of 8
  }

  next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User; // Export user model for use in other files
