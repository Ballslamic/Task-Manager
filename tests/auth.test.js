const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const auth = require("../middlewares/auth");
const request = require('supertest');
const app = require('../app');
require('dotenv').config();

/**
 * Debug function to log messages when DEBUG environment variable is set.
 * @param {string} message - The message to log.
 */
const debug = (message) => {
  if (process.env.DEBUG) {
    console.log(message);
  }
};

describe('Auth Middleware', () => {
    let testUser, testToken;

    /**
     * Set up the test environment before all tests.
     * Connects to the test database and creates a test user.
     */
    beforeAll(async () => {
        // Connect to the test database
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        debug('Connected to database');

        // Create a test user
        testUser = new User({
            userName: 'testuser',
            email: 'testuser@example.com',
            password: 'TestPassword123!'
        });
        await testUser.save();
        testToken = await testUser.generateAuthToken();
        debug(`Created test user: ${testUser.userName}`);
    });

    /**
     * Clean up the test environment after all tests.
     * Deletes the test user and closes the database connection.
     */
    afterAll(async () => {
        if (testUser) {
            await User.deleteOne({ _id: testUser._id });
            debug(`Deleted test user: ${testUser.userName}`);
        }
        await mongoose.connection.close();
        debug('Disconnected from database');
    });

    /**
     * Test case: Should authenticate a user with a valid token.
     */
    it('should authenticate a user with a valid token', async () => {
        const response = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(200);
        expect(response.body._id).toBe(testUser._id.toString());
    });

    /**
     * Test case: Should not authenticate a user with no token.
     */
    it('should not authenticate a user with no token', async () => {
        const response = await request(app)
            .get('/user/me');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Please authenticate.');
    });

    /**
     * Test case: Should not authenticate a user with an invalid token.
     */
    it('should not authenticate a user with an invalid token', async () => {
        const response = await request(app)
            .get('/user/me')
            .set('Authorization', 'Bearer invalidtoken');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Please authenticate.');
    });

    /**
     * Test case: Should not authenticate a user with an expired token.
     */
    it('should not authenticate a user with an expired token', async () => {
        const expiredToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '0s' });
        const response = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Please authenticate.');
    });

    /**
     * Test case: Should not authenticate a user if token is not in user's tokens array.
     */
    it('should not authenticate a user if token is not in user\'s tokens array', async () => {
        const invalidToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET);
        
        // Ensure the invalidToken is not in the user's tokens array
        testUser.tokens = testUser.tokens.filter(t => t.token !== invalidToken);
        await testUser.save();

        const response = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Please authenticate.');
    });

    /**
     * Test case: Should remove expired tokens when authenticating.
     */
    it('should remove expired tokens when authenticating', async () => {
        // Create an expired token
        const expiredToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '0s' });
        const expiredDate = new Date(Date.now() - 1000); // 1 second in the past
        testUser.tokens.push({ token: expiredToken, expiresAt: expiredDate });
        await testUser.save();

        // Generate a fresh token
        const freshToken = await testUser.generateAuthToken();

        debug('Before authentication:');
        debug(`Test user tokens: ${JSON.stringify(testUser.tokens)}`);
        debug(`Fresh token: ${freshToken}`);
        debug(`Expired token: ${expiredToken}`);

        // First, verify that the expired token is present
        let userBeforeAuth = await User.findById(testUser._id);
        expect(userBeforeAuth.tokens).toContainEqual(expect.objectContaining({ token: expiredToken }));

        // Perform authentication with the fresh token
        const response = await request(app)
            .get('/user/me')
            .set('Authorization', `Bearer ${freshToken}`);

        debug('After authentication:');
        debug(`Response status: ${response.status}`);
        debug(`Response body: ${JSON.stringify(response.body)}`);

        // Check if authentication was successful
        expect(response.status).toBe(200);
        
        // Check if expired token was removed
        const updatedUser = await User.findById(testUser._id);
        debug(`Updated user tokens: ${JSON.stringify(updatedUser.tokens)}`);

        // Log each token separately for clarity
        updatedUser.tokens.forEach((t, index) => {
            debug(`Token ${index}: ${t.token}`);
            debug(`Expires at: ${t.expiresAt}`);
            debug(`Is expired token: ${t.token === expiredToken}`);
            debug(`Is fresh token: ${t.token === freshToken}`);
        });

        expect(updatedUser.tokens).not.toContainEqual(expect.objectContaining({ token: expiredToken }));
        expect(updatedUser.tokens).toContainEqual(expect.objectContaining({ token: freshToken }));
    });
});
