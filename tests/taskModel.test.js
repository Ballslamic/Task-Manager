require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const Task = require('../models/taskModel'); // Import the Task model
const User = require('../models/userModel'); // Import the User model

describe('Task Model', () => {
    let testUser, testCategory;

    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });

        // Create a user and a category for testing
        testUser = await User.create({ 
            userName: 'TestUser', 
            email: 'testuser@example.com', 
            password: 'testpassword' 
        });
        testCategory = {
            name: 'Work',
            colorCode: '#ff0000'
        };
        testUser.categories.push(testCategory);
        await testUser.save();
        testCategory = testUser.categories[0]; // Get the saved category with _id
    });

    afterAll(async () => {
        // Clean up the database by deleting only the tasks and users created during tests
        await Task.deleteMany({ owner: testUser._id });
        await User.deleteOne({ _id: testUser._id });
        // Close the MongoDB connection after all tests have run
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up tasks after each test to avoid conflicts
        await Task.deleteMany({ owner: testUser._id });
    });

    // Test case: Should successfully create a new task
    it('should create a new task', async () => {
        const task = new Task({
            taskDesc: 'Test Task',
            owner: testUser._id,
            category: testCategory._id
        });

        const savedTask = await task.save();
        expect(savedTask.taskDesc).toBe('Test Task');
        expect(savedTask.owner.toString()).toBe(testUser._id.toString());
        expect(savedTask.category.toString()).toBe(testCategory._id.toString());
    });

    // Test case: Should fail to create a task without required fields
    it('should fail to create a task without required fields', async () => {
        const task = new Task({});

        let err;
        try {
            await task.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined(); // Ensure that an error is thrown due to missing fields
    });

    // Test case: Should update a task's description
    it('should update a task\'s description', async () => {
        const task = new Task({
            taskDesc: 'Initial Task Description',
            owner: testUser._id,
            category: testCategory._id
        });
        await task.save(); // Save the task to the database

        task.taskDesc = 'Updated Task Description';
        const updatedTask = await task.save(); // Save the updated task

        expect(updatedTask.taskDesc).toBe('Updated Task Description'); // Ensure the task description is updated
    });

    // Test case: Should delete a task
    it('should delete a task', async () => {
        const task = new Task({
            taskDesc: 'Delete Me',
            owner: testUser._id,
            category: testCategory._id
        });
        await task.save(); // Save the task to the database

        await Task.deleteOne({ _id: task._id }); // Delete the task by its ID

        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull(); // Ensure the task has been deleted
    });
});
