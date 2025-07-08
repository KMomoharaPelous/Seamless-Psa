const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getCurrentUser
} = require('../controllers/user.controller');

const auth = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Get current user profile (any authenticated user)
// GET /api/users/profile
router.get('/profile', auth, getCurrentUser);

// Admin-only routes
// GET /api/users - Get all users
router.get('/', auth, authorizeRoles('admin'), getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', auth, authorizeRoles('admin'), getUserById);

// PATCH /api/users/:id/role - Update user role
router.patch('/:id/role', auth, authorizeRoles('admin'), updateUserRole);

// DELETE /api/users/:id - Delete user
router.delete('/:id', auth, authorizeRoles('admin'), deleteUser);

module.exports = router;
