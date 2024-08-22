const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoute = require('./routes/userRoute');
const taskRoute = require('./routes/taskRoute');
const categoryRoute = require('./routes/categoryRoute');

require('dotenv').config();
require('./models/dbModel')
require('./models/categoryModel')
require('./models/taskModel')
require('./models/userModel')
const PORT = process.env.PORT;

const app = express();
// Middlware
app.use(bodyParser.json());
app.use('/user', userRoute);
app.use('/task', taskRoute);
app.use('/category', categoryRoute);
// app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.json({
        message: 'Task Manager App is working! :D'
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
