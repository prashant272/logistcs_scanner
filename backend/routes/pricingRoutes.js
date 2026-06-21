const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public search
router.post('/search', pricingController.searchPricing);

// Vendor auth protected routes
router.post('/', authMiddleware, pricingController.addPricing);
router.post('/bulk', authMiddleware, pricingController.bulkAddPricing);
router.get('/vendor', authMiddleware, pricingController.getVendorPricing);
router.put('/:id/toggle', authMiddleware, pricingController.togglePricingStatus);
router.put('/:id', authMiddleware, pricingController.updatePricing);
router.delete('/:id', authMiddleware, pricingController.deletePricing);

module.exports = router;
