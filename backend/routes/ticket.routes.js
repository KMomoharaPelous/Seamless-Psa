const express = require('express');
const router = express.Router();

const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    assignTicket,
    reopenTicket,
    deleteTicket,
} = require('../controllers/ticket.controller');

const {
    createComment,
    getCommentsByTicket,
} = require('../controllers/comment.controller');

const { auth } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// 🔐 Ticket Routes

// Create a new ticket
// POST /api/tickets
router.post('/', auth, getTickets);

// Get all tickets (User + Admin)
// GET /api/tickets/
router.get('/', auth, getTickets);

// Get single ticket by ID
// GET /api/tickets/:id
router.get('/:id', auth, getTicketById);

// Update a ticket (Creator + Tech + Admin)
// PATCH /api/tickets/:id
router.patch('/:id', auth, updateTicket);

// Delete a ticket (Admin Only) - Condional Technican later implemented
// DELETE /api/tickets/:id
router.delete('/:id', auth, deleteTicket);

// Assign ticket to Technician (Admin & Tech only)
// PATCH /api/tickets/:id/assign
router.patch('/:id/assign', auth, authorizeRoles('Admin', 'Technician'), assignTicket);

// Reopen a ticket (Any authenticated user)
// PATCH /api/tickets/:id/reopen
router.patch('/:id/reopen', auth, reopenTicket);

// 🔐 Comment Routes

// Create a comment on a ticket
// POST /api/tickets/:ticketId/comments
router.post('/:ticketId/comments', auth, createComment);

// Get all comments for a ticket
// GET /api/tickets/:ticketId/comments
router.get('/:ticketId/comments', auth, getCommentsByTicket);

module.exports = router;