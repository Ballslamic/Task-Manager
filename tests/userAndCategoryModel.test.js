require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const TEST_USER_PREFIX = 'testuser_';

/**
 * User and Category Model Test Suite
 * 
 * These tests cover the validation and behavior of the User and Category models,
 * including password hashing, email validation, and category color code validation.
 */
describe('User and Category Model', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    afterAll(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({ userName: new RegExp(`^${TEST_USER_PREFIX}`) });
    });

    describe('User Model', () => {
        /**
         * Test case: Should create a new user with valid data
         */
        it('should create a new user with valid data', async () => {
            const user = new User({
                userName: `${TEST_USER_PREFIX}Valid`,
                email: 'valid@example.com',
                password: 'ValidPassword123!'
            });
            const savedUser = await user.save();
            expect(savedUser.userName).toBe(`${TEST_USER_PREFIX}Valid`);
            expect(savedUser.email).toBe('valid@example.com');
            expect(savedUser.password).not.toBe('ValidPassword123!');
        });

        /**
         * Test case: Should fail to create a user without required fields
         */
        it('should fail to create a user without required fields', async () => {
            const user = new User({});
            await expect(user.save()).rejects.toThrow();
        });

        /**
         * Test case: Should not allow duplicate email registration
         */
        it('should not allow duplicate email registration', async () => {
            await User.create({
                userName: `${TEST_USER_PREFIX}1`,
                email: 'duplicate@example.com',
                password: 'Password123!'
            });
            const duplicateUser = new User({
                userName: `${TEST_USER_PREFIX}2`,
                email: 'duplicate@example.com',
                password: 'Password123!'
            });
            await expect(duplicateUser.save()).rejects.toThrow();
        });

        /**
         * Test case: Should hash the password before saving
         */
        it('should hash the password before saving', async () => {
            const user = new User({
                userName: `${TEST_USER_PREFIX}HashTest`,
                email: 'hashtest@example.com',
                password: 'Password123!'
            });
            await user.save();
            expect(user.password).not.toBe('Password123!');
            expect(await bcrypt.compare('Password123!', user.password)).toBe(true);
        });

        /**
         * Test case: Should validate email format
         */
        it('should validate email format', async () => {
            const invalidUser = new User({
                userName: `${TEST_USER_PREFIX}InvalidEmail`,
                email: 'invalid-email',
                password: 'Password123!'
            });
            await expect(invalidUser.save()).rejects.toThrow();
        });

        /**
         * Test case: Should enforce minimum password length
         */
        it('should enforce minimum password length', async () => {
            const shortPasswordUser = new User({
                userName: `${TEST_USER_PREFIX}ShortPass`,
                email: 'shortpass@example.com',
                password: 'Short1!'
            });
            await expect(shortPasswordUser.save()).rejects.toThrow();
        });

        /**
         * Test case: Should update user information
         */
        it('should update user information', async () => {
            const user = await User.create({
                userName: `${TEST_USER_PREFIX}Update`,
                email: 'update@example.com',
                password: 'UpdatePassword123!'
            });
            user.email = 'updated@example.com';
            await user.save();
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.email).toBe('updated@example.com');
        });
    });

    describe('Category Model', () => {
        let testUser;

        beforeEach(async () => {
            testUser = await User.create({
                userName: `${TEST_USER_PREFIX}CategoryTest`,
                email: 'categorytest@example.com',
                password: 'CategoryPassword123!'
            });
        });

        /**
         * Test case: Should create a new category for a user
         */
        it('should create a new category for a user', async () => {
            testUser.categories.push({
                name: 'Work',
                colorCode: '#FF0000'
            });
            await testUser.save();
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.categories.length).toBe(1);
            expect(updatedUser.categories[0].name).toBe('Work');
            expect(updatedUser.categories[0].colorCode).toBe('#FF0000');
        });

        /**
         * Test case: Should update a category for a user
         */
        it('should update a category for a user', async () => {
            testUser.categories.push({
                name: 'Work',
                colorCode: '#FF0000'
            });
            await testUser.save();
            testUser.categories[0].name = 'Updated Work';
            testUser.categories[0].colorCode = '#00FF00';
            await testUser.save();
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.categories[0].name).toBe('Updated Work');
            expect(updatedUser.categories[0].colorCode).toBe('#00FF00');
        });

        /**
         * Test case: Should delete a category for a user
         */
        it('should delete a category for a user', async () => {
            testUser.categories.push({
                name: 'Work',
                colorCode: '#FF0000'
            });
            await testUser.save();
            testUser.categories = testUser.categories.filter(cat => cat.name !== 'Work');
            await testUser.save();
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.categories.length).toBe(0);
        });

        /**
         * Test case: Should not allow duplicate category names for a user
         */
        it('should not allow duplicate category names for a user', async () => {
            testUser.categories.push({
                name: 'Work',
                colorCode: '#FF0000'
            });
            await testUser.save();
            testUser.categories.push({
                name: 'Work',
                colorCode: '#00FF00'
            });
            await expect(testUser.save()).rejects.toThrow();
        });

        /**
         * Test case: Should validate color code format
         */
        it('should validate color code format', async () => {
            testUser.categories.push({
                name: 'InvalidColor',
                colorCode: 'invalid-color'
            });
            await expect(testUser.save()).rejects.toThrow('is not a valid color code. Use hexadecimal format (e.g., #FF0000)');
        });
    });
});