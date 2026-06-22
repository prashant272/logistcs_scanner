const express = require('express');
const router = express.Router();
const { submitContactMessage, getContactMessages, updateContactStatus } = require('../controllers/contactController');

// Public route to submit a contact message
router.post('/', submitContactMessage);

// Admin routes (would normally be protected by admin auth middleware)
router.get('/admin/messages', getContactMessages);
router.put('/admin/:id/status', updateContactStatus);

module.exports = router;
