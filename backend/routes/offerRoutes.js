const express = require('express');
const router = express.Router();
const { createOffer, getAllOffers, validateOffer, deleteOffer } = require('../controllers/offerController');
const protect = require('../middleware/authMiddleware');

router.get('/', getAllOffers);
router.post('/validate', validateOffer);
router.post('/', protect, createOffer);
router.delete('/:id', protect, deleteOffer);

module.exports = router;
