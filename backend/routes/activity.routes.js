const express = require('express');
const router = express.Router();
const { getLogsByTicket } = require('../controllers/actvity.contoller');
const auth = require('../middleware.auth.middleware');

router.get('/ticket/:ticketId', auth, getLogsByTicket);

module.exports = router;