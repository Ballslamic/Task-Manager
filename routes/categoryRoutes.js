const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const auth = require("../middlewares/auth");

// Route to add a new category
router.post("/categories/add", auth, async (req, res) => {
  try {
    const { categoryName, colorCode } = req.body;
    const user = req.user;

    // Check if the category name already exists for this user
    const categoryExists = user.categories.some(cat => cat.name === categoryName);
    if (categoryExists) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    // Add the new category to the user's categories array
    user.categories.push({ name: categoryName, colorCode });
    await user.save();

    res.status(201).json({ category: user.categories[user.categories.length - 1] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to get all categories for a user
router.get("/categories", auth, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ categories: user.categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to edit a category
router.put("/categories/edit/:id", auth, async (req, res) => {
  try {
    const { categoryName, colorCode } = req.body;
    const categoryId = req.params.id;
    const user = req.user;

    // Find the category in the user's categories array
    const categoryIndex = user.categories.findIndex(cat => cat._id.toString() === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update the category
    user.categories[categoryIndex].name = categoryName;
    user.categories[categoryIndex].colorCode = colorCode;
    await user.save();

    res.status(200).json({ category: user.categories[categoryIndex] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route to delete a category
router.delete("/categories/delete/:id", auth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const user = req.user;

    // Remove the category from the user's categories array
    user.categories = user.categories.filter(cat => cat._id.toString() !== categoryId);
    await user.save();

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
