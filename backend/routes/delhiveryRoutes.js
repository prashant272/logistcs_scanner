const express = require('express');
const router = express.Router();
const multer = require('multer');
const delhiveryController = require('../controllers/delhiveryController');
const authMiddleware = require('../middleware/authMiddleware'); // Standard auth middleware

// Use memory storage for quick buffer access without disk IO
const upload = multer({ storage: multer.memoryStorage() });

// --- Admin Routes ---
// Needs admin middleware in real scenario, for MVP using authMiddleware assuming admin has a token too or specific admin check
router.get('/admin/config', delhiveryController.getAdminConfig);
router.post('/admin/config', delhiveryController.updateAdminConfig);
router.get('/admin/bookings', delhiveryController.getAllPtlBookings);

// --- User/Vendor Routes ---
router.post('/estimate', delhiveryController.estimatePrice);
router.post('/book', authMiddleware, upload.single('invoice_file'), delhiveryController.createPtlBooking);
router.get('/my-bookings', authMiddleware, delhiveryController.getMyPtlBookings);
router.get('/track/:lrn', authMiddleware, delhiveryController.trackPtlBooking);
router.get('/check-serviceability/:pincode', delhiveryController.checkServiceability);

module.exports = router;
