const express = require("express");
const User = require("../models/userModel");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Tests user route to make sure it is working
router.get("/", (req, res) => {
  res.send("User route is working");
});

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body; // Extract data from the request body

    var user = await User.findOne({ email }); // Searches if the EXACT (case-sensitive) email adress is in use
    if (user) {
      throw new Error("Email already in use");
    }

    user = await User.findOne({ // Searches if the userName (case in-sensitive for uniqueness) is in use
      userName: {
        $regex: new RegExp(userName, "i"),
      }
    });
    if (user) {
      throw new Error("User name already in use");
    }

    user = new User({ userName, email, password }); // Registers new user with the given information
    await user.save(); // Makes sure it saves properly
    res.status(201).send({ user, message: "User created successfully" });
  } catch (err) {
    res.status(400).send({ error: "Unable to register: " + err });
  }
});

// login as a user
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body; // Extract data from the request body
    const user = await User.findOne({ // Searches if the userName (case in-sensitive for uniqueness) is in the database
      userName: {
        $regex: new RegExp(userName, "i"),
      }
    });

    if (!user) {
      throw new Error("Unable to login / User not found. D:");
    }

    const isMatch = await bcrypt.compare(password, user.password); // Checks if the password matches the hased password in the database
    if (!isMatch) {
      throw new Error("Unable to login / wrong password. D: "); // Throws this error if the password is incorrect
    }

    const token = jwt.sign( // Creates an unlimited-time token (for our testing purposes) linked to the user's login for use in authentication
      { _id: user._id.toString() },
      process.env.JWT_SECRET_KEY
    );

    res.status(201).send({ user, token, message: "Logged in successfully!! :D" }); // Returns the user, their token, and a short message if successful
  } catch (err) {
    res.status(400).send({ error: "Unable to Login???? " + err }); // Returns error + more information
  }
});

module.exports = router;
