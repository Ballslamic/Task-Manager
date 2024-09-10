require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const User = require('../models/userModel'); // Import the User model
const Task = require('../models/taskModel'); // Import the Task model

const TEST_USER_PREFIX = 'testuser_';

describe('Task Routes', () => {
    let testUser, testCategory, token;

    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        console.log('Connected to database');

        // Register and log in a user to obtain a token for authenticated requests
        testUser = new User({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'testpassword123'
        });
        testUser.categories.push({ name: 'TestCategory', colorCode: '#FF0000' });
        await testUser.save();

        const loginRes = await request(app)
            .post('/user/login')
            .send({ email: testUser.email, password: 'testpassword123' });
        token = loginRes.body.token;
        testCategory = testUser.categories[0];

        console.log('Test user created:', testUser.userName);
        console.log('Test category created:', testCategory.name);
    });

    afterAll(async () => {
        // Clean up the database by deleting only the tasks, users, and categories created during tests
        await Task.deleteMany({ owner: testUser._id });
        await User.deleteOne({ _id: testUser._id });
        await mongoose.connection.close();
        console.log('Disconnected from database');
    });

    afterEach(async () => {
        // Clean up tasks after each test to avoid conflicts
        await Task.deleteMany({ owner: testUser._id });
    });

    // Test case: Should create a new task
    it('should create a new task', async () => {
        console.log('Token:', token);
        const res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Test Task',
                category: testCategory._id
            });

        console.log('Response:', res.body);
        console.log('Status:', res.status);

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
        const task = await Task.create({
            taskDesc: 'Initial Task Description',
            owner: testUser._id,
            category: testCategory._id
        });

        console.log('Token:', token);
        const res = await request(app)
            .put(`/task/updateTask/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Updated Task Description',
            });

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(200); // Expect status code 200 for successful update
        expect(res.body.task.taskDesc).toBe('Updated Task Description'); // Ensure the task description is updated
    });

    // Test case: Should delete a task
    it('should delete a task', async () => {
        const task = await Task.create({
            taskDesc: 'Delete Me',
            owner: testUser._id,
            category: testCategory._id
        });

        console.log('Token:', token);
        const res = await request(app)
            .delete(`/task/deleteTask/${task._id}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(200); // Expect status code 200 for successful deletion

        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull(); // Ensure the task has been deleted
    });

    // Test case: Should not get tasks with an invalid token
    it('should not get tasks with an invalid token', async () => {
        console.log('Invalid Token: invalidtoken');
        const res = await request(app)
            .get('/task/getTasks')
            .set('Authorization', 'Bearer invalidtoken');

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(401); // Expect status code 401 for unauthorized access
    });
});
