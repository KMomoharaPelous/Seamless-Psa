const Ticket = require('../models/ticket.model');
const mongoose = require('mongoose');

// @desc Create a new ticket
// @route POST /api/tickets
// @access Private
const createTicket = async (req, res) => {
    const { title, description, priority, status, assignedTo, dueDate } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    try {
        const ticket = await Ticket.create({
            title,
            description,
            priority,
            status,
            assignedTo,
            dueDate,
            createdBy: req.user._id,
        });

        res.status(201).json({ ticket });
    } catch (error) {
        console.error('[Error] createTicket:', error.message);
        res.status(500).json({ message: 'Server' });
    }
};

// @desc Get all tickets for authenticated user
// @route GET /api/tickets
// @access Private
const getTicketById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    try {
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        } 

        res.status(200).json({ ticket });
    } catch (error) {
        console.error('[Error] getTicketById:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Delete a ticket by ID
// @route DELETE /api/tickets/:id
// @access Private
const deleteTicket = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    try {
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this ticket' });
        }

        await ticket.deleteOne();
        res.status(200).json({ message: 'Ticket Deleted' });
    } catch (error) {
        console.error('[Error] deleteTicket:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTicket,
    getTicketById,
    deleteTicket,
};