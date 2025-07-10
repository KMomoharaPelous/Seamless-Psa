const mongoose = require('mongoose');
const Comment = require('../models/comment.model');
const Ticket = require('../models/ticket.model');
const User = require('../models/user.model');
const ActivityLog = require('../models/activityLog.model');


// @desc Create a new comment
// @route POST /api/tickets/:ticketId
// @access Private
const createComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { ticketId } = req.params;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Validate ticketId format
        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const comment = await Comment.create({
            content: content.trim(),
            ticket: ticketId,
            user: req.user._id
        });

        // Activity Log
        await ActivityLog.create({
            ticket: ticketId,
            action: 'comment added',
            performedBy: req.user._id,
            metadata: { content: comment.content },
        });

        res.status(201).json(comment);
    } catch (error) {
        handleError(res, error, 'Failed to create comment');
    }
};


//@desc Get all comments for a ticket
//@route GET /api/tickets/:ticketId/comments
//@access Private
const getCommentsByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
            return res.status(400).json({ message: 'Invalid ticket ID' });
        }

        const comments = await Comment.find({ ticket: ticketId })
            .populate('user', 'name email')
            .sort({ createdAt: 1 });

        res.status(200).json(comments);
    } catch (error) {
        handleError(res, error, 'Failed to get comments');
    }
}

//@desc Update a comment
//@route PUT /api/comments/:commentId
//@access Private
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check ownership or admin role
        if (!comment.user.equals(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this comment' });
        }

        comment.content = content?.trim() || comment.content;
        const updatedComment = await comment.save();

        // Activity Log
        await ActivityLog.create({
            ticket: comment.ticket,
            action: 'comment edited',
            performedBy: req.user._id,
            metadata: { content: updatedComment.content },
        });

        res.status(200).json(updatedComment);
    } catch (error) {
        handleError(res, error, 'Failed to update comment');
    }
};

//@desc Delete a comment
//@route DELETE /api/comments/:commentId
//@access Private
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        
        // Check ownership or admin role
        if (!comment.user.equals(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.deleteOne();
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (error) {
        handleError(res, error, 'Failed to delete comment');
    }
};

const handleError = (res, error, message) => {
    console.error(error);
    res.status(500).json({ message: message || 'Server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined, });
};

module.exports = {
    createComment,
    getCommentsByTicket,
    updateComment,
    deleteComment,
};
