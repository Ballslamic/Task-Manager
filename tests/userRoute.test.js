require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const User = require('../models/userModel'); // Import the User model

const TEST_USER_PREFIX = 'TestUser';

describe('User Routes', () => {
    let testUser;
    let testUserToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        console.log('Connected to database');
    });

    afterAll(async () => {
        const deletedCount = await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        console.log(`Cleaned up ${deletedCount.deletedCount} test users`);
        await mongoose.connection.close();
        console.log('Disconnected from database');
    });

    beforeEach(async () => {
        const deletedCount = await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        console.log(`Cleaned up ${deletedCount.deletedCount} test users before test`);
        
        testUser = await User.create({
            userName: `${TEST_USER_PREFIX}`,
            email: 'testuser@example.com',
            password: 'testpassword123'
        });
        console.log(`Created test user: ${testUser.userName}`);

        const loginRes = await request(app)
            .post('/user/login')
            .send({
                userName: `${TEST_USER_PREFIX}`,
                password: 'testpassword123'
            });
        testUserToken = loginRes.body.token;
        console.log(`Logged in test user, token received: ${testUserToken ? 'Yes' : 'No'}`);
    });

    afterEach(async () => {
        const deletedCount = await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        console.log(`Cleaned up ${deletedCount.deletedCount} test users after test`);
    });

    // Test case: Should register a new user
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/user/register')
            .send({
                userName: `${TEST_USER_PREFIX}New`,
                email: 'testnewuser@example.com',
                password: 'newpassword123'
            });

        console.log(`Register response status: ${res.statusCode}`);
        console.log(`Register response body: ${JSON.stringify(res.body)}`);

        expect(res.statusCode).toEqual(201);
        expect(res.body.user).toHaveProperty('_id');
        expect(res.body).toHaveProperty('token');
    });

    // Test case: Should login a user
    it('should login a user', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({
                userName: `${TEST_USER_PREFIX}`,
                password: 'testpassword123'
            });

        console.log('Login response:', res.body);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    // Test case: Should not login with invalid credentials
    it('should not login with invalid credentials', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({
                userName: `${TEST_USER_PREFIX}`,
                password: 'wrongpassword'
            });

        console.log('Invalid login response:', res.body);
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error');
    });

    // Test case: Should update a user's email
    it('should update a user\'s email', async () => {
        const res = await request(app)
            .put(`/user/updateUser/${testUser._id}`)
            .set('Authorization', `Bearer ${testUserToken}`)
            .send({
                email: 'newemail@example.com'
            });

        console.log('Update email response:', res.body);
        expect(res.statusCode).toEqual(200);

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.email).toBe('newemail@example.com');
    });

    // Test case: Should not allow a user to delete another user
    it('should not allow a user to delete another user', async () => {
        const anotherUser = await User.create({
            userName: `${TEST_USER_PREFIX}Another`,
            email: 'testanother@example.com',
            password: 'anotherpassword123'
        });

        const res = await request(app)
            .delete(`/user/deleteUser/${anotherUser._id}`)
            .set('Authorization', `Bearer ${testUserToken}`);

        expect(res.statusCode).toEqual(403);
        const userStillExists = await User.findById(anotherUser._id);
        expect(userStillExists).not.toBeNull();
    });

    // Test case: Should delete a user
    it('should delete a user', async () => {
        const res = await request(app)
            .delete(`/user/deleteUser/${testUser._id}`)
            .set('Authorization', `Bearer ${testUserToken}`);

        console.log('Delete user response:', res.body);
        expect(res.statusCode).toEqual(200);

        const deletedUser = await User.findById(testUser._id);
        expect(deletedUser).toBeNull();
    });
});
