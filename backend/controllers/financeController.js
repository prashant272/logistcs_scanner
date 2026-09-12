const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const FinanceApplication = require('../models/FinanceApplication');
const InvoiceRequest = require('../models/InvoiceRequest');
const WalletTransaction = require('../models/WalletTransaction');
const PlanInvoice = require('../models/PlanInvoice');
const { sendNotification, sendAdminNotification, sendEmail } = require('../utils/notificationService');

// --- Helper Functions ---

// Generate consistent LSID for a vendor user ID
const getLSID = (id) => {
    let hash = 0;
    const str = (id || '').toString();
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 900000;
    }
    return (1000000000 + Math.abs(hash)).toString();
};

// Auto-generate official Tax Invoice for Invoice Financing
const generateFinanceInvoice = async (vendor, invoice, finalAmount, fee, timelineDate) => {
    try {
        const invoiceDate = new Date();
        const monthStr = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const yearStr = String(invoiceDate.getFullYear()).slice(-2);
        const prefix = `LS${monthStr}${yearStr}`;

        let invoiceNo;
        if (invoice.generatedInvoice && invoice.generatedInvoice.invoiceNo) {
            invoiceNo = invoice.generatedInvoice.invoiceNo;
        } else {
            const existingInvoices = await PlanInvoice.find({}, { invoiceNo: 1 }).lean();
            let maxSeq = 27;
            for (const inv of existingInvoices) {
                if (!inv?.invoiceNo) continue;
                const match = inv.invoiceNo.match(/^LS\d{4}(\d+)$/);
                if (match) {
                    const seqNum = parseInt(match[1], 10);
                    if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
                }
            }
            invoiceNo = `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
        }

        const targetVendorName = invoice.vendorName || invoice.lsId || 'Vendor';
        const gstAmount = Math.round((fee * 18) / 100);
        const totalAmount = finalAmount + fee + gstAmount;

        const resolvedAddress = [vendor.address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ');
        const isDelhi = [vendor.address, vendor.city, vendor.state].filter(Boolean).join(' ').toLowerCase().includes('delhi');

        const invoiceData = {
            vendor: vendor._id,
            invoiceNo,
            date: invoiceDate,
            dueDate: timelineDate ? new Date(timelineDate) : null,
            companyName: vendor.company || vendor.name || 'Vendor',
            address: resolvedAddress,
            country: vendor.country || 'India',
            currency: 'INR',
            gstNo: vendor.gst || '',
            panNo: vendor.pan || '',
            planName: `Invoice Financing & Documentation Charges - ${targetVendorName}`,
            sacCode: '9956',
            gstRate: 18,
            baseAmount: finalAmount + fee,
            approvedAmount: finalAmount,
            processingFee: fee,
            items: [
                {
                    description: `Reimbursement of Vendor Invoice (${targetVendorName})`,
                    subtitle: `Invoice disbursement & settlement for target vendor ${targetVendorName}`,
                    sacCode: '9956',
                    gstRate: 0,
                    amount: finalAmount
                },
                {
                    description: `Documentation & Processing Charges`,
                    subtitle: `Platform verification, legal & documentation processing charges`,
                    sacCode: '9956',
                    gstRate: 18,
                    amount: fee
                }
            ],
            igstAmount: isDelhi ? 0 : gstAmount,
            cgstAmount: isDelhi ? gstAmount / 2 : 0,
            sgstAmount: isDelhi ? gstAmount / 2 : 0,
            totalAmount,
            paymentMethod: 'Wallet Deduction',
            paymentReferenceNo: `IR-${invoice._id.toString().slice(-6).toUpperCase()}`
        };

        let planInv;
        if (invoice.generatedInvoice) {
            planInv = await PlanInvoice.findByIdAndUpdate(
                invoice.generatedInvoice._id || invoice.generatedInvoice,
                invoiceData,
                { new: true }
            );
        }
        if (!planInv) {
            planInv = await PlanInvoice.create(invoiceData);
        }

        console.log(`Auto-generated invoice ${invoiceNo} for ${vendor.email}`);
        return planInv;
    } catch (invErr) {
        console.error('Error generating finance invoice:', invErr);
        return null;
    }
};

// ==========================================
// 1. FINANCE APPLICATION CONTROLLERS
// ==========================================

// @desc    Submit a new Finance Application
// @route   POST /api/finance
// @access  Vendor
exports.submitApplication = async (req, res) => {
    try {
        const { director1, personalDetails, director2, businessDetails } = req.body;
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

// @desc    Get all Finance Applications (Admin)
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
        if (!app) return res.status(404).json({ message: 'Application not found' });

        if (adminStatus) app.adminStatus = adminStatus;
        if (approvedAmount !== undefined) app.approvedAmount = approvedAmount;
        if (processingFees !== undefined) app.processingFees = processingFees;
        if (rejectionReason !== undefined) app.rejectionReason = rejectionReason;
        if (termsAndConditions !== undefined) app.termsAndConditions = termsAndConditions;

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
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.vendor.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        if (app.adminStatus !== 'Approved') return res.status(400).json({ message: 'Application is not approved' });
        if (app.isFeePaid) return res.status(400).json({ message: 'Fee already paid' });

        app.isFeePaid = true;
        await app.save();

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
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.vendor.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
        if (app.adminStatus !== 'Approved') return res.status(400).json({ message: 'Application is not approved' });
        if (app.isFeePaid) return res.status(400).json({ message: 'Fee already paid' });

        const feeAmount = parseFloat(app.processingFees) || 0;
        if (feeAmount <= 0) return res.status(400).json({ message: 'No processing fee configured' });

        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SQFIjwkG0C66Mu';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';
        const amountInPaise = Math.round(feeAmount * 100);
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `fin_${app._id.toString().slice(-6)}_${Date.now().toString().slice(-8)}`
            },
            {
                headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
            }
        );

        res.json({
            orderId: response.data.id,
            amount: response.data.amount,
            currency: response.data.currency,
            keyId,
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
        if (!app) return res.status(404).json({ message: 'Application not found' });

        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';
        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
        }

        app.isFeePaid = true;
        await app.save();

        const user = await User.findById(req.user.id);
        if (user) {
            const limit = parseFloat(app.approvedAmount) || 0;
            user.walletBalance = (user.walletBalance || 0) + limit;
            await user.save();
        }

        res.json({ message: 'Payment verified and credit limit activated successfully!', app });
    } catch (error) {
        console.error('Razorpay Finance Verification Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ==========================================
// 2. INVOICE FINANCING REQUEST CONTROLLERS
// ==========================================

// @desc    Submit Invoice Request
// @route   POST /api/finance/invoice
// @access  Vendor
exports.submitInvoice = async (req, res) => {
    try {
        const { lsId, vendorName, bankDetails, amount, invoiceFile } = req.body;
        
        const invoice = await InvoiceRequest.create({
            vendor: req.user.id,
            lsId: lsId.trim(),
            vendorName,
            bankDetails,
            amount,
            invoiceFile
        });

        await sendAdminNotification(`New invoice uploaded by ${vendorName} for ₹${amount}.`, 'info', '/admin/finance/invoice-requests');

        // Look up target vendor to send email notification
        try {
            const cleanLsid = lsId.trim().replace(/[^0-9]/g, '');
            const vendors = await User.find({ role: 'vendor' }).select('name company email');
            const targetVendor = vendors.find(v => {
                const computed = getLSID(v._id);
                return computed === cleanLsid || `ls-${computed}` === lsId.toLowerCase().trim() || v._id.toString() === lsId.trim();
            });

            if (targetVendor?.email) {
                const emailHtml = `
                    <h3>New Credit Invoice Received</h3>
                    <p>Dear ${targetVendor.company || targetVendor.name},</p>
                    <p>A new credit invoice of <b>₹${amount}</b> has been uploaded against your LS ID by <b>${req.user.company || req.user.name || vendorName}</b>.</p>
                    <p>You can view the details in your Logistics Scanner Vendor Dashboard under the <b>Credit Invoices</b> tab.</p>
                    <br/><p>Thanks,<br/>Logistics Scanner Team</p>
                `;
                sendEmail({ to: targetVendor.email, subject: 'New Credit Invoice Received', html: emailHtml }).catch(() => {});
            }
        } catch (mailErr) {
            console.error('Failed to send target vendor email:', mailErr);
        }

        res.status(201).json({ message: 'Invoice submitted successfully', invoice });
    } catch (error) {
        console.error('Submit Invoice Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Vendor's Uploaded Invoices
// @route   GET /api/finance/invoice/my
// @access  Vendor
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceRequest.find({ vendor: req.user.id })
            .populate('generatedInvoice')
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get My Invoices Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Invoices Received By Vendor (Target Vendor)
// @route   GET /api/finance/invoice/received
// @access  Vendor
exports.getReceivedInvoices = async (req, res) => {
    try {
        const myLsid = getLSID(req.user.id);
        const invoices = await InvoiceRequest.find({
            $or: [
                { lsId: myLsid },
                { lsId: `ls-${myLsid}` },
                { lsId: `LS-${myLsid}` },
                { lsId: new RegExp(myLsid, 'i') }
            ]
        })
        .populate('vendor', 'name company email phone')
        .populate('generatedInvoice')
        .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get Received Invoices Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Invoices (Admin)
// @route   GET /api/admin/finance/invoices
// @access  Admin
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await InvoiceRequest.find()
            .populate('vendor', 'name email phone company lsId address city state pincode gst pan country')
            .populate('generatedInvoice')
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Invoice Status & Timeline (Admin)
// @route   PUT /api/admin/finance/invoices/:id/status
// @access  Admin
exports.updateInvoiceStatus = async (req, res) => {
    try {
        const { status, rejectionReason, approvedAmount, processingFee, timelineDate } = req.body;
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (status === 'Pending Vendor Approval') {
            const finalAmount = parseFloat(approvedAmount) || invoice.amount;
            const fee = parseFloat(processingFee) || 0;
            const gstAmount = Math.round((fee * 18) / 100);
            const totalInvoiceAmount = finalAmount + fee + gstAmount;

            invoice.approvedAmount = finalAmount;
            invoice.processingFee = fee;
            invoice.timelineDate = timelineDate || invoice.timelineDate;
            invoice.status = 'Pending Vendor Approval';

            const vendor = await User.findById(invoice.vendor);
            if (vendor) {
                const planInv = await generateFinanceInvoice(vendor, invoice, finalAmount, fee, invoice.timelineDate);
                if (planInv) {
                    invoice.generatedInvoice = planInv._id;
                }
            }

            await invoice.save();
            await invoice.populate('generatedInvoice');

            sendNotification(
                invoice.vendor, 
                `Invoice financing proposal ready for ₹${totalInvoiceAmount.toLocaleString('en-IN')} (Base: ₹${finalAmount.toLocaleString('en-IN')}, Fee: ₹${fee.toLocaleString('en-IN')}, GST: ₹${gstAmount.toLocaleString('en-IN')}). Please review and approve in your dashboard.`, 
                'info', 
                '/vendor/upload-invoice'
            ).catch(() => {});

            return res.status(200).json({ message: 'Invoice proposal sent to vendor for approval', invoice });
        }

        invoice.status = status;
        if (status === 'Rejected') {
            invoice.rejectionReason = rejectionReason || '';
            sendNotification(invoice.vendor, `Your invoice ${invoice.lsId} was Rejected. Reason: ${rejectionReason}`, 'error', '/vendor/upload-invoice').catch(() => {});
            
            if (invoice.generatedInvoice) {
                await PlanInvoice.findByIdAndDelete(invoice.generatedInvoice);
                invoice.generatedInvoice = null;
            }
        }
        
        await invoice.save();
        res.status(200).json({ message: 'Invoice status updated', invoice });
    } catch (error) {
        console.error('Update Invoice Status Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Vendor Approves or Rejects Invoice Financing Proposal
// @route   POST /api/finance/invoice/:id/vendor-response
// @access  Vendor
exports.respondToInvoiceProposal = async (req, res) => {
    try {
        const { action, rejectionReason } = req.body;
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice request not found' });

        if (invoice.vendor.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to respond to this invoice' });
        }

        if (invoice.status !== 'Pending Vendor Approval') {
            return res.status(400).json({ message: `Cannot respond to invoice with status '${invoice.status}'` });
        }

        const vendor = await User.findById(invoice.vendor);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        if (action === 'reject') {
            invoice.status = 'Rejected';
            invoice.rejectionReason = rejectionReason || 'Rejected by Vendor';
            
            if (invoice.generatedInvoice) {
                await PlanInvoice.findByIdAndDelete(invoice.generatedInvoice);
                invoice.generatedInvoice = null;
            }
            
            await invoice.save();

            sendAdminNotification(`Vendor ${vendor.company || vendor.name} rejected the invoice financing proposal for ${invoice.lsId}.`, 'warning', '/admin/finance/invoice-requests').catch(() => {});
            return res.status(200).json({ message: 'Invoice proposal rejected.', invoice });
        }

        if (action === 'approve') {
            const finalAmount = parseFloat(invoice.approvedAmount) || parseFloat(invoice.amount) || 0;
            const fee = parseFloat(invoice.processingFee) || 0;
            const gstAmount = Math.round((fee * 18) / 100);
            const totalDeduction = finalAmount + fee + gstAmount;

            const currentBalance = parseFloat(vendor.walletBalance) || 0;
            if (currentBalance < totalDeduction) {
                return res.status(400).json({ 
                    message: `Insufficient wallet balance. Required: ₹${totalDeduction.toLocaleString('en-IN')}, Available: ₹${currentBalance.toLocaleString('en-IN')}. Please recharge your wallet.` 
                });
            }

            // Deduct wallet balance
            vendor.walletBalance = currentBalance - totalDeduction;
            await vendor.save();

            // Create Wallet Transaction
            await WalletTransaction.create({
                vendor: vendor._id,
                type: 'Debit',
                amount: totalDeduction,
                description: `Invoice Approved - Base: ₹${finalAmount.toLocaleString('en-IN')}, Doc Fee: ₹${fee.toLocaleString('en-IN')}${gstAmount > 0 ? (', GST (18%): ₹' + gstAmount.toLocaleString('en-IN')) : ''}`,
                referenceId: invoice._id,
                balanceAfter: vendor.walletBalance
            });

            // Auto Generate / Ensure Tax Invoice
            const planInv = await generateFinanceInvoice(vendor, invoice, finalAmount, fee, invoice.timelineDate);
            if (planInv) {
                invoice.generatedInvoice = planInv._id;
            }

            invoice.status = 'Approved';
            await invoice.save();
            await invoice.populate('generatedInvoice');

            sendNotification(vendor._id, `Your invoice ${invoice.lsId} has been Approved & Activated! ₹${totalDeduction.toLocaleString('en-IN')} deducted from wallet.`, 'success', '/vendor/upload-invoice').catch(() => {});
            sendAdminNotification(`Vendor ${vendor.company || vendor.name} approved invoice ${invoice.lsId} (₹${totalDeduction.toLocaleString('en-IN')} deducted). Ready for payout.`, 'success', '/admin/finance/invoice-requests').catch(() => {});

            return res.status(200).json({ 
                message: `Invoice approved successfully! ₹${totalDeduction.toLocaleString('en-IN')} deducted from your wallet.`,
                invoice,
                walletBalance: vendor.walletBalance
            });
        }

        return res.status(400).json({ message: 'Invalid action specified.' });
    } catch (error) {
        console.error('Vendor Invoice Response Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Upload Payment Proof and Mark Paid (Admin)
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

// @desc    Apply Penalty (Admin)
// @route   POST /api/admin/finance/invoices/:id/penalty
// @access  Admin
exports.applyPenalty = async (req, res) => {
    try {
        const { penaltyAmount } = req.body;
        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const vendor = await User.findById(invoice.vendor);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        vendor.walletBalance = (vendor.walletBalance || 0) - penaltyAmount;
        await vendor.save();

        await WalletTransaction.create({
            vendor: vendor._id,
            type: 'Debit',
            amount: penaltyAmount,
            description: 'Penalty for late payment of Invoice',
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
        
        const user = await User.findById(req.user.id).select('walletBalance');
        res.status(200).json({ balance: user ? user.walletBalance : 0, transactions });
    } catch (error) {
        console.error('Get Wallet Ledger Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Repayment Proof
// @route   POST /api/finance/invoice/:id/repay
// @access  Vendor
exports.submitRepayment = async (req, res) => {
    try {
        const { repaymentProofFile } = req.body;
        if (!repaymentProofFile) return res.status(400).json({ message: 'Repayment proof is required' });

        const invoice = await InvoiceRequest.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (String(invoice.vendor) !== String(req.user.id)) return res.status(403).json({ message: 'Not authorized' });

        invoice.status = 'Repayment Pending';
        invoice.repaymentProofFile = repaymentProofFile;
        await invoice.save();

        sendAdminNotification(`Vendor ${invoice.vendorName} uploaded repayment proof for Invoice ${invoice.lsId}.`, 'info', '/admin/finance/invoice-requests').catch(() => {});
        res.status(200).json({ message: 'Repayment submitted successfully. Waiting for admin approval.', invoice });
    } catch (error) {
        console.error('Submit Repayment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Bulk Repayment Proof for All Outstanding Invoices
// @route   POST /api/finance/invoice/repay-all
// @access  Vendor
exports.submitBulkRepayment = async (req, res) => {
    try {
        const { repaymentProofFile } = req.body;
        if (!repaymentProofFile) return res.status(400).json({ message: 'Repayment proof is required' });

        const pendingInvoices = await InvoiceRequest.find({
            vendor: req.user.id,
            status: { $in: ['Approved', 'Paid', 'Repayment Pending'] }
        });

        if (pendingInvoices.length === 0) {
            return res.status(400).json({ message: 'No pending invoices found to repay.' });
        }

        let totalAmount = 0;
        for (const inv of pendingInvoices) {
            inv.status = 'Repayment Pending';
            inv.repaymentProofFile = repaymentProofFile;
            await inv.save();
            totalAmount += (inv.approvedAmount || inv.amount || 0) + (inv.penaltyAmount || 0) + (inv.processingFee || 0);
        }

        const user = await User.findById(req.user.id);
        sendAdminNotification(
            `Vendor ${user?.company || user?.name} uploaded full repayment proof for ${pendingInvoices.length} invoice(s) (Total: ₹${totalAmount.toLocaleString('en-IN')}).`,
            'info',
            '/admin/finance/invoice-requests'
        ).catch(() => {});

        res.status(200).json({ 
            message: `Repayment proof submitted for all ${pendingInvoices.length} pending invoice(s) (Total: ₹${totalAmount.toLocaleString('en-IN')}). Awaiting admin verification.`,
            count: pendingInvoices.length,
            totalAmount
        });
    } catch (error) {
        console.error('Submit Bulk Repayment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve Repayment / Direct Clear & Settle Invoice (Admin)
// @route   POST /api/admin/finance/invoices/:id/approve-repayment
// @access  Admin
exports.approveRepayment = async (req, res) => {
    try {
        const invoice = await InvoiceRequest.findById(req.params.id).populate('vendor');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.status === 'Cleared') {
            return res.status(400).json({ message: 'Invoice is already cleared.' });
        }

        invoice.status = 'Cleared';
        await invoice.save();

        const totalPaid = (invoice.approvedAmount || invoice.amount) + (invoice.penaltyAmount || 0) + (invoice.processingFee || 0);
        const user = await User.findById(invoice.vendor._id || invoice.vendor);
        
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + totalPaid;
            user.creditScore = Math.min(100, (user.creditScore || 100) + 5); 
            await user.save();

            await WalletTransaction.create({
                vendor: user._id,
                amount: totalPaid,
                type: 'Credit',
                description: `Invoice Cleared & Settled (Base: ₹${invoice.approvedAmount || invoice.amount}, Fee: ₹${invoice.processingFee || 0}, Penalty: ₹${invoice.penaltyAmount || 0})`,
                referenceId: invoice._id,
                balanceAfter: user.walletBalance
            });

            sendNotification(
                user._id, 
                `Your invoice ${invoice.lsId} has been Cleared & Settled! ₹${totalPaid.toLocaleString('en-IN')} restored to wallet. Credit score +5.`, 
                'success', 
                '/vendor/upload-invoice'
            ).catch(() => {});
        }

        res.status(200).json({ message: 'Invoice cleared successfully and wallet restored.', invoice });
    } catch (error) {
        console.error('Approve Repayment Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Vendor Credit Dashboard Stats & Score Breakdown
// @route   GET /api/finance/credit-stats
// @access  Vendor
exports.getVendorCreditStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Vendor not found' });

        const pendingInvoices = await InvoiceRequest.find({
            vendor: req.user.id,
            status: { $in: ['Approved', 'Paid', 'Repayment Pending'] }
        }).sort({ timelineDate: 1, createdAt: -1 });

        const clearedInvoicesCount = await InvoiceRequest.countDocuments({
            vendor: req.user.id,
            status: 'Cleared'
        });

        let totalPendingDues = 0;
        let totalPenalties = 0;
        let overdueCount = 0;
        const now = new Date();

        const itemizedDues = pendingInvoices.map(inv => {
            const base = inv.approvedAmount || inv.amount || 0;
            const fee = inv.processingFee || 0;
            const penalty = inv.penaltyAmount || 0;
            const totalDue = base + fee + penalty;

            totalPendingDues += totalDue;
            totalPenalties += penalty;

            const isOverdue = !!(inv.timelineDate && new Date(inv.timelineDate) < now);
            if (isOverdue) overdueCount++;

            const daysOverdue = isOverdue ? Math.ceil((now - new Date(inv.timelineDate)) / (1000 * 60 * 60 * 24)) : 0;

            return {
                _id: inv._id,
                lsId: inv.lsId || `INV-${inv._id.toString().slice(-6)}`,
                approvedAmount: base,
                processingFee: fee,
                penaltyAmount: penalty,
                totalDue,
                timelineDate: inv.timelineDate,
                status: inv.status,
                isOverdue,
                daysOverdue,
                createdAt: inv.createdAt
            };
        });

        // Credit Score Calculation (Base 100, -20 per overdue, -1 per ₹500 penalty, +2 per cleared invoice)
        const overdueDeduction = overdueCount * 20;
        const penaltyDeduction = Math.floor(totalPenalties / 500);
        const clearedBonus = clearedInvoicesCount * 2;
        const calculatedScore = Math.max(0, Math.min(100, Math.round(100 - overdueDeduction - penaltyDeduction + clearedBonus)));

        const scoreAudit = [
            { title: 'Initial Base Score', points: '+100 Pts', pointsValue: 100, type: 'base', reason: 'Base credit allocation for registered vendors' }
        ];
        if (overdueCount > 0) {
            scoreAudit.push({
                title: 'Overdue Invoices Penalty',
                points: `-${overdueDeduction} Pts`,
                pointsValue: -overdueDeduction,
                type: 'penalty',
                reason: `${overdueCount} invoice(s) passed repayment timeline (-20 Pts per overdue invoice)`
            });
        }
        if (penaltyDeduction > 0) {
            scoreAudit.push({
                title: 'Late Payment Fee Deduction',
                points: `-${penaltyDeduction} Pts`,
                pointsValue: -penaltyDeduction,
                type: 'penalty',
                reason: `Accrued ₹${totalPenalties.toLocaleString('en-IN')} in late fees (-1 Pt per ₹500 fee)`
            });
        }
        if (clearedInvoicesCount > 0) {
            scoreAudit.push({
                title: 'On-Time Repayment Bonus',
                points: `+${clearedBonus} Pts`,
                pointsValue: clearedBonus,
                type: 'bonus',
                reason: `${clearedInvoicesCount} invoice(s) cleared successfully (+2 Pts per cleared invoice)`
            });
        }

        user.creditScore = calculatedScore;
        await user.save();

        let creditRating = 'Excellent';
        if (calculatedScore < 40) creditRating = 'Poor (High Risk)';
        else if (calculatedScore < 60) creditRating = 'Average';
        else if (calculatedScore < 80) creditRating = 'Good';

        res.status(200).json({
            walletBalance: user.walletBalance || 0,
            creditScore: calculatedScore,
            creditRating,
            totalPendingDues,
            totalPenalties,
            pendingCount: pendingInvoices.length,
            overdueCount,
            clearedCount: clearedInvoicesCount,
            scoreAudit,
            pendingInvoices: itemizedDues
        });
    } catch (error) {
        console.error('Get Vendor Credit Stats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
