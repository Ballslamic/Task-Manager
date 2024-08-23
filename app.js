const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoute = require("./routes/userRoute");
const taskRoute = require("./routes/taskRoute");
const categoryRoute = require("./routes/categoryRoute");

require("dotenv").config(); // Load environment variables from .env file
require("./models/dbModel"); // Connect to the database
require("./models/categoryModel"); // Load the Category model
require("./models/taskModel"); // Load the Task model
require("./models/userModel"); // Load the User model
const PORT = process.env.PORT; // Define the port from environment variables

const app = express();
// Middlware
app.use(bodyParser.json()); // Middleware to parse JSON bodies in requests
app.use("/user", userRoute); // Routes for user-related endpoints
app.use("/task", taskRoute); // Routes for task-related endpoints
app.use("/category", categoryRoute); // Routes for category-related endpoints
// app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.json({
        message: "Task Manager App is working! :D",
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
