const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// Route to display all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find({});  // Fetch all categories from the database
    res.render("categories", { categories });  // Render the categories view with the fetched categories
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to create a new category
router.post("/categories/add", async (req, res) => {
  try {
    const { categoryName, colorCode } = req.body;  // Extract data from the request body

    const newCategory = new Category({
      name: categoryName,
      colorCode: colorCode,
    });

    await newCategory.save();  // Save the new category to the database
    res.redirect("/categories");  // Redirect to the categories page after creation
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to edit an existing category
router.post("/categories/edit/:id", async (req, res) => {
  try {
    const { categoryName, colorCode } = req.body;
    await Category.findByIdAndUpdate(req.params.id, {
      name: categoryName,
      colorCode: colorCode,
    });
    res.redirect("/categories");  // Redirect to the categories page after editing
  } catch (error) {
    console.error("Error editing category:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to delete a category
router.post("/categories/delete/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);  // Delete the category from the database
    res.redirect("/categories");  // Redirect to the categories page after deletion
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
