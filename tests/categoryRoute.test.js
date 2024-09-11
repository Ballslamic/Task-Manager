require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/userModel');

const TEST_USER_PREFIX = 'testuser_';

/**
 * Category Routes Test Suite
 * 
 * These tests cover the CRUD operations for categories, including
 * creation, retrieval, updating, and deletion of categories.
 * They also test for proper authentication and error handling.
 */
describe('Category Routes', () => {
    let testUser, token;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    beforeEach(async () => {
        // Create a new test user before each test
        testUser = new User({
            userName: `${TEST_USER_PREFIX}${Date.now()}`,
            email: `testuser_${Date.now()}@example.com`,
            password: 'Testpassword123!' 
        });
        await testUser.save();

        const loginRes = await request(app)
            .post('/user/login')
            .send({ email: testUser.email, password: 'Testpassword123!' });
        token = loginRes.body.token;
    });

    afterEach(async () => {
        // Clean up the test user after each test
        await User.deleteOne({ _id: testUser._id });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    /**
     * Test case: Should create a new category
     */
    it('should create a new category', async () => {
        const res = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Test Category',
                colorCode: '#FF0000'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.category).toHaveProperty('name', 'Test Category');
        expect(res.body.category).toHaveProperty('colorCode', '#FF0000');
        expect(res.body.category).toHaveProperty('_id');
    });

    /**
     * Test case: Should get all categories for a user
     */
    it('should get all categories for a user', async () => {
        // First, create a category
        await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Test Category',
                colorCode: '#FF0000'
            });

        const res = await request(app)
            .get('/categories/categories')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.categories)).toBeTruthy();
        expect(res.body.categories.length).toBeGreaterThan(0);
        expect(res.body.categories[0]).toHaveProperty('name', 'Test Category');
    });

    /**
     * Test case: Should update a category
     */
    it('should update a category', async () => {
        // First, create a category to update
        const createRes = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Category to Update',
                colorCode: '#00FF00'
            });

        const updateRes = await request(app)
            .put(`/categories/categories/edit/${createRes.body.category._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Updated Category',
                colorCode: '#0000FF'
            });

        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body.category).toHaveProperty('name', 'Updated Category');
        expect(updateRes.body.category).toHaveProperty('colorCode', '#0000FF');
        expect(updateRes.body.category._id).toEqual(createRes.body.category._id);
    });

    /**
     * Test case: Should delete a category
     */
    it('should delete a category', async () => {
        // First, create a category to delete
        const createRes = await request(app)
            .post('/categories/categories/add')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryName: 'Category to Delete',
                colorCode: '#FFFF00'
            });

        const deleteRes = await request(app)
            .delete(`/categories/categories/delete/${createRes.body.category._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(deleteRes.statusCode).toEqual(200);
        expect(deleteRes.body).toHaveProperty('message', 'Category deleted successfully');

        // Verify the category is deleted
        const getRes = await request(app)
            .get('/categories/categories')
            .set('Authorization', `Bearer ${token}`);
        
        expect(getRes.body.categories.find(cat => cat._id === createRes.body.category._id)).toBeUndefined();
    });
});
