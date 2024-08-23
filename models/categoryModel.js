const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }, //Name of the category
    colorCode: { type: String, required: true } // Color stored as a hex value
});

const Category = mongoose.model('Category', categorySchema); // Create the Category model
module.exports = Category; // Export the model for use in other files 
