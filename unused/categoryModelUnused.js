const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { //Name of the category
        type: String,
        required: true,
        trim: true // Removes any surrounding spaces
    }, 
    colorCode: { // Color stored as a hex value
        type: String, 
        required: true
    },
    owner: { // Link to the user who owns this category
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
});

// Compound index to ensure unique category names per user
categorySchema.index({ name: 1, owner: 1 }, { unique: true });

console.log('Category schema indexes:', categorySchema.indexes());

const Category = mongoose.model('Category', categorySchema); // Create the Category model

Category.on('index', function(error) {
    if (error) {
        console.error('Category index error:', error);
    } else {
        console.log('Category indexing completed');
    }
});

// Force the creation of indexes
Category.createIndexes().then(() => {
    console.log('Indexes have been created');
}).catch(err => {
    console.error('Error creating indexes:', err);
});

module.exports = Category; // Export the model for use in other files
