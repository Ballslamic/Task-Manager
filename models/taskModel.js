const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskDesc: { type: String, required: true }, // Name\description of the task
  createdAt: { type: Date, default: mongoose.now }, // A timestamp (Can also just use timestamp) for when the task was created
  startDateTime: { type: Date, required: false }, // Date\time the task is set to start at, if the task is time-based
  dueDateTime: { type: Date, required: false }, // Date\time the task is set to end at, if the task is time-based
  completed: { type: Boolean, default: false }, // Task's completion status
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // References who (what account / user) owns this task
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // References what category (if any) owns this task
    required: false,
  },
});

const Task = mongoose.model("Task", taskSchema); // Create the task model
module.exports = Task; // Export the model for use in other files
