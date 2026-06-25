const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', enquiryController.createEnquiry);
router.get('/vendor/stats', authMiddleware, enquiryController.getVendorStats);
router.get('/vendor', authMiddleware, enquiryController.getVendorEnquiries);
router.get('/client', authMiddleware, enquiryController.getClientEnquiries);
router.put('/:id/status', authMiddleware, enquiryController.updateEnquiryStatus);

module.exports = router;
