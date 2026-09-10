const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const auth = require('../middleware/authMiddleware');

router.get('/admin', auth, invoiceController.getAdminInvoices);
router.get('/my-invoices', auth, invoiceController.getVendorInvoices);
router.get('/:id', auth, invoiceController.getInvoiceById);

module.exports = router;
