const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Feature Imports
const ticketRoutes = require('./routes/ticket.routes');
const commentRoutes = require('./routes/comment.routes');
const authRoutes = require('./routes/auth.routes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.send('✅ Seamless PSA API is running');
});

// Routes
app.use('/api/tickets', ticketRoutes);
// app.use('/api/comments', commentRoutes);
app.use('/api/users', authRoutes);

// Start server if NOT in test
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;