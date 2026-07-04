const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromLocation: {
        type: String,
        required: true,
        trim: true
    },
    toLocation: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['air', 'sea', 'land', 'warehouse', 'cha'],
        lowercase: true
    },
    category: {
        type: String,
        enum: ['domestic', 'international'],
        lowercase: true,
        default: 'domestic'
    },
    airline: {
        type: String,
        trim: true,
        default: ''
    },
    shippingLine: {
        type: String,
        trim: true,
        default: ''
    },
    weightRange: {
        type: String,
        trim: true,
        default: ''
    },
    cbmRange: {
        type: String,
        trim: true,
        default: ''
    },
    truckLoad: {
        type: String,
        trim: true,
        default: ''
    },
    vehicleType: {
        type: String,
        trim: true,
        default: ''
    },
    seaLoadType: {
        type: String,
        trim: true,
        default: ''
    },
    fclStandard: {
        type: String,
        trim: true,
        default: ''
    },
    warehouseRateType: {
        type: String,
        trim: true,
        default: ''
    },
    warehouseStorageType: {
        type: String,
        trim: true,
        default: ''
    },
    chaServiceType: {
        type: String,
        trim: true,
        default: ''
    },
    chaCargoType: {
        type: String,
        trim: true,
        default: ''
    },
    handlingType: {
        type: String,
        trim: true,
        default: ''
    },
    additionalServices: {
        type: String,
        trim: true,
        default: ''
    },
    deliverySpeed: {
        type: String,
        trim: true,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        trim: true
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient search
pricingSchema.index({ fromLocation: 1, toLocation: 1, type: 1, status: 1 });

module.exports = mongoose.model('Pricing', pricingSchema);
