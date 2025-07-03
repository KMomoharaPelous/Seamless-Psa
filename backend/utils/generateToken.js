const jwt = require('jsonwebtoken');

/** 
 * Generates a JWT token containing user ID and role
 * @param {Object} user - The user object (must include _id and role)
 * @return {string} Signed JWT
 */

const generateToken = (user) => {
    if (!user || !user._id || !user.role ) {
        throw new Error('Valid user with _id and role is required');
    }

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }

    return jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

module.exports = generateToken;