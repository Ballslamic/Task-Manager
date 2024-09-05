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
    lowercase: true, // Converts email to lowercase before saving \post-tests
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
    }
  }]
});

// Custom method to convert user object to JSON
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  return userObject;
};

// Custom method to generate authentication token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Custom static method to find user by credentials
userSchema.statics.findByCredentials = async (userName, password) => {
  const user = await User.findOne({ userName });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
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
const User = mongoose.model("User", userSchema);
module.exports = User; // Export user model for use in other files
