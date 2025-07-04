
const express = require('express');
const router = express.Router();
const {
    createComment,
    getCommentsByTicket,
    updateComment,
    deleteComment,
} = require('../controllers/comment.controller');

const { auth } = require('../middleware/auth.middleware');

// Create amd Get comments for a specific ticket
router
    .route('/tickets/:ticketId/comments')
    .post(auth, createComment)
    .get(auth, getCommentsByTicket);

// Update and Delete a specific comment
router
    .route('/comments/:commentId')
    .put(auth, updateComment)
    .delete(auth, deleteComment);

module.exports = router;