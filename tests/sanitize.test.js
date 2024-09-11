const mongoose = require('mongoose');
const { sanitizeInput, sanitizeParam, sanitizeQuery, validateObjectId } = require('../middlewares/sanitize');
const { validationResult } = require('express-validator');
require('dotenv').config();

describe('Sanitization Middleware', () => {
    let req, res, next;

    // Connect to the test database before running any tests
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    });

    // Close the database connection after all tests are done
    afterAll(async () => {
        await mongoose.connection.close();
    });

    // Reset the request, response, and next function before each test
    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {};
        next = jest.fn();
    });

    describe('sanitizeInput', () => {
        it('should trim and escape input from request body', async () => {
            // Arrange
            req.body.testField = ' <script>alert("xss")</script> ';
            
            // Act
            await sanitizeInput('testField')(req, res, next);
            const result = validationResult(req);
            
            // Assert
            expect(result.isEmpty()).toBe(true);
            expect(req.body.testField).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
        });
    });

    describe('sanitizeParam', () => {
        it('should trim and escape input from request parameters', async () => {
            // Arrange
            req.params.testParam = ' <script>alert("xss")</script> ';
            
            // Act
            await sanitizeParam('testParam')(req, res, next);
            const result = validationResult(req);
            
            // Assert
            expect(result.isEmpty()).toBe(true);
            expect(req.params.testParam).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
        });
    });

    describe('sanitizeQuery', () => {
        it('should trim and escape input from query parameters', async () => {
            // Arrange
            req.query.testQuery = ' <script>alert("xss")</script> ';
            
            // Act
            await sanitizeQuery('testQuery')(req, res, next);
            const result = validationResult(req);
            
            // Assert
            expect(result.isEmpty()).toBe(true);
            expect(req.query.testQuery).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
        });
    });

    describe('validateObjectId', () => {
        it('should pass for valid ObjectId', async () => {
            // Arrange
            const validId = new mongoose.Types.ObjectId().toString();
            req.body.testId = validId;
            
            // Act
            await validateObjectId('testId')(req, res, next);
            const result = validationResult(req);
            
            // Assert
            expect(result.isEmpty()).toBe(true);
        });

        it('should fail for invalid ObjectId', async () => {
            // Arrange
            req.body.testId = 'invalidId';
            
            // Act
            await validateObjectId('testId')(req, res, next);
            const result = validationResult(req);
            
            // Assert
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toBe('Invalid ObjectId');
        });
    });
});