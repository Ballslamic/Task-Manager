const mongoose = require("mongoose");

// Define the schema for tasks
const taskSchema = new mongoose.Schema({
    taskDesc: {
        type: String,
        required: true,
        trim: true // Removes whitespace from both ends of the string
    },
    completed: {
        type: Boolean,
        default: false // Tasks are not completed by default
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // References the User model
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category' // References the Category model
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    startTime: {
        type: String // Stored as a string, e.g., "14:30"
    },
    endTime: {
        type: String // Stored as a string, e.g., "16:00"
    },
    recurrence: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
        default: 'none'
    }
}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create a compound index for efficient querying
taskSchema.index({ owner: 1, completed: 1 });

// Define a pre-save middleware
taskSchema.pre('save', async function(next) {
    const task = this;
    // Custom logic can be added here, for example:
    // - Validate date ranges
    // - Set default values
    // - Perform any necessary data transformations

    next();
});

// Define a method to format the task for API responses
taskSchema.methods.toJSON = function() {
    const task = this;
    const taskObject = task.toObject();

    // Add any custom formatting here, for example:
    // - Convert dates to a specific format
    // - Add calculated fields

    return taskObject;
};

// Create the Task model from the schema
const Task = mongoose.model('Task', taskSchema);

module.exports = Task; // Export the model for use in other files
