const mongoose = require('mongoose');
const { ACTIVITY_ACTION_VALUES } = require('../constants/enums');

const activityLogSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: false,
    },
    action: {
        type: String,
        required: true,
        enum: ACTIVITY_ACTION_VALUES,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    metadata: {
        type: Object,
        default: {},
    },
}, { timestamps: true });

activityLogSchema.index({ ticket: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);