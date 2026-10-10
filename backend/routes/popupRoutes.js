const express = require('express');
const router = express.Router();
const popupController = require('../controllers/popupController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes (require auth)
router.post('/admin', authMiddleware, popupController.createPopup);
router.get('/admin', authMiddleware, popupController.getAllPopups);
router.put('/admin/:id', authMiddleware, popupController.updatePopup);
router.delete('/admin/:id', authMiddleware, popupController.deletePopup);

// Public/User route to get active popups for rendering
router.get('/active', popupController.getActivePopups);

module.exports = router;
