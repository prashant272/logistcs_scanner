const mongoose = require('mongoose');

const invoiceRequestSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lsId: { type: String }, // Vendor LS ID or custom ID used for autofill
    vendorName: { type: String }, // Autofilled from user
    bankDetails: {
        accountNo: { type: String, required: true },
        ifscCode: { type: String, required: true },
        branchName: { type: String },
        accountName: { type: String, required: true }
    },
    amount: { type: Number, required: true },
    invoiceFile: { type: String, required: true }, // Document URL
    
    // Admin Fields
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Paid', 'Repayment Pending', 'Cleared'],
        default: 'Pending'
    },
    rejectionReason: { type: String, default: '' },
    approvedAmount: { type: Number },
    timelineDate: { type: Date }, // Deadline to repay
    penaltyAmount: { type: Number, default: 0 },
    paymentProofFile: { type: String, default: '' }, // Admin uploaded proof of external payment
    repaymentProofFile: { type: String, default: '' } // Vendor uploaded proof of repayment
}, { timestamps: true });

module.exports = mongoose.model('InvoiceRequest', invoiceRequestSchema);
