const mongoose = require('mongoose');

const SystemUpdateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Announcement', 'System Update', 'Feature Update', 'Important'],
        default: 'Announcement'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemUpdate', SystemUpdateSchema);
