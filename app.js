const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
require('dotenv').config();
require('./models/dbmodel');

const app = express();

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
    .then(() => console.log('Connected to Database :D'))
    .catch((err) => console.error('Error connecting to database:', err));

app.use('/user', userRoutes);
app.use('/task', taskRoutes);
app.use('/category', categoryRoutes);

app.get('/', (req, res) => {
    res.send('Task Manager API is running!');
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
    });
}

module.exports = app;
