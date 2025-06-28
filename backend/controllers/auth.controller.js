const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');

// @desc Register new user
// @route POST /api/users/register
// @access Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role });

        const token = generateToken(user._id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('❌ Register Error', error.message);
        res.status(500).json({message: 'Server error' });
    } 
};

// @desc Login a user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('❌ Login Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};