const express = require("express");
const User = require("../models/userModel");
const auth = require("../middlewares/auth");
const router = express.Router();

// Tests user route to make sure it is working
router.get("/", (req, res) => {
  res.send("User route is working");
});

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// login as a user
router.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.userName, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: "Unable to login: " + error.message });
  }
});

// Update user's email
router.put("/updateUser/:id", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['email']; // Add other fields if needed
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }

    if (req.user._id.toString() !== user._id.toString()) {
      return res.status(403).send({ error: "Not authorized to update this user" });
    }

    updates.forEach((update) => user[update] = req.body[update]);
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a user
router.delete("/deleteUser/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    if (req.user._id.toString() !== user._id.toString()) {
      return res.status(403).send({ error: "Not authorized to delete this user" });
    }
    await User.deleteOne({ _id: user._id }); // Use deleteOne instead of remove
    res.send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
