const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { 
    submitApplication, 
    getMyApplications, 
    getAllApplications, 
    updateApplicationStatus 
} = require('../controllers/financeController');

// Vendor routes
router.post('/', protect, submitApplication);
router.get('/my', protect, getMyApplications);

// Admin routes (using protect for now, ideally also an admin middleware)
router.get('/admin', protect, getAllApplications);
router.put('/admin/:id/status', protect, updateApplicationStatus);

module.exports = router;
