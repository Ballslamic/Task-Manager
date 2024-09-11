require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/userModel');
const Task = require('../models/taskModel');

/**
 * Integration Tests for Task Manager API
 * 
 * These tests cover the entire flow of user registration, login,
 * category and task creation, and retrieval. They also test for
 * proper handling of invalid inputs and potential NoSQL injection attempts.
 */

describe('Integration Tests', () => {
    let testUser, token;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Task.deleteMany({});
        await mongoose.connection.close();
    });

    it('should register a user, login, create categories and tasks, then retrieve tasks', async () => {
        // Register a new user
        const registerRes = await request(app)
            .post('/user/register')
            .send({
                userName: 'integrationTestUser',
                email: 'integration@test.com',
                password: 'TestPassword123!'
            });
        expect(registerRes.statusCode).toBe(201);
        testUser = registerRes.body.user;

        // Login
        const loginRes = await request(app)
            .post('/user/login')
            .send({
                email: 'integration@test.com',
                password: 'TestPassword123!'
            });
        expect(loginRes.statusCode).toBe(200);
        token = loginRes.body.token;

        // Create categories
        const category1Res = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Work',
                colorCode: '#FF0000'
            });
        expect(category1Res.statusCode).toBe(201);

        const category2Res = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Personal',
                colorCode: '#00FF00'
            });
        expect(category2Res.statusCode).toBe(201);

        // Create tasks
        const task1Res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Complete project',
                category: category1Res.body.category._id
            });
        expect(task1Res.statusCode).toBe(201);

        const task2Res = await request(app)
            .post('/task/createTask')
            .set('Authorization', `Bearer ${token}`)
            .send({
                taskDesc: 'Go grocery shopping',
                category: category2Res.body.category._id
            });
        expect(task2Res.statusCode).toBe(201);

        // Retrieve all tasks
        const getTasksRes = await request(app)
            .get('/task/getTasks')
            .set('Authorization', `Bearer ${token}`);
        expect(getTasksRes.statusCode).toBe(200);
        expect(getTasksRes.body.tasks.length).toBe(2);

        // Verify task details
        const tasks = getTasksRes.body.tasks; 
        expect(tasks.some(task => task.taskDesc === 'Complete project')).toBeTruthy();
        expect(tasks.some(task => task.taskDesc === 'Go grocery shopping')).toBeTruthy();
    });

    it('should handle invalid input and prevent NoSQL injection', async () => {

        // Create a category first
        const createCategoryRes = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Test Category',
                colorCode: '#FF0000'
            });
        expect(createCategoryRes.statusCode).toBe(201);

        // Attempt to update the category with invalid data
        const invalidCategoryRes = await request(app)
            .put(`/categories/categories/edit/${createCategoryRes.body.category._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: { $ne: null },
                colorCode: 'invalid_color'
            });
        expect(invalidCategoryRes.statusCode).toBe(400);

        // Log the response body for debugging
        console.log('Invalid category update response:', invalidCategoryRes.body);

    });
});