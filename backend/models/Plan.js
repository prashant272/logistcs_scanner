const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    inquiryLimit: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Yearly', 'Half-Yearly'],
        required: true
    },
    userType: {
        type: String,
        enum: ['customer', 'vendor'],
        required: true
    },
    country: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Plan', planSchema);
