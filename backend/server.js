const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Routes
const ticketRoutes = require('./routes/ticket.routes');
const authRoutes = require('./routes/auth.routes');
const commentRoutes = require('./routes/comment.routes');
const activityRoutes = require('./routes/activity.routes');

app.get('/', (req, res) => {
    res.send('✅ Seamless PSA API is running');
});

app.use('/api/tickets', ticketRoutes);
app.use('/api/users', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/activity', activityRoutes);

// Start server if NOT in test
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;