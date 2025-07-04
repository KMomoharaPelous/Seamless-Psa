const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activityLog.model');
const mongoose = require('mongoose');


// @desc Create a new ticket
// @route POST /api/tickets
// @access Private
const createTicket = async (req, res) => {
    const {
        title,
        description,
        priority = 'Low',
        status = 'Open',
        assignedTo,
        dueDate,
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        let assignee = null;

        // Validate assignedTo if provided
        if (assignedTo) {
            if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
                return res.status(400).json({ message: 'Invalid assignedTo user ID' });
            }

            assignee = await User.findById(assignedTo);
            if (!assignee) {
                return res.status(404).json({ message: 'Assigned user not found' });
            }

        // Role-based permission to assign tickets is now handled by middleware
        // This check is redundant but kept for additional security
        }

        // Validate dueDate if provided
        if (dueDate && isNaN(Date.parse(dueDate))) {
            return res.status(400).json({ message: 'Invalid due date format' });
        }

        const ticket = await Ticket.create({
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            assignedTo: assignee?._id || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: req.user._id,
        });

        // Create activity log
        await ActivityLog.create({
            ticket: ticket._id,
            action: 'Created',
            performedBy: req.user._id,
            metadata: { priority, status },
        });

        res.status(201).json({
            message: 'Ticket successfully created',
            ticket,
        });
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
        const tickets = await Ticket.find({ createdBy: req.user._id })
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({ message: 'Fetched user tickets', tickets });
    } catch (error) {
        console.error('[Error] getTickets:', error.message);
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
        const ticket = await Ticket.findById(id)
            .populate('assignedTo', 'name email role')

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to view this ticket' });
        }

        res.status(200).json({ message: 'Ticket retrieved successfully', ticket });
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

        // Role-based permission is now handled by middleware
        ticket.assignedTo = assignedTo;

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

        if (ticket.status === 'ReOpened') {
            return res.status(400).json({ message: 'Ticket is already reopened' });
        }

        ticket.status = 'ReOpened';
        await ticket.save();

        await ActivityLog.create({
            ticket: ticket._id,
            action: 'Reopened',
            performedBy: req.user._id,
            metadata: { status: 'ReOpened' }
        });

        res.status(200).json({ message: 'Ticket reopened successfully', ticket});
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

        await ActivityLog.create({
            ticket: ticket._id,
            action: 'Deleted',
            performedBy: req.user._id,
            metadata: { title: ticket.title }
        });

        await ticket.deleteOne();
        res.status(200).json({ message: 'Ticket deleted successfully' });
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