const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // Ensure auth middleware is required
const Task = require('../models/taskModel');
const User = require('../models/userModel');

// Create a new task
router.post('/createTask', auth, async (req, res) => {
    try {
        const { taskDesc, category } = req.body;
        const owner = req.user._id; // Use the authenticated user's ID

        const newTask = new Task({
            taskDesc,
            owner,
            category,
        });

        await newTask.save();
        res.status(201).json({ task: newTask, message: 'Task created successfully' });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update an existing task
router.put('/updateTask/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ["taskDesc", "completed", "startDate", "endDate", "startTime", "endTime", "category", "recurrence"];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).send({ message: "Invalid updates!" });
        }

        updates.forEach(update => task[update] = req.body[update]);
        await task.save();

        res.status(200).json({ task, message: 'Task updated successfully' });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a task
router.delete('/deleteTask/:id', auth, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ task, message: 'Task deleted successfully' });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get tasks (example route)
router.get('/getTasks', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id });
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
