const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel"); // Import the User model
const auth = require("../middlewares/auth"); // Import the auth middleware
require('dotenv').config(); // Load environment variables from .env file

jest.mock('../models/userModel');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    // Test case: Should authenticate a user with a valid token
    it('should authenticate a user with a valid token', async () => {
        const user = { 
            _id: 'testid', 
            tokens: [{ token: 'validtoken' }],
            save: jest.fn().mockResolvedValue(true)
        };
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        req.header.mockReturnValue(`Bearer ${token}`);
        User.findOne.mockResolvedValue(user);

        await auth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(user);
        expect(req.token).toBe(token);
        expect(user.save).toHaveBeenCalled();
    });

    // Test case: Should not authenticate a user with no token
    it('should not authenticate a user with no token', async () => {
        req.header.mockReturnValue(undefined);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should not authenticate a user with an invalid token
    it('should not authenticate a user with an invalid token', async () => {
        req.header.mockReturnValue('Bearer invalidtoken');

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });

    // Test case: Should not authenticate a user with an expired token
    it('should not authenticate a user with an expired token', async () => {
        const expiredToken = jwt.sign({ _id: 'testid' }, process.env.JWT_SECRET, { expiresIn: '0s' });
        req.header.mockReturnValue(`Bearer ${expiredToken}`);

        await auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({ error: 'Please authenticate.' });
    });
});
