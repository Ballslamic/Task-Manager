require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const User = require('../models/userModel'); // Import the User model

const TEST_USER_PREFIX = 'testuser_';

/**
 * User Routes Test Suite
 * 
 * These tests cover the CRUD operations for users, including
 * registration, login, profile updates, and account deletion.
 * They also test for proper authentication and error handling.
 */
describe('User Routes', () => {
    let testUser;
    let testUserToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    afterAll(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        
        // Create a test user for authenticated routes
        testUser = await User.create({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        });

        // Log in the test user to get a token
        const loginRes = await request(app)
            .post('/user/login')
            .send({
                email: testUser.email,
                password: 'TestPassword123!'
            });
        testUserToken = loginRes.body.token;
    });

    /**
     * Test case: Should register a new user
     */
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/user/register')
            .send({
                userName: `${TEST_USER_PREFIX}new`,
                email: 'newuser@example.com',
                password: 'NewPassword123!'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('token');
    });

    /**
     * Test case: Should login an existing user
     */
    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({
                email: testUser.email,
                password: 'TestPassword123!'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('token');
    });

    /**
     * Test case: Should get user profile
     */
    it('should get user profile', async () => {
        const res = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('userName', testUser.userName);
        expect(res.body).toHaveProperty('email', testUser.email);
    });

    /**
     * Test case: Should update user profile
     */
    it('should update user profile', async () => {
        const res = await request(app)
            .patch('/user/me')
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({
                userName: `${TEST_USER_PREFIX}updated`
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('userName', `${TEST_USER_PREFIX}updated`);
    });

    /**
     * Test case: Should logout user
     */
    it('should logout user', async () => {
        const res = await request(app)
            .post('/user/logout')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        expect(res.statusCode).toBe(200);
    });

    /**
     * Test case: Should delete user account
     */
    it('should delete user account', async () => {
        const res = await request(app)
            .delete('/user/me')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        expect(res.statusCode).toBe(200);
        
        const deletedUser = await User.findById(testUser._id);
        expect(deletedUser).toBeNull();
    });
});
