const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        if (process.env.NODE_ENV !== 'test') {
            console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        }
    } catch (error) {
        if(process.env.NODE_ENV !== 'test') {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
        }
        process.exit(1);
    }
};

module.exports = connectDB;