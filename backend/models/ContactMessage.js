const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ['Vendor', 'Client', 'Other'],
        default: 'Client'
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    organization: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved', 'Dismissed'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
