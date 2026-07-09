const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'vendor'],
        default: 'customer'
    },
    company: {
        type: String,
        default: ''
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    uploadedDocument: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    pincode: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    alternativeEmail: {
        type: String,
        default: ''
    },
    alternativeNumber: {
        type: String,
        default: ''
    },
    dateOfIncorporation: {
        type: Date
    },
    companyAge: {
        type: String,
        default: ''
    },
    directorsNames: {
        type: String,
        default: ''
    },
    directorsCount: {
        type: Number,
        default: 0
    },
    lastYearTurnover: {
        type: String,
        default: ''
    },
    gst: {
        type: String,
        default: ''
    },
    pan: {
        type: String,
        default: ''
    },
    isBranch: {
        type: Boolean,
        default: false
    },
    parentCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    serviceLocations: {
        type: [String],
        default: []
    },
    companyProfile: {
        type: String,
        default: ''
    },
    serviceIn: {
        type: String,
        enum: ['B2B', 'B2C', 'Both'],
        default: 'Both'
    },
    services: {
        type: [String],
        default: []
    },
    deductionPercentage: {
        type: Number,
        default: 0.00
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['Pending', 'Pre Approved', 'Approved', 'Declined'],
        default: 'Pending'
    },
    preApprovedAt: {
        type: Date,
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    otp: {
        type: String,
        default: ''
    },
    otpExpires: {
        type: Date
    },
    activePlan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        default: null
    },
    planStartDate: {
        type: Date
    },
    planEndDate: {
        type: Date
    },
    topupEnquiryLimit: {
        type: Number,
        default: 0
    },
    topupPlanEndDate: {
        type: Date
    },
    assignedRM: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RM',
        default: null
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    creditScore: {
        type: Number,
        default: 100
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    lastLoginSource: {
        type: String,
        enum: ['web', 'app'],
        default: 'web'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.index({ role: 1 });
userSchema.index({ verificationStatus: 1 });
userSchema.index({ role: 1, verificationStatus: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
