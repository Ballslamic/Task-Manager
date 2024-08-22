const express = require("express");
const User = require("../models/userModel");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
  res.send("User route is working");
});

// Register user
router.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    var user = await User.findOne({ email });
    if (user) {
      throw new Error("Email already in use");
    }

    user = await User.findOne({
      userName: {
        $regex: new RegExp(userName, "i"),
      }
    });
    if (user) {
      throw new Error("User name already in use");
    }

    user = new User({ userName, email, password });
    await user.save();
    res.status(201).send({ user, message: "User created successfully" });
  } catch (err) {
    res.status(400).send({ error: "Unable to register" + err });
  }
});

// login as a user
router.post("/login", async (req, res) => {
  try {
    const { userName , password } = req.body;
    const user = await User.findOne({
      userName: {
        $regex: new RegExp(userName, "i"),
      }
    });

    if (!user) {
      throw new Error("Unable to login / User not found. D:");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Unable to login / wrong password. D: ");
    }

    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET_KEY
    );

    res.status(201).send({ user, token, message: "Logged in successfully!! :D" });
  } catch (err) {
    res.status(400).send({ error: "Unable to Login???? " + err });
  }
});

module.exports = router;
