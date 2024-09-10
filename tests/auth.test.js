const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel"); // Import the User model
const auth = require("../middlewares/auth"); // Import the auth middleware
require('dotenv').config(); // Load environment variables from .env file

const debug = (message) => {
  if (process.env.DEBUG) {
    console.log(message);
  }
};

describe('Auth Middleware', () => {
    let req, res, next, testUser, testToken;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        debug('Connected to database');

        testUser = new User({
            userName: 'testuser',
            email: 'testuser@example.com',
            password: 'testpassword123'
        });
        await testUser.save();
        testToken = await testUser.generateAuthToken();
        debug(`Created test user: ${testUser.userName}`);
    });

    afterAll(async () => {
        if (testUser) {
            await User.deleteOne({ _id: testUser._id });
            debug(`Deleted test user: ${testUser.userName}`);
        }
        await mongoose.connection.close();
        debug('Disconnected from database');
    });

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
        debug('Test setup complete');
    });

    // Test case: Should authenticate a user with a valid token
    it('should authenticate a user with a valid token', async () => {
        req.header.mockReturnValue(`Bearer ${testToken}`);

        await auth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user._id.toString()).toBe(testUser._id.toString());
        expect(req.token).toBe(testToken);
    });

    // Test case: Should not authenticate a user with no token
    it('should not authenticate a user with no token', async () => {
        req.header.mockReturnValue(undefined);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should not authenticate a user with an invalid token
    it('should not authenticate a user with an invalid token', async () => {
        req.header.mockReturnValue('Bearer invalidtoken');

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should not authenticate a user with an expired token
    it('should not authenticate a user with an expired token', async () => {
        const expiredToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '0s' });
        req.header.mockReturnValue(`Bearer ${expiredToken}`);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should not authenticate a user if token is not in user's tokens array
    it('should not authenticate a user if token is not in user\'s tokens array', async () => {
        const invalidToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET);
        req.header.mockReturnValue(`Bearer ${invalidToken}`);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should remove expired tokens when authenticating
    it('should remove expired tokens when authenticating', async () => {
        const expiredToken = jwt.sign({ _id: testUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '0s' });
        testUser.tokens.push({ token: expiredToken, expiresAt: new Date(Date.now() - 1000) });
        await testUser.save();

        req.header.mockReturnValue(`Bearer ${testToken}`);

        await auth(req, res, next);

        expect(next).toHaveBeenCalled();
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.tokens).not.toContainEqual(expect.objectContaining({ token: expiredToken }));
    });

    afterEach(() => {
        debug('Test completed');
        debug(`Response status: ${res.status.mock.calls[0]?.[0]}`);
        debug(`Response body: ${JSON.stringify(res.json.mock.calls[0]?.[0] || res.send.mock.calls[0]?.[0])}`);
    });
});
