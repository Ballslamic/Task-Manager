const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Database connection
mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
    .then(() => console.log('Connected to Database :D'))
    .catch((err) => console.error('Error connecting to database:', err));

// Routes
app.use('/user', userRoutes);
app.use('/task', taskRoutes);
app.use('/category', categoryRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Task Manager API is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

// Export both app and server for Electron integration
module.exports = { app, server };
