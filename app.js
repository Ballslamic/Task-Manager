const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

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
app.use('/categories', categoryRoutes);

// Log registered routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log(r.route.stack[0].method.toUpperCase(), r.route.path);
    } else if (r.name === 'router') {
        r.handle.stack.forEach(function(nestedRoute){
            if (nestedRoute.route) {
                console.log(nestedRoute.route.stack[0].method.toUpperCase(), r.regexp.toString().split('\\')[1] + nestedRoute.route.path);
            }
        });
    }
});

// Catch-all route for unmatched routes
app.use((req, res, next) => {
    console.log(`Unmatched route: ${req.method} ${req.originalUrl}`);
    res.status(404).send('Not Found');
});

// Root route
app.get('/', (req, res) => {
    res.send('Task Manager API is running!');
});

// Don't start the server here, just export the app
module.exports = app;
