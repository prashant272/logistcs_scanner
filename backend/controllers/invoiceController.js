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

// Lookup User Profile by email or search query (Admin)
exports.lookupUser = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json({ users: [] });

        const searchRegex = new RegExp(query.trim(), 'i');
        const users = await User.find({
            $or: [
                { email: searchRegex },
                { name: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
                { company: searchRegex },
                { phone: searchRegex }
            ]
        }).select('_id name firstName lastName email company address city state pincode country gst pan role activePlan').limit(20).lean();

        res.json({ users });
    } catch (error) {
        console.error('Error in lookupUser:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create Manual Invoice (Admin)
exports.createManualInvoice = async (req, res) => {
    try {
        const {
            vendorId,
            vendorEmail,
            companyName,
            address,
            country = 'India',
            currency = 'INR',
            gstNo,
            panNo,
            planName,
            sacCode,
            baseAmount,
            gstRate,
            paymentMethod = 'Bank Transfer',
            paymentReferenceNo = '',
            date
        } = req.body;

        if (!companyName || baseAmount === undefined || baseAmount === null) {
            return res.status(400).json({ message: 'Company Name and Base Amount are required' });
        }

        // Find or fallback vendor User
        let vendorUser = null;
        if (vendorId) {
            vendorUser = await User.findById(vendorId);
        }
        if (!vendorUser && vendorEmail) {
            vendorUser = await User.findOne({ email: vendorEmail.trim().toLowerCase() });
        }
        if (!vendorUser) {
            // Fallback to admin user or first vendor
            vendorUser = await User.findById(req.user.id);
        }

        const isOutsideIndia = (country && country.trim().toLowerCase() !== 'india' && country.trim().toLowerCase() !== 'in') || (currency && currency.toUpperCase() === 'USD');

        const parsedBaseAmount = Number(baseAmount) || 0;
        const finalCurrency = isOutsideIndia ? 'USD' : (currency || 'INR');
        const finalGstRate = isOutsideIndia ? 0 : (gstRate !== undefined ? Number(gstRate) : 18);
        const finalSacCode = sacCode || (isOutsideIndia ? '998313' : '9956');

        let gstAmount = 0;
        let igstAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;

        if (!isOutsideIndia && finalGstRate > 0) {
            gstAmount = Math.round((parsedBaseAmount * finalGstRate) / 100);
            const addr = (address || '').toLowerCase();
            if (addr.includes('delhi')) {
                cgstAmount = gstAmount / 2;
                sgstAmount = gstAmount / 2;
            } else {
                igstAmount = gstAmount;
            }
        }

        const totalAmount = parsedBaseAmount + gstAmount;

        // Generate sequential invoice number: LS + MM + YY + Seq (>= 28)
        const invoiceDate = date ? new Date(date) : new Date();
        const monthStr = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const yearStr = String(invoiceDate.getFullYear()).slice(-2);
        const prefix = `LS${monthStr}${yearStr}`;

        const existingInvoices = await PlanInvoice.find({}, { invoiceNo: 1 }).lean();
        let maxSeq = 27;

        for (const inv of existingInvoices) {
            if (!inv || !inv.invoiceNo) continue;
            const match = inv.invoiceNo.match(/^LS\d{4}(\d+)$/);
            if (match) {
                const seqNum = parseInt(match[1], 10);
                if (!isNaN(seqNum) && seqNum > maxSeq) {
                    maxSeq = seqNum;
                }
            }
        }

        const nextSeq = maxSeq + 1;
        const invoiceNo = `${prefix}${String(nextSeq).padStart(2, '0')}`;

        const newInvoice = await PlanInvoice.create({
            vendor: vendorUser._id,
            invoiceNo,
            date: invoiceDate,
            companyName: companyName.trim(),
            address: address || '',
            country: country || (isOutsideIndia ? 'United States' : 'India'),
            currency: finalCurrency,
            gstNo: gstNo || '',
            panNo: panNo || '',
            planName: planName || 'Subscription Plan',
            sacCode: finalSacCode,
            gstRate: finalGstRate,
            baseAmount: parsedBaseAmount,
            igstAmount,
            cgstAmount,
            sgstAmount,
            totalAmount,
            paymentMethod: paymentMethod || 'Bank Transfer',
            paymentReferenceNo: paymentReferenceNo || ''
        });

        const populatedInvoice = await PlanInvoice.findById(newInvoice._id).populate('vendor', 'name email phone company');

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: populatedInvoice
        });
    } catch (error) {
        console.error('Error creating manual invoice:', error);
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

// Delete invoice (Admin)
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await PlanInvoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await PlanInvoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted successfully', id: req.params.id });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
