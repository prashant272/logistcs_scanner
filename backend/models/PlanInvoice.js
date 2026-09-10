const mongoose = require('mongoose');

const planInvoiceSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoiceNo: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    companyName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    gstNo: {
        type: String,
        default: ''
    },
    panNo: {
        type: String,
        default: ''
    },
    planName: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    country: {
        type: String,
        default: 'India'
    },
    sacCode: {
        type: String,
        default: '9956'
    },
    gstRate: {
        type: Number,
        default: 18
    },
    baseAmount: {
        type: Number,
        required: true
    },
    igstAmount: {
        type: Number,
        default: 0
    },
    cgstAmount: {
        type: Number,
        default: 0
    },
    sgstAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Payment Gateway'
    },
    paymentReferenceNo: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('PlanInvoice', planInvoiceSchema);
