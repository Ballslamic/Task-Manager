const express = require("express");

const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/taskModel");

// Tests user task route to make sure it is working AND a user is logged in
router.get("/test", auth, (req, res) => {
    res.json({
        message: "Task routes are working!",
        user: req.user,
    });
});

// Create Task
router.post("/createTask", auth, async (req, res) => { // Requires a logged-in user
    try {
        const task = new Task({ // Creates new task based on fields given by the user
            ...req.body,
            owner: req.user._id,
        });
        await task.save(); // Makes sure it saves properly
        res.status(201).json({ task, message: "Task created successfully ;) " });
    } catch (err) {
        res.status(400).send({ err });
    }
});

// Read(get) all Tasks
router.get("/getTask", auth, async (req, res) => { // Requires a logged-in user 
    try {
        const tasks = await Task.find({ // Finds all tasks belonging to the user
            owner: req.user._id,
        });
        res
            .status(201)
            .json({ tasks, count: tasks.length, message: "Here ya goooooo" }); // Returns all tasks, the number of tasks, 
    } catch (err) {
        res.status(400).send({ err });
    }
});

// Read(get) specific Task
router.get("/getTask:id", auth, async (req, res) => { // Requires a logged-in user + a task id
    try {
        const taskid = req.params.id;

        const task = await Task.findOne({ // Finds the specified task based on the given id
            _id: taskid,
            owner: req.user._id,
        });
        if (!task) {
            res.status(404).json({ message: "Task not found! D: " });
        }
        res.status(201).json({ task, message: "Here ya goooooo " });
    } catch (err) {
        res.status(400).send({ err });
    }
});

// Updates specific Task
router.patch("/updateTask:id", auth, async (req, res) => { // Requires a logged-in user, and a specified task
    const taskid = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = [ // List of fields alloewd to be chagned / added (if not set initially)
        "taskDesc",
        "completed",
        "startDateTime",
        "dueDateTime",
        "category",
    ];

    const isValidOperation = updates.every((update) => // Ensures the columns the user is
        allowedUpdates.includes(update) // Attempting to update are valid and allowed
    );

    if (!isValidOperation) {
        return res
            .status(401)
            .send({ message: "Invalid operations; How'd ya manage that (I'M CALLING THE COPS)" }); // If not.. CALL THE COPS, HOMELAND SECURITY, HOMELANDER!!
        // THIS ERROR SHOULD NOT BE POSSIBLE FROM THE FRONT END!!!
    }
    try {
        const task = await Task.findOne({ // Finds the specified task
            _id: taskid,
            owner: req.user._id,
        });
        if (!task) {
            res.status(404).json({ message: "Task not found! D: " });
        }

        updates.forEach(update => task[update] = req.body[update]); // Updates user-specified fields
        await task.save(); // Ensures the updates save

        res.status(400).json({ task, message: "Task updated succesfully! " });

    } catch (err) {
        res.status(400).send({ err });
    }
});

// Delete Task
router.delete("/deleteTask:id", auth, async (req, res) => { // Requires a logged-in user, and a specified task
    const taskid = req.params.id;
    try {
        const task = await Task.findOneAndDelete({ // Finds and deletes the specified task
            _id: taskid,
            owner: req.user._id,
        });

        if (!task) {
            res.status(404).json({ message: "Task not found! D: " });
        }


        res.status(400).json({ task, message: "Task updated succesfully! " });

    } catch (err) {
        res.status(400).send({ err });
    }
});


module.exports = router;
