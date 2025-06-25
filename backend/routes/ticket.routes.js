const express = require('express');
const router = express.Router();
const {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
} = require('../controllers/ticket.controller');
const { protect } = require('../middleware/auth.middleware');

// Secure all routes
router.post('/', protect, createTicket);
router.get('/', protect, getTickets);
router.get('/:id', protect, getTicketById);
router.put('/:id', protect, updateTicket);
router.delete('/:id', protect, deleteTicket);

module.exports = router;