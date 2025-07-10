const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: false,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'created',
            'updated',
            'deleted',
            'assigned',
            'reopened',
            'comment added',
            'comment edited',
            'comment deleted',
            'role updated',
            'user created',
            'user deleted',
        ],
            
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
    timestamp: {
        createdAt: 'timestamp',
        updatedAt: false
    }
});

activityLogSchema.index({ ticket: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);