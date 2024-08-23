const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  userName: { type: String, required: true }, // User's username 
  email: { type: String, required: true }, // User's email address 
  password: { type: String, required: true }, // User's password
});

// Hask the password befor saving to the database
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next();
});

const User = mongoose.model("User", userSchema); // Create user model
module.exports = User; // Export user model for use in other files
