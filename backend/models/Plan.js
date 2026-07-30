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
    currency: {
        type: String,
        enum: ['INR', 'USD'],
        default: 'INR'
    },
    planType: {
        type: String,
        enum: ['Regular', 'Topup'],
        default: 'Regular'
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
    serviceType: {
        type: String,
        enum: ['All', 'Land'],
        default: 'All'
    },
    alternateName: {
        type: String,
        default: ''
    },
    actAsWhiteLabelSite: {
        type: String,
        default: 'No'
    },
    vendorProfileListing: {
        type: String,
        default: '✓'
    },
    worldwideVisibility: {
        type: String,
        default: '✓'
    },
    directEnquiries: {
        type: String,
        default: 'Unlimited'
    },
    dedicatedAccountManager: {
        type: String,
        default: '✓'
    },
    supportType: {
        type: String,
        default: 'Premium 24/7'
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
