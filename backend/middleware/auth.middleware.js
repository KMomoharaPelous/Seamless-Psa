const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Authentication Middleware
 * - Verifies JWT token
 * - Loads user from DB by default
 * - Trusts role data from token
 */

const auth = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded._id) {
            return res.status(401).json({ message: 'Invalid token: missing user ID' });
        }

        /**
         * Trust role from token in TEST mode
         * - In production, always load user from DB
         * - If test/development, this avoids DB reads for every request
        */

        if (process.env.NODE_ENV !== 'test' || process.env.TRUST_TOKEN_ROLE === 'true') {
            req.user = {
                _id: decoded._id,
                role: decoded.role || 'Client',
            };
        } else {
            const user = await User.findById(decoded._id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        return res.status(401).json({ message: 'Token is invalid or expired' });
    }
};

module.exports = { auth };