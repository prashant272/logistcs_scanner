const mongoose = require('mongoose');

const SmtpConfigSchema = new mongoose.Schema({
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    host: {
        type: String,
        required: true
    },
    port: {
        type: Number,
        required: true,
        default: 465
    },
    user: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    fromName: {
        type: String,
        required: true
    },
    fromEmail: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SmtpConfig', SmtpConfigSchema);
