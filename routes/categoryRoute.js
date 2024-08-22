const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// Route to display all categories (you can render this on the categories page)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render("categories", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to create a new category
router.post("/categories/add", async (req, res) => {
  try {
    const { categoryName, colorCode } = req.body;

    const newCategory = new Category({
      name: categoryName,
      colorCode: colorCode,
    });

    await newCategory.save();
    res.redirect("/categories");
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
    res.redirect("/categories");
  } catch (error) {
    console.error("Error editing category:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to delete a category
router.post("/categories/delete/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.redirect("/categories");
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
