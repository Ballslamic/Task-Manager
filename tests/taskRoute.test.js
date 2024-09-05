require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const Task = require('../models/taskModel'); // Import the Task model
const User = require('../models/userModel'); // Import the User model
const Category = require('../models/categoryModelUnused'); // Import the Category model

describe('Task Routes', () => {
    let testUser, testCategory, token;

    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });

        // Register and log in a user to obtain a token for authenticated requests
        testUser = await User.create({ userName: 'TestUser', email: 'testuser@example.com', password: 'testpassword' });
        const loginRes = await request(app)
            .post('/user/login')
            .send({ email: 'testuser@example.com', password: 'testpassword' });
        token = loginRes.body.token;
        
        testCategory = await Category.create({ 
            name: 'TestCategory', 
            colorCode: '#FF0000', 
            owner: testUser._id 
        });
    });

    afterAll(async () => {
        // Clean up the database by deleting only the tasks, users, and categories created during tests
        await Task.deleteMany({ owner: testUser._id });
        await User.deleteOne({ userName: 'TestUser' });
        await Category.deleteOne({ _id: testCategory._id });
        // Close the MongoDB connection after all tests have run
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up tasks after each test to avoid conflicts
        await Task.deleteMany({ owner: testUser._id });
    });

    // Test case: Should create a new task
    it('should create a new task', async () => {
        const res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`) // Set the Authorization header with the token
            .send({
                taskDesc: 'Test Task',
                category: testCategory._id
            });

        expect(res.statusCode).toEqual(201); // Expect status code 201 for successful creation
        expect(res.body.task).toHaveProperty('_id'); // Ensure the task has an ID
        expect(res.body.task.owner.toString()).toBe(testUser._id.toString()); // Ensure the owner is set correctly
    });

    // Test case: Should not allow a task with an invalid owner reference
    it('should not allow a task with an invalid owner reference', async () => {
        console.log(token); // Log the token for debugging
        const res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`) // Set the Authorization header with the token
            .send({
                taskDesc: 'Test Invalid Task',
                category: testCategory._id
            });

        console.log("Response:", res.body); // Log the response for debugging

        // The task should be created successfully, but with the authenticated user as owner
        expect(res.statusCode).toEqual(201);
        expect(res.body.task.owner.toString()).toBe(testUser._id.toString());
    });

    // Test case: Should update a task's description
    it('should update a task\'s description', async () => {
        console.log(token); // Log the token for debugging
        const task = await Task.create({
            taskDesc: 'Initial Task Description',
            owner: testUser._id,
            category: testCategory._id
        });

        const res = await request(app)
            .put(`/task/updateTask/${task._id}`)
            .set('Authorization', `Bearer ${token}`) // Set the Authorization header with the token
            .send({
                taskDesc: 'Updated Task Description',
            });

        console.log("Response:", res.body); // Log the response for debugging

        expect(res.statusCode).toEqual(200); // Expect status code 200 for successful update
        expect(res.body.task.taskDesc).toBe('Updated Task Description'); // Ensure the task description is updated
    });

    // Test case: Should delete a task
    it('should delete a task', async () => {
        console.log(token); // Log the token for debugging
        const task = await Task.create({
            taskDesc: 'Delete Me',
            owner: testUser._id,
            category: testCategory._id
        });

        const res = await request(app)
            .delete(`/task/deleteTask/${task._id}`)
            .set('Authorization', `Bearer ${token}`); // Set the Authorization header with the token

        console.log("Response:", res.body); // Log the response for debugging

        expect(res.statusCode).toEqual(200); // Expect status code 200 for successful deletion

        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull(); // Ensure the task has been deleted
    });

    // Test case: Should not get tasks with an invalid token
    it('should not get tasks with an invalid token', async () => {
        console.log(token); // Log the token for debugging
        const res = await request(app)
            .get('/task/getTasks')
            .set('Authorization', 'Bearer invalidtoken'); // Set an invalid Authorization header

        console.log("Response: ", res.body); // Log the response for debugging

        expect(res.statusCode).toEqual(401); // Expect status code 401 for unauthorized access
    });
});
