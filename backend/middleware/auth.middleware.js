const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    const authHeader = req.header.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWY_SECRET);

            req.user = await User.findById(decoded._id).select('-password');
            next();
        } catch (error) {
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        return res.status(401).json({ message: 'No token provided' });
    }
};

module.exports = auth;
