const express = require('express');
const router = express.Router();
const { 
    createSystemUpdate, 
    getSystemUpdates, 
    updateSystemUpdate, 
    deleteSystemUpdate,
    getVendorSystemUpdates
} = require('../controllers/systemUpdateController');
const auth = require('../middleware/authMiddleware');
// Assuming protect is the same as auth, but I'll use auth for all based on existing codebase where protect and auth are often the same (or we can just import both if they differ)

// Admin Routes
router.post('/admin', auth, createSystemUpdate);
router.get('/admin', auth, getSystemUpdates);
router.put('/admin/:id', auth, updateSystemUpdate);
router.delete('/admin/:id', auth, deleteSystemUpdate);

// Vendor Routes
router.get('/vendor', auth, getVendorSystemUpdates);

module.exports = router;
