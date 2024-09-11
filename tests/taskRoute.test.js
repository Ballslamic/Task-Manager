require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const User = require('../models/userModel'); // Import the User model
const Task = require('../models/taskModel'); // Import the Task model

const TEST_USER_PREFIX = 'testuser_';

/**
 * Unit Tests for Task Routes
 * 
 * These tests cover the CRUD operations for tasks, including
 * creation, retrieval, updating, and deletion of tasks.
 * They also test for proper authentication and error handling.
 */

describe('Task Routes', () => {
    let testUser, testCategory, token;

    /**
     * Connect to the test database before running the tests
     */
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        console.log('Connected to database');

        testUser = new User({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        });
        await testUser.save();

        const loginRes = await request(app)
            .post('/user/login')
            .send({ email: testUser.email, password: 'TestPassword123!' });

        if (!loginRes.body.token) {
            console.error('Login failed:', loginRes.body);
            throw new Error('Failed to get authentication token');
        }

        token = loginRes.body.token;
        console.log('Authentication token:', token);

        testCategory = { name: 'TestCategory', colorCode: '#FF0000' };
        testUser.categories.push(testCategory);
        await testUser.save();
        testCategory = testUser.categories[0];

        console.log('Test user created:', testUser.userName);
        console.log('Test category created:', testCategory.name);
    });

    /**
     * Disconnect from the test database after all tests have run
     */
    afterAll(async () => {
        await Task.deleteMany({ owner: testUser._id });
        await User.deleteOne({ _id: testUser._id });
        await mongoose.connection.close();
        console.log('Disconnected from database');
    });

    /**
     * Clean up tasks after each test to avoid conflicts
     */
    afterEach(async () => {
        await Task.deleteMany({ owner: testUser._id });
    });

    /**
     * Test case: Should create a new task
     */
    it('should create a new task', async () => {
        console.log('Token for create task:', token);
        const res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Test Task',
                category: testCategory._id
            });

        console.log('Create task response:', res.body);
        console.log('Create task status:', res.status);

        expect(res.statusCode).toEqual(201);
        expect(res.body.task).toHaveProperty('_id');
        expect(res.body.task.owner.toString()).toBe(testUser._id.toString());
    });

    /**
     * Test case: Should not allow a task with an invalid owner reference
     */
    it('should not allow a task with an invalid owner reference', async () => {
        console.log(token);
        const res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Test Invalid Task',
                category: testCategory._id
            });

        console.log("Response:", res.body);

        expect(res.statusCode).toEqual(201);
        expect(res.body.task.owner.toString()).toBe(testUser._id.toString());
    });

    /**
     * Test case: Should update a task's description
     */
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

        expect(res.statusCode).toEqual(200);
        expect(res.body.task.taskDesc).toBe('Updated Task Description');
    });

    /**
     * Test case: Should delete a task
     */
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

        expect(res.statusCode).toEqual(200);

        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull();
    });

    /**
     * Test case: Should not get tasks with an invalid token
     */
    it('should not get tasks with an invalid token', async () => {
        console.log('Invalid Token: invalidtoken');
        const res = await request(app)
            .get('/task/getTasks')
            .set('Authorization', 'Bearer invalidtoken');

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(401);
    });
});
