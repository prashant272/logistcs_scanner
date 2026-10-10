const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    buttonText: {
        type: String,
        default: 'Got It'
    },
    buttonLink: {
        type: String,
        default: ''
    },
    targetAudience: {
        type: String,
        enum: ['customer', 'vendor', 'all'],
        default: 'all'
    },
    displayType: {
        type: String,
        enum: ['global', 'specific_route'],
        default: 'global'
    },
    targetRoutes: {
        type: [String],
        default: []
    },
    frequency: {
        type: String,
        enum: ['once', 'always'],
        default: 'once'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Popup', popupSchema);
