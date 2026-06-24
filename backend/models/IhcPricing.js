const mongoose = require('mongoose');

const ihcPricingSchema = new mongoose.Schema({
    viaPort: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    standard20: {
        type: Number
    },
    containerSize: {
        type: String,
        default: '20ft'
    },
    ihcPrice: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    }
}, { timestamps: true });

// Create compound index for faster lookup
ihcPricingSchema.index({ viaPort: 1, destination: 1, containerSize: 1 }, { unique: true });

module.exports = mongoose.model('IhcPricing', ihcPricingSchema);
