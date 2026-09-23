const mongoose = require('mongoose');

const EmailCampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    smtpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SmtpConfig',
        required: true
    },
    totalEmails: {
        type: Number,
        default: 0
    },
    sentCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    openedCount: {
        type: Number,
        default: 0
    },
    delaySeconds: {
        type: Number,
        default: 2
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },
    htmlContent: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('EmailCampaign', EmailCampaignSchema);
