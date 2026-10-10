const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes (require auth)
router.post('/admin', authMiddleware, adController.createAd);
router.get('/admin', authMiddleware, adController.getAllAds);
router.put('/admin/:id', authMiddleware, adController.updateAd);
router.delete('/admin/:id', authMiddleware, adController.deleteAd);

// Public/Vendor route to get active ads for rendering
router.get('/active', adController.getActiveAds);

module.exports = router;
