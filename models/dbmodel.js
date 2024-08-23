const mongoose = require('mongoose');
require('dotenv').config(); // Load enviornment variables from .env file

const MONGO_URL = process.env.MONGO_URL; // MongoDB connection from .env file
const DB_NAME = process.env.DB_NAME; // Database name for MongoDB, from .env file

mongoose.connect(MONGO_URL, { // Connect to a Mongo database (DB_NAME), @MONGO_URL
    dbName: DB_NAME
}).then(
    () => {
        console.log('Connected to Database :D'); // Return if connected properly 
    }
).catch((err) => {
    console.log('Error connecting to Database' + err); // Return of connection fails
});
