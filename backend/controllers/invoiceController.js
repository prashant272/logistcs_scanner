const PlanInvoice = require('../models/PlanInvoice');
const User = require('../models/User');

// Get all invoices (Admin)
exports.getAdminInvoices = async (req, res) => {
    try {
        console.log('--- getAdminInvoices CALLED ---');
        const invoices = await PlanInvoice.find().populate('vendor', 'name email phone').sort({ createdAt: -1 });
        console.log(`Found ${invoices.length} invoices for admin`);
        res.json(invoices);
    } catch (error) {
        console.error('Error in getAdminInvoices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get invoices for the logged-in vendor
exports.getVendorInvoices = async (req, res) => {
    try {
        const invoices = await PlanInvoice.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await PlanInvoice.findById(req.params.id).populate('vendor', 'name email phone company');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        // Ensure vendor can only see their own invoice, but admin can see all
        if (req.user.role !== 'admin' && invoice.vendor._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
