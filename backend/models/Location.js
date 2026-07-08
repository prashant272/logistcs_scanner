const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Airport', 'Seaport', 'Land Port', 'Warehouse', 'CHA'],
        trim: true
    },
    code: {
        type: String,
        required: function() { return this.type !== 'Land Port'; },
        trim: true,
        uppercase: true
    },
    icao: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

locationSchema.index({ type: 1, code: 1 });
locationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Location', locationSchema);
