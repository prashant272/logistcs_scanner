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
    message: {
        type: String,
        trim: true,
        default: ''
    },
    clientCreditRequired: {
        type: Boolean,
        default: false
    },
    quoteDetails: {
        type: Object,
        default: null
    },
    responses: [{
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        price: Number,
        quoteDetails: Object,
        status: { type: String, enum: ['Quoted', 'Accepted', 'Declined'], default: 'Quoted' },
        createdAt: { type: Date, default: Date.now }
    }],
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
    targetPrice: {
        type: Number,
        default: null
    },
    attachment: {
        type: String,
        default: ''
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
    targetedVendors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

enquirySchema.index({ status: 1 });
enquirySchema.index({ client: 1 });
enquirySchema.index({ vendor: 1 });
enquirySchema.index({ targetedVendors: 1 });
enquirySchema.index({ guestEmail: 1 });
enquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
