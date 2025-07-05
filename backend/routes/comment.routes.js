const express = require('express');
const router = express.Router();
const {
    updateComment,
    deleteComment,
} = require('../controllers/comment.controller');

const auth = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Update and Delete a specific comment
// Admin can manage all comments, others can only manage their own (handled in controller)
router
    .route('/:commentId')
    .put(auth, updateComment)
    .delete(auth, deleteComment);

module.exports = router;