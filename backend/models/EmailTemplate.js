const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        trim: true,
        default: ''
    },
    // The raw HTML to be sent in the email
    htmlContent: {
        type: String,
        required: true
    },
    // The JSON representation for the drag-and-drop builder to re-edit
    designJson: {
        type: Object,
        default: null
    },
    type: {
        type: String,
        enum: ['visual', 'html'],
        default: 'visual'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
module.exports = EmailTemplate;
