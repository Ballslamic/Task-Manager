const express = require("express");
const { sanitizeInput, sanitizeParam } = require("../middlewares/sanitize");
const User = require("../models/userModel");
const auth = require("../middlewares/auth");
const router = express.Router();

/**
 * @route GET /user
 * @description Test route to check if user routes are working
 * @access Public
 */
router.get("/", (req, res) => {
  res.send("User route is working");
});

/**
 * @route POST /user/register
 * @description Register a new user
 * @access Public
 */
router.post("/register", [
  sanitizeInput("userName"),
  sanitizeInput("email"),
  sanitizeInput("password")
], async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

/**
 * @route POST /user/login
 * @description Login as a user
 * @access Public
 */
router.post("/login", [
  sanitizeInput("email"),
  sanitizeInput("password")
], async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: "Unable to login" });
  }
});

/**
 * @route PUT /user/updateUser/:id
 * @description Update user's email
 * @access Private
 */
router.put("/updateUser/:id", [
  auth,
  sanitizeParam("id"),
  sanitizeInput("userName"),
  sanitizeInput("email"),
  sanitizeInput("password")
], async (req, res) => {
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

/**
 * @route DELETE /user/deleteUser/:id
 * @description Delete a user
 * @access Private
 */
router.delete("/deleteUser/:id", [
  auth,
  sanitizeParam("id")
], async (req, res) => {
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

/**
 * @route POST /user/logout
 * @description Logout a user
 * @access Private
 */
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * @route POST /user/logoutAll
 * @description Logout all sessions
 * @access Private
 */
router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

/**
 * @route GET /user/me
 * @description Get user profile
 * @access Private
 */
router.get("/me", auth, async (req, res) => {
  res.send(req.user);
});

/**
 * @route PATCH /user/me
 * @description Update user profile
 * @access Private
 */
router.patch("/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['userName', 'email', 'password'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach((update) => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(400).send(error);
  }
});

/**
 * @route DELETE /user/me
 * @description Delete user account
 * @access Private
 */
router.delete("/me", auth, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.user._id });
    res.send({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
