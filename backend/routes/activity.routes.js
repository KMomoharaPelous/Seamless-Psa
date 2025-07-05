const express = require('express');
const router = express.Router();
const { getLogsByTicket } = require('../controllers/activity.controller');
const auth = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

// Activity logs - Admin and Technician only
router.get('/ticket/:ticketId', auth, authorizeRoles('Admin', 'Technician'), getLogsByTicket);

module.exports = router;