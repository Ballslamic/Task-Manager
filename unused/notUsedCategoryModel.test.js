require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const User = require('../models/userModel');

describe('Category Model', () => {
    let testUser1, testUser2;

    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        testUser1 = await User.create({ userName: 'TestUser1', email: 'test1@example.com', password: 'password123' });
        testUser2 = await User.create({ userName: 'TestUser2', email: 'test2@example.com', password: 'password123' });
        console.log('Test users created:', testUser1._id, testUser2._id);
    });

    afterAll(async () => {
        // Clean up the database by deleting only the categories and users created during tests
        await User.deleteMany({ userName: { $in: ['TestUser1', 'TestUser2'] } });
        // Close the MongoDB connection after all tests have run
        await mongoose.connection.close();
    });

    afterEach(async () => {
        await User.updateMany({}, { $set: { categories: [] } });
        console.log('Categories deleted after test');
    });

    it('should create a new category', async () => {
        const newCategory = {
            name: 'Test Category',
            colorCode: '#FF0000'
        };
        testUser1.categories.push(newCategory);
        await testUser1.save();
        
        const updatedUser = await User.findById(testUser1._id);
        const category = updatedUser.categories[0];
        console.log('New category created:', category);
        expect(category._id).toBeDefined();
        expect(category.name).toBe('Test Category');
    });

    it('should not allow duplicate category names for the same user', async () => {
        const category = {
            name: 'Unique Category',
            colorCode: '#00FF00'
        };
        testUser1.categories.push(category);
        await testUser1.save();
        console.log('First category created');

        testUser1.categories.push(category);
        await expect(testUser1.save()).rejects.toThrow();
        console.log('Duplicate category creation rejected');
    });

    it('should allow same category name for different users', async () => {
        const user1 = new User({
            userName: 'user1',
            email: 'user1@example.com',
            password: 'password123'
        });
        user1.categories.push({ name: 'Work', colorCode: '#FF0000' });
        await user1.save();

        const user2 = new User({
            userName: 'user2',
            email: 'user2@example.com',
            password: 'password123'
        });
        user2.categories.push({ name: 'Work', colorCode: '#00FF00' });
        await user2.save();

        const savedUser1 = await User.findById(user1._id);
        const savedUser2 = await User.findById(user2._id);

        expect(savedUser1.categories[0].name).toBe('Work');
        expect(savedUser2.categories[0].name).toBe('Work');
    });

});
