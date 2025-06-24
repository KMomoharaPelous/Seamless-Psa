const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Start server if NOT in test
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;