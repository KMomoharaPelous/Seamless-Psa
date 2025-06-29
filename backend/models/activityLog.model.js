const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['Created', 'Updated', 'Deleted', 'Assigned', 'Reopened', 'Comment Added', 'Comment Edited', 'Comment Deleted'],
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    metadata: {
        type: Object,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

activityLogSchema.index({ ticket: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);