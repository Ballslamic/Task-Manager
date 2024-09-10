const mongoose = require("mongoose");

// Define a schema for recurrence rules
const recurrenceRuleSchema = new mongoose.Schema({
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: true
    },
    daysOfWeek: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    interval: {
        type: Number,
        default: 1
    },
    endDate: Date
});

// Define a schema for excluded dates
const excludedDateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    reason: String
});

// Modify the task schema
const taskSchema = new mongoose.Schema({
    taskDesc: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    startTime: String,
    endTime: String,
    recurrenceRule: recurrenceRuleSchema,
    excludedDates: [excludedDateSchema]
}, {
    timestamps: true
});

// Create a compound index for efficient querying
taskSchema.index({ owner: 1, completed: 1 });

// Define a pre-save middleware
taskSchema.pre('save', async function(next) {
    const task = this;
    // Custom logic can be added here

    next();
});

// Define a method to format the task for API responses
taskSchema.methods.toJSON = function() {
    const task = this;
    const taskObject = task.toObject();

    // Add custom formatting here

    return taskObject;
};

// Create the Task model from the schema
const Task = mongoose.model("Task", taskSchema);

module.exports = Task; // Export the model for use in other files
