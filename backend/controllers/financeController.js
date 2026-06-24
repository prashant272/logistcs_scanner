const FinanceApplication = require('../models/FinanceApplication');

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
