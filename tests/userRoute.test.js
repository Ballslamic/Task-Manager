require('dotenv').config(); // Load environment variables from .env file

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Import the Express app
const User = require('../models/userModel'); // Import the User model

const TEST_USER_PREFIX = 'testuser_';

describe('User Routes', () => {
    let testUser;
    let testUserToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        console.log('Connected to database');
    });

    afterAll(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        await mongoose.connection.close();
        console.log('Disconnected from database');
    });

    beforeEach(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        
        testUser = await User.create({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'testpassword123'
        });
        console.log(`Created test user: ${testUser.userName}`);

        const loginRes = await request(app)
            .post('/user/login')
            .send({
                email: testUser.email,
                password: 'testpassword123'
            });
        testUserToken = loginRes.body.token;
    });

    afterEach(async () => {
        if (testUser) {
            await User.findByIdAndDelete(testUser._id);
            console.log(`Deleted test user: ${testUser.userName}`);
        }
    });

    // Test case: Should register a new user
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/user/register')
            .send({
                userName: `${TEST_USER_PREFIX}new`,
                email: 'newuser@example.com',
                password: 'newpassword123'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('token');
    });

    // Test case: Should login a user
    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/user/login')
            .send({
                email: testUser.email,
                password: 'testpassword123'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('token');
    });

    // Test case: Should get user profile
    it('should get user profile', async () => {
        const res = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('userName', testUser.userName);
        expect(res.body).toHaveProperty('email', testUser.email);
    });

    // Test case: Should update a user's email
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

    // Test case: Should logout a user
    it('should logout user', async () => {
        const res = await request(app)
            .post('/user/logout')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        expect(res.statusCode).toBe(200);
    });

    // Test case: Should delete a user
    it('should delete user account', async () => {
        const res = await request(app)
            .delete('/user/me')
            .set('Authorization', `Bearer ${testUserToken}`);
        
        if (res.statusCode !== 200) {
            console.log('Delete user response:', res.body);
        }
        
        expect(res.statusCode).toBe(200);
        
        const deletedUser = await User.findById(testUser._id);
        expect(deletedUser).toBeNull();
    });
});
