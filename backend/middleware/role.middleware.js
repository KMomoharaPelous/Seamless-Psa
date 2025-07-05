const User = require('../models/user.model');

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: no user found in request' });
        }

        const userRole = req.user.role;
        if (!userRole) {
            return res.status(403).json({ message: 'Forbidden: user role not defined' });
        }

        if (!allowedRoles.includes(userRole)) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(
                    `⚠️ Access Denied: User ${req.user._id} with role '${userRole}' tried to access ${req.originalUrl}`
                );
            }

            return res.status(403).json({
                message: 'Forbidden: you do not have permission to access this resource',
            });
        }

        next();
    };
};

module.exports = { authorizeRoles };