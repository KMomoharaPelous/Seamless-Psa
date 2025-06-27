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

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        })
    } catch (error) {
        console.error('❌ Register Error', error.message);
        res.status(500).json({message: 'Server error' });
    } 
};

// @desc Login a user
// @route POST /api/users/login
// @access Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('❌Login Error', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};