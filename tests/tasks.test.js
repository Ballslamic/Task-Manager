const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Task = require('../models/task');

// Connect to test database
beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/task-manager-test', { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clear test database after each test
afterEach(async () => {
    await Task.deleteMany({});
});

// Disconnect from test database after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Task API', () => {
    it('should create a new task', async () => {
        const res = await request(app)
            .post('/add')
            .send({ taskName: 'Test Task' });
        expect(res.statusCode).toEqual(302);
        const task = await Task.findOne({ name: 'Test Task' });
        expect(task).not.toBeNull();
    });

    it('should delete a task', async () => {
        const task = new Task({ name: 'Test Task' });
        await task.save();
        const res = await request(app)
            .post(`/delete/${task._id}`);
        expect(res.statusCode).toEqual(302);
        const deletedTask = await Task.findById(task._id);
        expect(deletedTask).toBeNull();
    });
});
