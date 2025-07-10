const mongoose = require('mongoose');
const { TICKET_PRIORITY_VALUES, TICKET_STATUS_VALUES } = require('../constants/enums');

const ticketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: TICKET_PRIORITY_VALUES,
        default: 'medium',
    },
    status: {
        type: String,
        enum: TICKET_STATUS_VALUES,
        default: 'open',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    dueDate: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);