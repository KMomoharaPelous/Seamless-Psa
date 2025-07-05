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
const {
    createComment,
    getCommentsByTicket,
} = require('../controllers/comment.controller');
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
// PATCH /api/tickets/:id
router.patch('/:id', auth, updateTicket);

// DELETE ticket
// DELETE /api/tickets/:id
router.delete('/:id', auth, deleteTicket);

// ASSIGN ticket (Admin or Tech only)
// PATCH /api/tickets/:id/assign
router.patch('/:id/assign', auth, assignTicket);

// REOPEN ticket (any authenticated user)
// PATCH /api/tickets/:id/reopen
router.patch('/:id/reopen', auth, reopenTicket);

// COMMENT routes for tickets
// POST /api/tickets/:ticketId/comments
router.post('/:ticketId/comments', auth, createComment);

// GET /api/tickets/:ticketId/comments
router.get('/:ticketId/comments', auth, getCommentsByTicket);

module.exports = router;