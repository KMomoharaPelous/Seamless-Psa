const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const dbURI = process.env.NODE_ENV === 'test'
            ? process.env.MONGO_URI_TEST
            : process.env.MONGO_URI;

        if (!dbURI) {
            throw new Error('MongoDB URI is missing in environment variables');
        }

        const conn = await mongoose.connect(dbURI);

        if (process.env.NODE_ENV !== 'test') {
            console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        }
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ MongoDB connection error: ${error.message}`);
            process.exit(1);
        } else {
            // In test environment, just log the error but don't exit
            console.error(`❌ MongoDB connection error in test: ${error.message}`);
            throw error; // Re-throw so tests can handle it
        }
    }
};

module.exports = connectDB;
