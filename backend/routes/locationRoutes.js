const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');

// Public fetching of locations for select dropdowns
router.get('/', locationController.getLocations);

// Admin/auth protected operations
router.post('/', authMiddleware, locationController.addLocation);
router.put('/:id', authMiddleware, locationController.updateLocation);
router.delete('/:id', authMiddleware, locationController.deleteLocation);

module.exports = router;
