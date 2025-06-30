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
const auth = require('../middleware/auth.middleware');


// Secure all routes

// CREATE new ticket
// POST /api/tickets
router.post('/', auth, createTicket);

// GET tickets created by user
// GET /api/tickets
router.get('/', auth, getTickets);

// GET single ticket by ID
// GET /api/tickets/:id
router.get('/:id', auth, getTicketById);

// UPDATE ticket fields (title, description, status, priority)
// PUT /api/tickets/:id
router.put('/:id', auth, updateTicket);

// DELETE ticket
// DELETE /api/tickets/:id
router.delete('/:id', auth, deleteTicket);

// ASSIGN ticket (Admin or Tech only)
// PATCH /api/tickets/:id/assign
router.patch('/:id/assign', auth, assignTicket);

// REOPEN ticket (any authenticated user)
// PATCH /api/tickets/:id/reopen
router.patch('/:id/reopen', auth, reopenTicket);

module.exports = router;