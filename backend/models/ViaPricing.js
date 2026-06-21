const mongoose = require('mongoose');

const viaPricingSchema = new mongoose.Schema({
    toLocation: {
        type: String,
        required: true,
        trim: true
    },
    via: {
        type: String,
        required: true,
        trim: true
    },
    ihcPrice: {
        type: Number,
        required: true
    },
    standard20: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ViaPricing', viaPricingSchema);
