const User = require('../models/user.model');
const mongoose = require('mongoose');
const { USER_ROLE_VALUES } = require('../constants/enums');
const ActivityLog = require('../models/activityLog.model');
const { ACTIVITY_ACTIONS } = require('../constants/enums');

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private - Admin only
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({ 
            message: 'Users retrieved successfully', 
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: parseInt(limit)
            }
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

            if (!role || !USER_ROLE_VALUES.includes(role)) {
        return res.status(400).json({ message: 'Valid role is required (admin, technician, client)' });
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

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Activity Log
        await ActivityLog.create({
            action: 'role updated',
            performedBy: req.user._id,
            metadata: {
                userId: user._id,
                userName: user.name,
                oldRole,
                newRole: role
            }
        });

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

        // Activity Log
        await ActivityLog.create({
            action: 'user deleted',
            performedBy: req.user._id,
            metadata: {
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role
            }
        });

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
