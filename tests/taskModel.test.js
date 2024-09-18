require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const User = require('../models/userModel');

/**
 * Task Model Tests
 * Tests the functionality of the Task model.
 */
describe('Task Model', () => {
    let testUser, testCategory;

    /**
     * Set up the test environment before all tests.
     * Connects to the test database and creates a test user with a category.
     */
    beforeAll(async () => {
        // Connect to the MongoDB database before running the tests
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });

        // Create a user and a category for testing
        testUser = await User.create({ 
            userName: 'TestUser', 
            email: 'testuser@example.com', 
            password: 'TestPassword123!' 
        });
        testCategory = {
            name: 'Work',
            colorCode: '#FF0000'
        };
        testUser.categories.push(testCategory);
        await testUser.save();
        testCategory = testUser.categories[0]; 
    });

    /**
     * Clean up the test environment after all tests.
     * Deletes test data and closes the database connection.
     */
    afterAll(async () => {
        if (testUser) {
            await Task.deleteMany({ owner: testUser._id });
            await User.deleteOne({ _id: testUser._id });
        }
        await mongoose.connection.close();
    });

    /**
     * Clean up tasks after each test to avoid conflicts.
     */
    afterEach(async () => {
        if (testUser) {
            await Task.deleteMany({ owner: testUser._id });
        }
    });

    /**
     * Test case: Should successfully create a new task
     */
    it('should create a new task with valid data', async () => {
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

    /**
     * Test case: Should fail to create a task without required fields
     */
    it('should fail to create a task without required fields', async () => {
        const task = new Task({});

        let err;
        try {
            await task.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
    });

    /**
     * Test case: Should update a task's description
     */
    it('should update a task\'s description', async () => {
        const task = await Task.create({
            taskDesc: 'Initial Task Description',
            owner: testUser._id,
            category: testCategory._id
        });
        task.taskDesc = 'Updated Task Description';
        const updatedTask = await task.save();

        expect(updatedTask.taskDesc).toBe('Updated Task Description');
    });

    /**
     * Test case: Should delete a task
     */
    it('should delete a task', async () => {
        const task = await Task.create({
            taskDesc: 'Task to Delete',
            owner: testUser._id,
            category: testCategory._id
        });
        await Task.deleteOne({ _id: task._id });

        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull();
    });

    /**
     * Test case: Should fetch tasks for a specific user
     */
    it('should fetch tasks for a specific user', async () => {
        await Task.create([
            { taskDesc: 'User Task 1', owner: testUser._id, category: testCategory._id },
            { taskDesc: 'User Task 2', owner: testUser._id, category: testCategory._id }
        ]);
        const userTasks = await Task.find({ owner: testUser._id });
        expect(userTasks.length).toBe(2);
        expect(userTasks[0].owner.toString()).toBe(testUser._id.toString());
        expect(userTasks[1].owner.toString()).toBe(testUser._id.toString());
    });

    /**
     * Test case: Should update task status
     */
    it('should update task status', async () => {
        const task = await Task.create({
            taskDesc: 'Status Update Task',
            owner: testUser._id,
            category: testCategory._id,
            completed: false
        });
        task.completed = true;
        const updatedTask = await task.save();
        expect(updatedTask.completed).toBe(true);
    });

    /**
     * Test case: Should validate task description length
     */
    it('should validate task description length', async () => {
        const longDesc = 'a'.repeat(501); // 501 characters
        const task = new Task({
            taskDesc: longDesc,
            owner: testUser._id,
            category: testCategory._id
        });
        await expect(task.save()).rejects.toThrow('Task description cannot be more than 500 characters');
    });

    /**
     * Test case: Should set default values for optional fields
     */
    it('should set default values for optional fields', async () => {
        const task = await Task.create({
            taskDesc: 'Default Values Task',
            owner: testUser._id,
            category: testCategory._id
        });
        expect(task.completed).toBe(false);
        expect(task.createdAt).toBeDefined();
        expect(task.updatedAt).toBeDefined();
    });
});
