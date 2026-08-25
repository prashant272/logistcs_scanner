const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    performedByRole: {
        type: String,
        enum: ['vendor', 'admin', 'rm', 'system'],
        default: 'system'
    },
    details: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

activityLogSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
