const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true, // e.g. 'UPDATE_CREDIT_LIMIT', 'ASSIGN_RM', 'UPDATE_ENQUIRY_LIMIT'
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'performerModel'
    },
    performerModel: {
        type: String,
        required: true,
        enum: ['Admin', 'RM']
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // flexible for storing old vs new values or descriptions
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);
