const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    colorCode: { type: String, required: true } // Stored as a hex value
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
