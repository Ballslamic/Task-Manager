require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const User = require('../models/userModel'); // Import the User model

describe('User Model', () => {
    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    afterAll(async () => {
        // Clean up the database by deleting only the users created during tests
        await User.deleteMany({ userName: /^Test/ });
        // Close the MongoDB connection after all tests have run
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up users after each test to avoid conflicts
        await User.deleteMany({ userName: /^Test/ });
    });

    // Test case: Should successfully create a new user
    it('should create a new user', async () => {
        const user = new User({
            userName: 'TestUser',
            email: 'testuser@example.com',
            password: 'testpassword'
        });

        const savedUser = await user.save();
        expect(savedUser.userName).toBe('TestUser');
        expect(savedUser.email).toBe('testuser@example.com');
        expect(savedUser.password).not.toBe('testpassword'); // Password should be hashed
    });

    // Test case: Should fail to create a user without required fields
    it('should fail to create a user without required fields', async () => {
        const user = new User({});

        let err;
        try {
            await user.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined(); // Ensure that an error is thrown due to missing fields
    });

    // Update the duplicate email test
    it('should not allow duplicate email registration', async () => {
        const user1 = new User({
            userName: 'TestUser1',
            email: 'duplicate@example.com',
            password: 'password1'
        });
        await user1.save();

        const user2 = new User({
            userName: 'TestUser2',
            email: 'duplicate@example.com',
            password: 'password2'
        });

        await expect(user2.save()).rejects.toThrow();
    });

    // Test case: Should delete a user
    it('should delete a user', async () => {
        const user = new User({
            userName: 'DeleteMe',
            email: 'delete@example.com',
            password: 'deletepassword'
        });
        await user.save(); // Save the user to the database

        await User.deleteOne({ _id: user._id }); // Delete the user by its ID

        const deletedUser = await User.findById(user._id);
        expect(deletedUser).toBeNull(); // Ensure the user has been deleted
    });

    // Update the email update test
    it('should update a user\'s email', async () => {
        const user = new User({
            userName: 'TestUpdateUser',
            email: 'update@example.com',
            password: 'updatepassword'
        });
        await user.save();

        user.email = 'updatedemail@example.com';
        const updatedUser = await user.save();

        expect(updatedUser.email).toBe('updatedemail@example.com'); // Ensure the email is updated
    });
});
