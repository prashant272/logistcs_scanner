const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

const { upload } = require('../services/uploadService');

// Invoice Repayment routes
router.post('/invoice-order', auth, paymentController.createInvoicePaymentOrder);
router.post('/invoice-verify', auth, paymentController.verifyInvoicePayment);

// Wallet Recharge routes
router.post('/recharge/bank', auth, paymentController.createBankRecharge);
router.post('/recharge/gateway/create-order', auth, paymentController.createRechargeOrder);
router.post('/recharge/gateway/verify', auth, paymentController.verifyRechargePayment);

module.exports = router;
