const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// POST /api/chatbot/query
router.post('/query', chatbotController.handleChatbotQuery);

module.exports = router;
