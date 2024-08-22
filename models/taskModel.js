const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskDesc: { type: String, required: true },
  createdAt: { type: Date, default: mongoose.now },
  startDateTime: { type: Date, required: false },
  dueDateTime: { type: Date, required: false },
  completed: { type: Boolean, default: false },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: false,
  },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
