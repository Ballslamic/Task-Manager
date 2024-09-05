const mongoose = require('mongoose');
require('dotenv').config();

describe('Database Connection', () => {
    // Test to ensure the database connects successfully
    it('should connect to MongoDB', async () => {
        const MONGO_URL = process.env.MONGO_URL;
        const DB_NAME = process.env.DB_NAME;

        // Attempt to connect to the database
        const db = await mongoose.connect(MONGO_URL, { dbName: DB_NAME });
        
        // Assert that the connected database name is correct
        expect(db.connection.name).toBe(DB_NAME);
        
        // Close the connection after test
        mongoose.connection.close();
    });

    // Test to ensure connection fails with an invalid URL
    it('should fail to connect to MongoDB with wrong URL', async () => {
        const MONGO_URL = 'invalid_url';

        // Try to connect and expect an error to be thrown
        try {
            await mongoose.connect(MONGO_URL);
        } catch (error) {
            // Assert that an error is thrown
            expect(error).toBeDefined();
        }
    });
});
