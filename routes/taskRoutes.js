const express = require('express');
const mongoose = require('mongoose'); // Add this line
const { sanitizeInput, sanitizeParam, validateObjectId } = require('../middlewares/sanitize');
const Task = require('../models/taskModel');
const auth = require('../middlewares/auth');

const router = express.Router();

/**
 * @route POST /task/createTask
 * @description Create a new task
 * @access Private
 */
router.post('/createTask', [
    auth,
    sanitizeInput('taskDesc'),
    validateObjectId('category')
], async (req, res) => {
    try {
        const { taskDesc, category } = req.body;
        const owner = req.user._id;

        // Validate category
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({ error: 'Invalid category ID' });
        }

        const newTask = new Task({
            taskDesc,
            owner,
            category,
        });

        await newTask.save();
        res.status(201).json({ task: newTask, message: 'Task created successfully' });
    } catch (error) {
        console.error("Error creating task:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route PUT /task/updateTask/:id
 * @description Update an existing task
 * @access Private
 */
router.put('/updateTask/:id', [
    auth,
    sanitizeParam('id'),
    sanitizeInput('taskDesc'),
    validateObjectId('category')
], async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Check if the user owns the task
        if (task.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to update this task' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = ["taskDesc", "completed", "startDate", "endDate", "startTime", "endTime", "category", "recurrence"];
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({ error: "Invalid updates!" });
        }

        updates.forEach(update => task[update] = req.body[update]);
        await task.save();

        res.status(200).json({ task, message: 'Task updated successfully' });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route DELETE /task/deleteTask/:id
 * @description Delete a task
 * @access Private
 */
router.delete('/deleteTask/:id', [
    auth,
    sanitizeParam('id')
], async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * @route GET /task/getTasks
 * @description Get all tasks for the authenticated user
 * @access Private
 */
router.get('/getTasks', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id });
        res.status(200).json({ tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
