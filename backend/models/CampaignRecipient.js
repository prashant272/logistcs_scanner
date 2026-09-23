const mongoose = require('mongoose');

const CampaignRecipientSchema = new mongoose.Schema({
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailCampaign',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    variables: {
        type: Map,
        of: String,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    opened: {
        type: Boolean,
        default: false
    },
    errorMsg: {
        type: String,
        default: null
    },
    sentAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for fast lookups by campaign and tracking
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });
CampaignRecipientSchema.index({ campaignId: 1, email: 1 });

module.exports = mongoose.model('CampaignRecipient', CampaignRecipientSchema);
