const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const auth = require("../middlewares/auth");

// Get all categories for the authenticated user
router.get("/categories", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new category
router.post("/categories/add", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const newCategory = {
      name: req.body.categoryName,
      colorCode: req.body.colorCode
    };
    user.categories.push(newCategory);
    await user.save();
    console.log('New category added:', newCategory);
    res.status(201).json({ category: newCategory, message: "Category created successfully" });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(400).json({ error: error.message });
  }
});

// Edit a category
router.put("/categories/edit/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const category = user.categories.id(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    category.name = req.body.categoryName || category.name;
    category.colorCode = req.body.colorCode || category.colorCode;
    await user.save();
    console.log('Category updated:', category);
    res.json({ category, message: "Category updated successfully" });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete a category
router.delete("/categories/delete/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const category = user.categories.id(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    user.categories.pull(category);
    await user.save();
    console.log('Category deleted:', category);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
