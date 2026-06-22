const mongoose = require('mongoose');

const financeApplicationSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    carrierId: {
        type: String,
        required: true,
        default: function() {
            // Generate a random 10 digit carrier ID or similar logic if needed,
            // or we will set it from frontend if user inputs it. Let's auto-generate a fallback.
            return '1000' + Math.floor(100000 + Math.random() * 900000).toString();
        }
    },
    // 1. Director, Partner, Proprietor Information
    director1: {
        name: { type: String },
        email: { type: String },
        mobile: { type: String },
        gender: { type: String },
        city: { type: String },
        state: { type: String },
        address: { type: String },
        aadharFile: { type: String }, // URL
        panFile: { type: String }     // URL
    },
    // 2. Personal Details
    personalDetails: {
        panName: {
            salutation: { type: String },
            firstName: { type: String },
            middleName: { type: String },
            lastName: { type: String }
        },
        fatherName: {
            salutation: { type: String },
            firstName: { type: String },
            middleName: { type: String },
            lastName: { type: String }
        },
        motherName: {
            salutation: { type: String },
            firstName: { type: String },
            middleName: { type: String },
            lastName: { type: String }
        },
        nationality: { type: String, default: 'India' },
        residentialStatus: { type: String }
    },
    // 3. Second Director, Accounts, Finance, Authorized Signatory
    director2: {
        name: { type: String },
        mobile: { type: String },
        designation: { type: String },
        dob: { type: Date },
        workTenure: { type: String },
        email: { type: String },
        aadharFile: { type: String }, // URL
        panFile: { type: String }     // URL
    },
    // 4. Logistic Financer Document
    businessDetails: {
        businessType: { type: String },
        businessAge: { type: String },
        gstRegistered: { type: String }, // Yes/No
        msmeRegistered: { type: String }, // Yes/No
        yearlySales: { type: String },
        
        // Files
        officePhotoFile: { type: String },
        bankStatementFile: { type: String },
        latestITRFile: { type: String },
        electricityBillFile: { type: String },
        gstCertificateFile: { type: String },
        companyPanFile: { type: String },
        directorPhotoFile: { type: String }
    },
    
    // Admin Fields
    adminStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Declined', 'Rejected'],
        default: 'Pending'
    },
    approvedAmount: {
        type: String,
        default: ''
    },
    processingFees: {
        type: String,
        default: ''
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    termsAndConditions: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FinanceApplication', financeApplicationSchema);
