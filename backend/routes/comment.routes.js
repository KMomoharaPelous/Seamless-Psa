const express = require('express');
const router = express.Router();
const {
    updateComment,
    deleteComment,
} = require('../controllers/comment.controller');

const auth = require('../middleware/auth.middleware');

// Update and Delete a specific comment
router
    .route('/:commentId')
    .put(auth, updateComment)
    .delete(auth, deleteComment);

module.exports = router;