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
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get All tickets
// @route GET /api/tickets
// @access Private
const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ createdBy: req.user._id });
        res.status(200).json({ tickets });
    } catch (error) {
        console.error('[Error] getTicekts:', error.message);
        res.status(500).json({ message: 'Server error' });
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

// @desc Update ticket
// @route PUT /api/tickets/:id
// @access Private
const updateTicket = async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    try {
       const ticket = await Ticket.findById(id);
       if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

       if (ticket.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this ticket '});
       }

       ticket.title = title || ticket.title;
       ticket.description = description || ticket.description;
       ticket.priority = priority || ticket.priority;
       ticket.status = status || ticket.status;

       await ticket.save();
       res.status(200).json({ ticket });
    } catch (error) {
        console.error('[Error] updateTicket:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
}; 

// @desc Assign a ticket (Admin + Technicians Only)
const assignTicket = async (req, res) => {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: 'Invalid ticket or user ID' });
    }

    try {
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const assignee = await User.findById(assignedTo);
        if (!assignee) return res.status(404).json({ message: 'Assignee not found' });

        const userRole = req.user.role.toLowerCase();

        if (userRole === 'admin') {
            ticket.assignedTo = assignedTo;
        } else if (userRole === 'technician') {
            if (assignee.role.toLowerCase() !== 'technician') {
                return res.status(403).json({ message: 'Not authorized to assign tickets' });
            }
        }

        await ticket.save();
        res.status(200).json({ ticket });
    } catch (error) {
        console.error('[Error] assignedTicket:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Reopen ticket
const reopenTicket = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    try {
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.status = 'ReOpened';
        await ticket.save();

        res.status(200).json({ message: 'Ticket Reopened', ticket});
    } catch (error) {
        console.error('[Error] reopenTicket:', error.message);
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
    getTickets,
    getTicketById,
    updateTicket,
    assignTicket,
    deleteTicket,
    reopenTicket,
};