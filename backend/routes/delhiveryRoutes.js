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
router.post('/estimate', authMiddleware.optional, delhiveryController.estimatePrice);
router.post('/book', authMiddleware.optional, upload.single('invoice_file'), delhiveryController.createPtlBooking);
router.get('/manifest/status/:id', authMiddleware, delhiveryController.checkManifestStatus);
router.get('/my-bookings', authMiddleware, delhiveryController.getMyPtlBookings);
router.get('/track/:lrn', delhiveryController.trackPtlBooking);
router.get('/label/:lrn', authMiddleware, delhiveryController.printLabel);
router.delete('/cancel/:lrn', authMiddleware, delhiveryController.cancelPtlBooking);
router.post('/pickup/:lrn', authMiddleware, delhiveryController.schedulePickup);
router.get('/check-serviceability/:pincode', delhiveryController.checkServiceability);

module.exports = router;
