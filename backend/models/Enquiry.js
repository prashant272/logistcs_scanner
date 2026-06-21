const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    guestName: {
        type: String,
        trim: true,
        default: ''
    },
    guestEmail: {
        type: String,
        trim: true,
        default: ''
    },
    guestPhone: {
        type: String,
        trim: true,
        default: ''
    },
    guestCompany: {
        type: String,
        trim: true,
        default: ''
    },
    commodity: {
        type: String,
        trim: true,
        default: ''
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
    weightRange: {
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
        default: ''
    },
    price: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined'],
        default: 'Pending'
    },
    isDirect: {
        type: Boolean,
        default: false
    },
    isBooking: {
        type: Boolean,
        default: false
    },
    excludedVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Enquiry', enquirySchema);
