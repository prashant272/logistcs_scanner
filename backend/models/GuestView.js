const mongoose = require('mongoose');

const guestViewSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        required: true,
        index: true
    },
    fingerprint: {
        type: String,
        required: true,
        index: true
    },
    viewedVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 * 30 // TTL index to automatically expire after 30 days
    }
});

module.exports = mongoose.model('GuestView', guestViewSchema);
