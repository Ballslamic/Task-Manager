const express = require("express");
const mongoose = require('mongoose'); // Add this line
const { sanitizeInput, sanitizeParam } = require("../middlewares/sanitize");
const User = require("../models/userModel");
const auth = require("../middlewares/auth");

const router = express.Router();

/**
 * @route POST /categories/categories/add
 * @description Add a new category for the authenticated user
 * @access Private
 */
router.post("/categories/add", [
    auth,
    sanitizeInput("categoryName"),
    sanitizeInput("colorCode")
], async (req, res) => {
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

/**
 * @route GET /categories/categories
 * @description Get all categories for the authenticated user
 * @access Private
 */
router.get("/categories", auth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ categories: user.categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /categories/categories/edit/:id
 * @description Edit an existing category for the authenticated user
 * @access Private
 */
router.put("/categories/edit/:id", [
    auth,
    sanitizeParam("id"),
    sanitizeInput("categoryName"),
    sanitizeInput("colorCode")
], async (req, res) => {
    try {
        const { categoryName, colorCode } = req.body;
        const categoryId = req.params.id;
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ error: 'Invalid category ID' });
        }

        // Find the category index
        const categoryIndex = user.categories.findIndex(cat => cat._id.toString() === categoryId);
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Validate input
        if (typeof categoryName !== 'string' || typeof colorCode !== 'string') {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Update the category
        user.categories[categoryIndex].name = categoryName;
        user.categories[categoryIndex].colorCode = colorCode;
        await user.save();

        res.status(200).json({ category: user.categories[categoryIndex] });
    } catch (error) {
        console.error("Error updating category:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route DELETE /categories/categories/delete/:id
 * @description Delete a category for the authenticated user
 * @access Private
 */
router.delete("/categories/delete/:id", [
    auth,
    sanitizeParam("id")
], async (req, res) => {
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
