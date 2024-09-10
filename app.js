const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Middleware


// Database connection
mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
    .then(() => console.log('Connected to Database :D'))
    .catch((err) => console.log('Error connecting to database', err));

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/user', userRoutes);
app.use('/task', taskRoutes);
app.use('/category', categoryRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Task Manager API is running!');
});

// Don't start the server here, just export the app
module.exports = app;
