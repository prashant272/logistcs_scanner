const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Invoice Repayment routes
router.post('/invoice-order', auth, paymentController.createInvoicePaymentOrder);
router.post('/invoice-verify', auth, paymentController.verifyInvoicePayment);

module.exports = router;
