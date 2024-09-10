require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/userModel');

const TEST_USER_PREFIX = 'testuser_';

describe('User and Category Model', () => {
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
    });

    afterEach(async () => {
        const deletedCount = await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        console.log(`Cleaned up ${deletedCount.deletedCount} test users after test`);
    });

    // User Model Tests
    it('should create a new user', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}Create`,
            email: 'testcreate@example.com',
            password: 'testpassword'
        });

        const savedUser = await user.save();
        console.log(`Created user: ${savedUser.userName}`);
        expect(savedUser.userName).toBe(`${TEST_USER_PREFIX}Create`);
        expect(savedUser.email).toBe('testcreate@example.com');
        expect(savedUser.password).not.toBe('testpassword');
    });

    it('should fail to create a user without required fields', async () => {
        const user = new User({});
        await expect(user.save()).rejects.toThrow();
    });

    it('should not allow duplicate email registration', async () => {
        const user1 = new User({
            userName: `${TEST_USER_PREFIX}1`,
            email: 'duplicate@example.com',
            password: 'password1'
        });
        await user1.save();

        const user2 = new User({
            userName: `${TEST_USER_PREFIX}2`,
            email: 'duplicate@example.com',
            password: 'password2'
        });

        await expect(user2.save()).rejects.toThrow();
    });

    it('should update a user\'s email', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}Update`,
            email: 'testupdate@example.com',
            password: 'testpassword'
        });
        await user.save();

        user.email = 'newemail@example.com';
        await user.save();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.email).toBe('newemail@example.com');
    });

    // Category Tests (now part of User model)
    it('should create a new category for a user', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}Category`,
            email: 'testcategory@example.com',
            password: 'testpassword'
        });
        await user.save();

        user.categories.push({
            name: 'Work',
            colorCode: '#FF0000'
        });
        await user.save();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.categories.length).toBe(1);
        expect(updatedUser.categories[0].name).toBe('Work');
        expect(updatedUser.categories[0].colorCode).toBe('#FF0000');
    });

    it('should update a category for a user', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}CategoryUpdate`,
            email: 'testcategoryupdate@example.com',
            password: 'testpassword'
        });
        user.categories.push({
            name: 'Work',
            colorCode: '#FF0000'
        });
        await user.save();

        user.categories[0].name = 'Updated Work';
        user.categories[0].colorCode = '#00FF00';
        await user.save();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.categories[0].name).toBe('Updated Work');
        expect(updatedUser.categories[0].colorCode).toBe('#00FF00');
    });

    it('should delete a category for a user', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}CategoryDelete`,
            email: 'testcategorydelete@example.com',
            password: 'testpassword'
        });
        user.categories.push({
            name: 'Work',
            colorCode: '#FF0000'
        });
        await user.save();

        user.categories = user.categories.filter(cat => cat.name !== 'Work');
        await user.save();

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.categories.length).toBe(0);
    });
});