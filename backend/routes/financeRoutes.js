const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { 
    submitApplication, 
    getMyApplications, 
    getAllApplications, 
    updateApplicationStatus,
    payDocumentationFee,
    createRazorpayOrder,
    verifyRazorpayPayment,
    submitInvoice,
    getMyInvoices,
    getAllInvoices,
    updateInvoiceStatus,
    payInvoice,
    applyPenalty,
    getWalletLedger,
    submitRepayment,
    approveRepayment,
    getReceivedInvoices
} = require('../controllers/financeController');

// Vendor routes
router.post('/', protect, submitApplication);
router.get('/my', protect, getMyApplications);
router.post('/:id/pay-fee', protect, payDocumentationFee);
router.post('/:id/razorpay-order', protect, createRazorpayOrder);
router.post('/:id/verify-payment', protect, verifyRazorpayPayment);

// Invoice routes (Vendor)
router.post('/invoice', protect, submitInvoice);
router.get('/invoice/my', protect, getMyInvoices);
router.get('/invoice/received', protect, getReceivedInvoices);
router.post('/invoice/:id/repay', protect, submitRepayment);
router.get('/wallet/ledger', protect, getWalletLedger);

// Admin routes (using protect for now, ideally also an admin middleware)
router.get('/admin', protect, getAllApplications);
router.put('/admin/:id/status', protect, updateApplicationStatus);

// Invoice Admin routes
router.get('/admin/invoices', protect, getAllInvoices);
router.put('/admin/invoices/:id/status', protect, updateInvoiceStatus);
router.post('/admin/invoices/:id/pay', protect, payInvoice);
router.post('/admin/invoices/:id/penalty', protect, applyPenalty);
router.post('/admin/invoices/:id/approve-repayment', protect, approveRepayment);

module.exports = router;
