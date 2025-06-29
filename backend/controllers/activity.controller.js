const ActivityLog = require('../models/activityLog.model');

const getLogsByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const logs = await ActivityLog.find({ ticket: ticketId })
            .populate('performedBy', 'name role')
            .sort({ timestamp: -1 });
        res.status(200).json(logs);
    } catch (error) {
        console.error('[Error] getLogsByTicket:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getLogsByTicket,
};