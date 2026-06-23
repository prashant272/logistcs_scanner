const express = require('express');
const router = express.Router();
const ihcController = require('../controllers/ihcController');
const auth = require('../middleware/authMiddleware');

// Admin only routes for managing IHC Prices
router.post('/', auth, ihcController.createIhcPricing);
router.get('/', auth, ihcController.getAllIhcPricing);
router.put('/:id', auth, ihcController.updateIhcPricing);
router.delete('/:id', auth, ihcController.deleteIhcPricing);

// Public route for fetching available via ports during customer search
router.get('/via-ports', ihcController.getAvailableViaPorts);

module.exports = router;
