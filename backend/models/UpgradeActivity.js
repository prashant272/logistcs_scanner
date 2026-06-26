const mongoose = require('mongoose');

const upgradeActivitySchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['Viewed Plans', 'Clicked Upgrade Now', 'Proceeded to Payment Gateway', 'Payment Failed', 'Payment Success']
    },
    planDetails: {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
        planName: String,
        amount: Number
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('UpgradeActivity', upgradeActivitySchema);
