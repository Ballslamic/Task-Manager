const mongoose = require("mongoose");

// Define a schema for recurrence details
const recurrenceSchema = new mongoose.Schema({
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly", "yearly"], // Allowed values for frequency
    required: false, // Optional field \post-tests
  },
  daysOfWeek: {
    type: [String],
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], // Allowed values for days of the week
    required: function () {
      return this.frequency === "weekly"; // Required only if frequency is weekly \post-tests
    },
  },
  endDate: {
    type: Date,
    required: false, // Optional end date for recurrence \post-tests
  }
});

// Define the schema for tasks
const taskSchema = new mongoose.Schema({
  taskDesc: {
    type: String,
    required: true,
    trim: true, // Removes any surrounding spaces
  },
  createdAt: {
    type: Date,
    default: Date.now, // Sets the creation date to the current date
  },
  startDate: {
    type: Date,
    required: false, // Optional start date provided by the user \post-tests
  },
  startTime: {
    type: String,
    required: false, // Optional start time in HH:MM format \post-tests
  },
  endDate: {
    type: Date,
    required: false, // Optional end date provided by the user \post-tests
  },
  endTime: {
    type: String,
    required: false, // Optional end time in HH:MM format \post-tests
  },
  recurrence: recurrenceSchema, // Add recurrence information to the task \post-tests
  completed: {
    type: Boolean,
    default: false, // Default status is incomplete
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Each task must have an owner
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true, // Optional category association
  },
}, {
  timestamps: true
});

// Create the Task model
const Task = mongoose.model("Task", taskSchema);
module.exports = Task; // Export the model for use in other files
