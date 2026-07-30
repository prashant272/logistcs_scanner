const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/WalletTransaction');
const RechargeRequest = require('../models/RechargeRequest');
const User = require('../models/User');

// Create Razorpay Order for Invoice Repayment
exports.createInvoicePaymentOrder = async (req, res) => {
    try {
        const { invoiceId, amount } = req.body;
        if (!invoiceId || !amount) {
            return res.status(400).json({ message: 'Invoice ID and Amount are required' });
        }

        // Calculate final amount (Base + 2% Gateway Charge + 18% GST on Gateway Charge)
        const baseAmount = parseFloat(amount);
        const gatewayCharge = baseAmount * 0.02;
        const gstAmount = gatewayCharge * 0.18;
        const finalAmount = baseAmount + gatewayCharge + gstAmount;
        
        // Razorpay expects amount in paise (multiply by 100)
        const razorpayAmount = Math.round(finalAmount * 100);

        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_pOPvY6ZqKx29kZ';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';
        const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');

        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: razorpayAmount,
                currency: 'INR',
                receipt: `rcpt_inv_${invoiceId.toString().slice(-6)}_${Date.now().toString().slice(-8)}`
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
            baseAmount: baseAmount,
            gatewayCharge: gatewayCharge,
            gstOnGateway: gstAmount,
            finalAmount: finalAmount
        });
    } catch (error) {
        console.error('Invoice Razorpay Order Creation Error:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Failed to create payment order', 
            error: error.response?.data?.error?.description || error.message 
        });
    }
};

// Verify Razorpay Payment Signature and Mark Invoice as Paid
exports.verifyInvoicePayment = async (req, res) => {
    try {
        const { invoiceId, transactionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!invoiceId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'All payment verification details are required' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';

        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
        }

        // If verification successful, update the transaction/invoice as Paid.
        // We assume the user has submitted the invoice and there is a FinanceApplication or Transaction to update.
        // We will just update the Transaction record as "Paid" or "Approved" to reflect repayment.
        const FinanceApplication = require('../models/FinanceApplication');
        const invoice = await FinanceApplication.findById(invoiceId);
        
        if (invoice) {
            invoice.adminStatus = 'Approved'; 
            invoice.isFeePaid = true;
            await invoice.save();
        }

        if (transactionId) {
            const txn = await Transaction.findById(transactionId);
            if (txn) {
                txn.status = 'Paid';
                await txn.save();
            }
        }

        res.json({
            message: 'Payment verified successfully. Invoice marked as Paid.'
        });
    } catch (error) {
        console.error('Invoice Payment Verification Error:', error.message);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};

// Wallet Recharge via Bank Transfer
exports.createBankRecharge = async (req, res) => {
    try {
        const { amount, screenshot } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        if (!screenshot) {
            return res.status(400).json({ message: 'Payment screenshot is required for bank transfer' });
        }

        const recharge = await RechargeRequest.create({
            vendor: req.user.id,
            amount: parseFloat(amount),
            paymentMethod: 'Bank',
            screenshot: screenshot,
            status: 'Pending'
        });

        res.json({ message: 'Recharge request submitted successfully. Awaiting admin approval.', recharge });
    } catch (error) {
        console.error('Bank Recharge Error:', error);
        res.status(500).json({ message: 'Failed to submit recharge request', error: error.message });
    }
};

// Create Razorpay Order for Wallet Recharge
exports.createRechargeOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' });
        }

        // Apply Gateway Charges + GST
        const baseAmount = parseFloat(amount);
        const gatewayCharge = baseAmount * 0.02;
        const gstAmount = gatewayCharge * 0.18;
        const finalAmount = baseAmount + gatewayCharge + gstAmount;
        
        const razorpayAmount = Math.round(finalAmount * 100);

        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_pOPvY6ZqKx29kZ';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';
        const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');

        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: razorpayAmount,
                currency: 'INR',
                receipt: `rcpt_rchg_${req.user.id.toString().slice(-6)}_${Date.now().toString().slice(-8)}`
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
            baseAmount: baseAmount,
            gatewayCharge: gatewayCharge,
            gstOnGateway: gstAmount,
            finalAmount: finalAmount
        });
    } catch (error) {
        console.error('Recharge Razorpay Order Creation Error:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Failed to create recharge order', 
            error: error.response?.data?.error?.description || error.message 
        });
    }
};

// Verify Razorpay Payment for Wallet Recharge
exports.verifyRechargePayment = async (req, res) => {
    try {
        const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!amount || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'All payment verification details are required' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';

        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
        }

        // Add to wallet
        const vendor = await User.findById(req.user.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.walletBalance = (vendor.walletBalance || 0) + parseFloat(amount);
        await vendor.save();

        // Create Recharge Request log
        await RechargeRequest.create({
            vendor: req.user.id,
            amount: parseFloat(amount),
            paymentMethod: 'Gateway',
            status: 'Approved',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id
        });

        // Create transaction
        await Transaction.create({
            vendor: req.user.id,
            type: 'Credit',
            amount: parseFloat(amount),
            description: `Wallet Recharge via Online Payment`,
            balanceAfter: vendor.walletBalance
        });

        res.json({
            message: 'Payment verified successfully. Wallet recharged.',
            newBalance: vendor.walletBalance
        });
    } catch (error) {
        console.error('Recharge Payment Verification Error:', error.message);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
};
