const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Internal reference name
    sponsorName: { type: String, default: 'Partner' }, // e.g., 'Logistics Partner'
    headline: { type: String, required: true }, // 'Move More. Spend Less.'
    description: { type: String }, // 'Get competitive freight rates with verified logistics partners.'
    imageUrl: { type: String }, // Optional if it's text-only or left-side image
    features: [{ type: String }], // Array of tags/bullets e.g., ['Priority rates', 'Pan-India network']
    buttonText: { type: String, default: 'View Offer' },
    linkUrl: { type: String, default: '' },
    placement: { 
        type: String, 
        enum: ['top', 'inline', 'sidebar'], 
        default: 'top' 
    },
    targetSection: {
        type: String,
        default: 'both'
    },
    targetUrl: {
        type: String,
        default: ''
    },
    openInNewTab: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Ad', adSchema);
