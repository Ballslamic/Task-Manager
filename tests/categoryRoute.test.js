require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

describe('Category Routes', () => {
    let testUser, token;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        testUser = await User.create({ userName: 'TestUser', email: 'testuser@example.com', password: 'testpassword' });
        const loginRes = await request(app)
            .post('/user/login')
            .send({ userName: 'TestUser', password: 'testpassword' });
        token = loginRes.body.token;
    });

    afterAll(async () => {
        await User.deleteOne({ userName: 'TestUser' });
        await mongoose.connection.close();
    });

    afterEach(async () => {
        await User.updateOne({ _id: testUser._id }, { $set: { categories: [] } });
    });

    it('should create a new category', async () => {
        const res = await request(app)
            .post('/category/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Work',
                colorCode: '#ff0000'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.category).toHaveProperty('_id');
        expect(res.body.category.name).toEqual('Work');
    });

    it('should edit a category', async () => {
        const user = await User.findById(testUser._id);
        user.categories.push({ name: 'Personal', colorCode: '#00ff00' });
        await user.save();
        const categoryId = user.categories[0]._id;

        const res = await request(app)
            .put(`/category/categories/edit/${categoryId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Updated Personal',
                colorCode: '#0000ff'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.category.name).toBe('Updated Personal');
        expect(res.body.category.colorCode).toBe('#0000ff');
    });

    it('should delete a category', async () => {
        const user = await User.findById(testUser._id);
        user.categories.push({ name: 'Test Temporary', colorCode: '#ff00ff' });
        await user.save();
        const categoryId = user.categories[0]._id;

        const res = await request(app)
            .delete(`/category/categories/delete/${categoryId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.categories.length).toBe(0);
    });

    it('should not delete a non-existent category', async () => {
        const res = await request(app)
            .delete(`/category/categories/delete/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(404);
    });
});
