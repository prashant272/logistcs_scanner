const FinanceApplication = require('../models/FinanceApplication');
const { sendNotification, sendAdminNotification, sendEmail } = require('../utils/notificationService');

// @desc    Submit a new Finance Application
// @route   POST /api/finance
// @access  Vendor
exports.submitApplication = async (req, res) => {
    try {
        const { director1, personalDetails, director2, businessDetails } = req.body;
        
        // User can submit multiple applications, so we don't block them.

        const app = await FinanceApplication.create({
            vendor: req.user.id,
            director1,
            personalDetails,
            director2,
            businessDetails
        });

        res.status(201).json({ message: 'Finance application submitted successfully!', app });
    } catch (error) {
        console.error('Error submitting finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Vendor's own Finance Application
// @route   GET /api/finance/my
// @access  Vendor
exports.getMyApplications = async (req, res) => {
    try {
        const apps = await FinanceApplication.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        console.error('Error fetching my finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Finance Applications
// @route   GET /api/admin/finance
// @access  Admin
exports.getAllApplications = async (req, res) => {
    try {
        const apps = await FinanceApplication.find()
            .populate('vendor', 'name email company phone')
            .sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        console.error('Error fetching all finance apps:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Finance Application Status (Admin)
// @route   PUT /api/admin/finance/:id/status
// @access  Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { adminStatus, approvedAmount, processingFees, rejectionReason, termsAndConditions } = req.body;
        
        const app = await FinanceApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        app.adminStatus = adminStatus || app.adminStatus;
        app.approvedAmount = approvedAmount !== undefined ? approvedAmount : app.approvedAmount;
        app.processingFees = processingFees !== undefined ? processingFees : app.processingFees;
        app.rejectionReason = rejectionReason !== undefined ? rejectionReason : app.rejectionReason;
        app.termsAndConditions = termsAndConditions !== undefined ? termsAndConditions : app.termsAndConditions;

        await app.save();

        res.status(200).json({ message: 'Application updated successfully', app });
    } catch (error) {
        console.error('Error updating finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Pay Documentation Fee & Activate Wallet Limit
// @route   POST /api/finance/:id/pay-fee
// @access  Vendor
exports.payDocumentationFee = async (req, res) => {
    try {
        const app = await FinanceApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (app.vendor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (app.adminStatus !== 'Approved') {
            return res.status(400).json({ message: 'Application is not approved' });
        }

        if (app.isFeePaid) {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        // Set fee paid
        app.isFeePaid = true;
        await app.save();

        // Add limit to user's wallet
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (user) {
            const limit = parseFloat(app.approvedAmount) || 0;
            user.walletBalance = (user.walletBalance || 0) + limit;
            await user.save();
        }

        res.status(200).json({ message: 'Payment successful, credit limit activated in wallet!', app });
    } catch (error) {
        console.error('Error paying documentation fee:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create Razorpay Order for Documentation Fee
// @route   POST /api/finance/:id/razorpay-order
// @access  Vendor
exports.createRazorpayOrder = async (req, res) => {
    try {
        const app = await FinanceApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        if (app.vendor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (app.adminStatus !== 'Approved') {
            return res.status(400).json({ message: 'Application is not approved' });
        }

        if (app.isFeePaid) {
            return res.status(400).json({ message: 'Fee already paid' });
        }

        const feeAmount = parseFloat(app.processingFees) || 0;
        if (feeAmount <= 0) {
            return res.status(400).json({ message: 'No processing fee configured' });
        }

        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SQFIjwkG0C66Mu';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';

        const amountInPaise = Math.round(feeAmount * 100);
        const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
        
        const axios = require('axios');
        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `fin_${app._id.toString().slice(-6)}_${Date.now().toString().slice(-8)}`
            },
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            orderId: response.data.id,
            amount: response.data.amount,
            currency: response.data.currency,
            keyId: keyId,
            approvedAmount: app.approvedAmount,
            processingFees: app.processingFees
        });
    } catch (error) {
        console.error('Razorpay Finance Order Error:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Failed to create payment order', 
            error: error.response?.data?.error?.description || error.message 
        });
    }
};

// @desc    Verify Razorpay Payment Signature & Activate Wallet
// @route   POST /api/finance/:id/verify-payment
// @access  Vendor
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'All payment verification details are required' });
        }

        const app = await FinanceApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';
        const crypto = require('crypto');
        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
        }

        // Activate
        app.isFeePaid = true;
        await app.save();

        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (user) {
            const limit = parseFloat(app.approvedAmount) || 0;
            user.walletBalance = (user.walletBalance || 0) + limit;
            await user.save();
        }

        res.json({
            message: 'Payment verified and credit limit activated successfully!',
            app
        });
    } catch (error) {
        console.error('Razorpay Finance Verification Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const InvoiceRequest = require('../models/InvoiceRequest');
const WalletTransaction = require('../models/WalletTransaction');

// @desc    Submit Invoice Request
// @route   POST /api/finance/invoice
// @access  Vendor
exports.submitInvoice = async (req, res) => {
    try {
        const { lsId, vendorName, bankDetails, amount, invoiceFile } = req.body;
        
        const invoice = await InvoiceRequest.create({
            vendor: req.user.id,
            lsId,
            vendorName,
            bankDetails,
            amount,
            invoiceFile
        });

        // Notify Admin
        await sendAdminNotification(`New invoice uploaded by ${vendorName} for ₹${amount}.`, 'info', '/admin/finance/invoice-requests');

        res.status(201).json({ message: 'Invoice submitted successfully', invoice });
    } catch (error) {
        console.error('Submit Invoice Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Vendor Invoices
// @route   GET /api/finance/invoice/my
// @access  Vendor
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceRequest.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get My Invoices Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Invoices (Admin)
// @route   GET /api/admin/finance/invoices
// @access  Admin
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceRequest.find().populate('vendor', 'name email phone company lsId').sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Invoice Status & Timeline
// @route   PUT /api/admin/finance/invoices/:id/status
// @access  Admin
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status, rejectionReason, approvedAmount, processingFee, timelineDate } = req.body;
        
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (status === 'Approved' && invoice.status !== 'Approved') {
            const User = require('../models/User');
            const vendor = await User.findById(invoice.vendor);
            if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

            const finalAmount = approvedAmount || invoice.amount;
            const fee = parseFloat(processingFee) || 0;
            const totalDeduction = finalAmount + fee;
            
            // Deduct from wallet
            vendor.walletBalance = (vendor.walletBalance || 0) - totalDeduction;
            await vendor.save();

            // Create Transaction
            await WalletTransaction.create({
                vendor: vendor._id,
                type: 'Debit',
                amount: totalDeduction,
                description: `Invoice Approved - Base: ₹${finalAmount}, Processing Fee: ₹${fee}`,
                referenceId: invoice._id,
                balanceAfter: vendor.walletBalance
            });

            invoice.approvedAmount = finalAmount;
            invoice.processingFee = fee;
            invoice.timelineDate = timelineDate;

            await sendNotification(vendor._id, `Your invoice ${invoice.lsId} has been Approved! ₹${totalDeduction} deducted.`, 'success', '/vendor/upload-invoice');
        }

        invoice.status = status;
        if (status === 'Rejected') {
            if (rejectionReason) invoice.rejectionReason = rejectionReason;
            await sendNotification(invoice.vendor, `Your invoice ${invoice.lsId} was Rejected. Reason: ${rejectionReason}`, 'error', '/vendor/upload-invoice');
        }
        
        await invoice.save();

        res.status(200).json({ message: 'Invoice status updated', invoice });
    } catch (error) {
        console.error('Update Invoice Status Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Upload Payment Proof and Mark Paid
// @route   POST /api/admin/finance/invoices/:id/pay
// @access  Admin
exports.payInvoice = async (req, res) => {
    try {
        const { paymentProofFile } = req.body;
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        invoice.status = 'Paid';
        invoice.paymentProofFile = paymentProofFile;
        await invoice.save();

        res.status(200).json({ message: 'Payment proof uploaded successfully', invoice });
    } catch (error) {
        console.error('Pay Invoice Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Apply Penalty
// @route   POST /api/admin/finance/invoices/:id/penalty
// @access  Admin
exports.applyPenalty = async (req, res) => {
    try {
        const { penaltyAmount } = req.body;
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const User = require('../models/User');
        const vendor = await User.findById(invoice.vendor);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        // Deduct penalty from wallet
        vendor.walletBalance = (vendor.walletBalance || 0) - penaltyAmount;
        await vendor.save();

        await WalletTransaction.create({
            vendor: vendor._id,
            type: 'Debit',
            amount: penaltyAmount,
            description: `Penalty for late payment of Invoice`,
            referenceId: invoice._id,
            balanceAfter: vendor.walletBalance
        });

        invoice.penaltyAmount = (invoice.penaltyAmount || 0) + penaltyAmount;
        await invoice.save();

        res.status(200).json({ message: 'Penalty applied successfully', invoice });
    } catch (error) {
        console.error('Apply Penalty Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Wallet Ledger
// @route   GET /api/finance/wallet/ledger
// @access  Vendor
exports.getWalletLedger = async (req, res) => {
    try {
        const transactions = await WalletTransaction.find({ vendor: req.user.id })
            .populate('referenceId')
            .sort({ createdAt: -1 });
        
        const User = require('../models/User');
        const user = await User.findById(req.user.id).select('walletBalance');
        
        res.status(200).json({ 
            balance: user ? user.walletBalance : 0, 
            transactions 
        });
    } catch (error) {
        console.error('Get Wallet Ledger Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.submitRepayment = async (req, res) => {
    try {
        const { repaymentProofFile } = req.body;
        
        if (!repaymentProofFile) {
            return res.status(400).json({ message: 'Repayment proof is required' });
        }

        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        
        if (!invoice.vendor || String(invoice.vendor) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        invoice.status = 'Repayment Pending';
        invoice.repaymentProofFile = repaymentProofFile;
        await invoice.save();

        await sendAdminNotification(`Vendor ${invoice.vendorName} uploaded repayment proof for Invoice ${invoice.lsId}.`, 'info', '/admin/finance/invoice-requests');

        res.status(200).json({ message: 'Repayment submitted successfully. Waiting for admin approval.', invoice });
    } catch (error) {
        console.error('Submit Repayment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.approveRepayment = async (req, res) => {
    try {
        const invoice = await InvoiceRequest.findById(req.params.id).populate('vendor');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.status !== 'Repayment Pending') {
            return res.status(400).json({ message: 'Invoice is not pending repayment approval' });
        }

        invoice.status = 'Cleared';
        await invoice.save();

        // Calculate total to refund to wallet
        const totalPaid = (invoice.approvedAmount || invoice.amount) + invoice.penaltyAmount + (invoice.processingFee || 0);

        const User = require('../models/User');
        const user = await User.findById(invoice.vendor._id);
        
        user.walletBalance = (user.walletBalance || 0) + totalPaid;
        // Increase credit score slightly for successful payment (max 100 or some cap, let's say no cap)
        user.creditScore = (user.creditScore || 100) + 5; 
        
        await user.save();

        await WalletTransaction.create({
            vendor: user._id,
            amount: totalPaid,
            type: 'Credit',
            description: `Invoice Repayment Cleared (Base: ₹${invoice.approvedAmount}, Fee: ₹${invoice.processingFee || 0}, Penalty: ₹${invoice.penaltyAmount})`,
            referenceId: invoice._id,
            balanceAfter: user.walletBalance
        });

        await sendNotification(user._id, `Your repayment for invoice ${invoice.lsId} has been verified and cleared! Credit score +5.`, 'success', '/vendor/upload-invoice');

        res.status(200).json({ message: 'Repayment approved and wallet restored.', invoice });
    } catch (error) {
        console.error('Approve Repayment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
