const User = require('../models/user.model');
const mongoose = require('mongoose');

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private - Admin only
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ 
            message: 'Users retrieved successfully', 
            count: users.length,
            users 
        });
    } catch (error) {
        console.error('[Error] getAllUsers:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get user by ID (Admin only)
// @route GET /api/users/:id
// @access Private - Admin only
const getUserById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'User retrieved successfully', 
            user 
        });
    } catch (error) {
        console.error('[Error] getUserById:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Update user role (Admin only)
// @route PATCH /api/users/:id/role
// @access Private - Admin only
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!role || !['Admin', 'Technician', 'Client'].includes(role)) {
        return res.status(400).json({ message: 'Valid role is required (Admin, Technician, Client)' });
    }

    try {
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ 
            message: 'User role updated successfully', 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('[Error] updateUserRole:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Delete user (Admin only)
// @route DELETE /api/users/:id
// @access Private - Admin only
const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();

        res.status(200).json({ 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('[Error] deleteUser:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get current user profile
// @route GET /api/users/profile
// @access Private
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'Profile retrieved successfully', 
            user 
        });
    } catch (error) {
        console.error('[Error] getCurrentUser:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getCurrentUser
};
