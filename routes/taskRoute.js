const express = require("express");

const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/taskModel");

router.get("/test", auth, (req, res) => {
  res.json({
    message: "Task routes are working!",
    user: req.user,
  });
});

// Create Task
router.post("/createTask", auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });
    await task.save();
    res.status(201).json({ task, message: "Task created successfully ;) " });
  } catch (err) {
    res.status(400).send({ err });
  }
});

// Read(get) all Tasks
router.get("/getTask", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      owner: req.user._id,
    });
    res
      .status(201)
      .json({ tasks, count: tasks.length, message: "Here ya goooooo" });
  } catch (err) {
    res.status(400).send({ err });
  }
});

// Read(get) specific Task
router.get("/getTask:id", auth, async (req, res) => {
  try {
    const taskid = req.params.id;

    const task = await Task.findOne({
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
router.patch("/updateTask:id", auth, async (req, res) => {
  const taskid = req.params.id;
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "taskDesc",
    "completed",
    "startDateTime",
    "dueDateTime",
    "category",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res
      .status(401)
      .send({ message: "Invalid operations; How'd ya manage that" });
  }
  try {
    const task = await Task.findOne({
      _id: taskid,
      owner: req.user._id,
    });
    if (!task) {
      res.status(404).json({ message: "Task not found! D: " });
    }
    
    updates.forEach(update => task[update] = req.body[update]);
    await task.save();

    res.status(400).json({ task, message: "Task updated succesfully! " });
    
  } catch (err) {
    res.status(400).send({ err });
  }
});

// Delete Task
router.delete("/deleteTask:id", auth, async (req, res) => {
    const taskid = req.params.id;
    try {
      const task = await Task.findOneAndDelete({
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
