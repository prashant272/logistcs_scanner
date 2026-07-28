const mongoose = require('mongoose');

const rechargeRequestSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Bank', 'Gateway'],
        required: true
    },
    screenshot: {
        type: String, // Used when paymentMethod is 'Bank'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    rejectionReason: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('RechargeRequest', rechargeRequestSchema);
