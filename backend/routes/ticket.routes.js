const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getTicketById,
    assignTicket,
    updateTicket,
    deleteTicket,
    reopenTicket,
} = require('../controllers/ticket.controller');
const { protect } = require('../middleware/auth.middleware');


// Secure all routes

// CREATE new ticket
// POST /api/tickets
router.post('/', protect, createTicket);

// GET tickets created by user
// GET /api/tickets
router.get('/', protect, getTickets);

// GET single ticket by ID
// GET /api/tickets/:id
router.get('/:id', protect, getTicketById);

// UPDATE ticket fields (title, description, status, priority)
// PUT /api/tickets/:id
router.put('/:id', protect, updateTicket);

// DELETE ticket
// DELETE /api/tickets/:id
router.delete('/:id', protect, deleteTicket);

// ASSIGN ticket (Admin or Tech only)
// PATCH /api/tickets/:id/assign
router.patch('/:id/assign', protect, assignTicket);

// REOPEN ticket (any authenticated user)
// PATCH /api/tickets/:id/reopen
router.patch('/:id/reopen', protect, reopenTicket);

module.exports = router;