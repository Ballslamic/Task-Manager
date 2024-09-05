const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
require('dotenv').config();
require('./models/dbmodel');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use('/user', userRoutes);
app.use('/task', taskRoutes);
app.use('/category', categoryRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Task Manager App is working! :D'
    });
});

// Export the app instead of starting the server here
module.exports = app;

// If you need to start the server separately (e.g., for production)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
}
