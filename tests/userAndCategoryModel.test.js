require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/userModel');

const TEST_USER_PREFIX = 'TestUser';

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

    it('should not allow duplicate category names for the same user', async () => {
        const user = new User({
            userName: `${TEST_USER_PREFIX}DuplicateCategory`,
            email: 'testduplicatecategory@example.com',
            password: 'testpassword'
        });
        await user.save();

        user.categories.push({
            name: 'Work',
            colorCode: '#FF0000'
        });
        await user.save();

        user.categories.push({
            name: 'Work',
            colorCode: '#00FF00'
        });

        await expect(user.save()).rejects.toThrow('Duplicate category names are not allowed');
    });

    it('should allow same category name for different users', async () => {
        const user1 = new User({
            userName: `${TEST_USER_PREFIX}1Category`,
            email: 'testuser1@example.com',
            password: 'testpassword'
        });
        await user1.save();
        console.log(`Created user1: ${user1.userName}`);

        const user2 = new User({
            userName: `${TEST_USER_PREFIX}2Category`,
            email: 'testuser2@example.com',
            password: 'testpassword'
        });
        await user2.save();
        console.log(`Created user2: ${user2.userName}`);

        const fetchedUser1 = await User.findById(user1._id);
        const fetchedUser2 = await User.findById(user2._id);

        console.log(`Fetched user1: ${fetchedUser1 ? fetchedUser1.userName : 'null'}`);
        console.log(`Fetched user2: ${fetchedUser2 ? fetchedUser2.userName : 'null'}`);

        if (fetchedUser1 && fetchedUser2) {
            fetchedUser1.categories.push({
                name: 'Work',
                colorCode: '#FF0000'
            });
            await fetchedUser1.save();
            console.log(`Added category to user1`);

            fetchedUser2.categories.push({
                name: 'Work',
                colorCode: '#00FF00'
            });
            await fetchedUser2.save();
            console.log(`Added category to user2`);

            const updatedUser1 = await User.findById(user1._id);
            const updatedUser2 = await User.findById(user2._id);

            console.log(`Updated user1 categories: ${JSON.stringify(updatedUser1.categories)}`);
            console.log(`Updated user2 categories: ${JSON.stringify(updatedUser2.categories)}`);

            expect(updatedUser1.categories[0].name).toBe('Work');
            expect(updatedUser2.categories[0].name).toBe('Work');
            expect(updatedUser1.categories[0]._id).not.toEqual(updatedUser2.categories[0]._id);
        } else {
            throw new Error('Failed to fetch users');
        }
    });
});