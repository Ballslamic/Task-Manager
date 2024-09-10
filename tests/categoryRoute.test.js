require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

const TEST_USER_PREFIX = 'testuser_';

describe('Category Routes', () => {
    let testUser, token;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
        console.log('Connected to database');

        // Register and log in a user to obtain a token for authenticated requests
        testUser = new User({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'testpassword123'
        });
        await testUser.save();

        const loginRes = await request(app)
            .post('/user/login')
            .send({ email: testUser.email, password: 'testpassword123' });
        token = loginRes.body.token;

        console.log('Test user created:', testUser.userName);
    });

    afterAll(async () => {
        await User.deleteOne({ _id: testUser._id });
        await mongoose.connection.close();
        console.log('Disconnected from database');
    });

    it('should create a new category', async () => {
        console.log('Requesting URL:', '/categories/categories/add');
        const res = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Test Category',
                colorCode: '#FF0000'
            });

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(201);
        expect(res.body.category).toHaveProperty('name', 'Test Category');
        expect(res.body.category).toHaveProperty('colorCode', '#FF0000');
    });

    it('should get all categories for a user', async () => {
        console.log('Requesting URL:', '/categories/categories');
        const res = await request(app)
            .get('/categories/categories')
            .set('Authorization', `Bearer ${token}`);

        console.log('Response:', res.body);
        console.log('Status:', res.status);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.categories)).toBeTruthy();
    });

    it('should update a category', async () => {
        // First, create a category to update
        const createRes = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Category to Update',
                colorCode: '#00FF00'
            });

        console.log('Requesting URL:', `/categories/categories/edit/${createRes.body.category._id}`);
        const updateRes = await request(app)
            .put(`/categories/categories/edit/${createRes.body.category._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Updated Category',
                colorCode: '#0000FF'
            });

        console.log('Response:', updateRes.body);
        console.log('Status:', updateRes.status);

        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body.category).toHaveProperty('name', 'Updated Category');
        expect(updateRes.body.category).toHaveProperty('colorCode', '#0000FF');
    });

    it('should delete a category', async () => {
        // First, create a category to delete
        const createRes = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Category to Delete',
                colorCode: '#FFFF00'
            });

        console.log('Requesting URL:', `/categories/categories/delete/${createRes.body.category._id}`);
        const deleteRes = await request(app)
            .delete(`/categories/categories/delete/${createRes.body.category._id}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Response:', deleteRes.body);
        console.log('Status:', deleteRes.status);

        expect(deleteRes.statusCode).toEqual(200);
        expect(deleteRes.body).toHaveProperty('message', 'Category deleted successfully');

        // Verify the category is deleted
        const getRes = await request(app)
            .get('/categories/categories')
            .set('Authorization', `Bearer ${token}`);
        
        expect(getRes.body.categories.find(cat => cat._id === createRes.body.category._id)).toBeUndefined();
    });
});
