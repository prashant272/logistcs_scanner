const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    type: {
        type: String,
        enum: ['status_change', 'note', 'system', 'followup'],
        default: 'note'
    }
}, { _id: true });

const crmLeadSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enquiry',
        required: true
    },
    enquiryRefId: {
        type: String,
        required: true
    },
    clientInfo: {
        name: { type: String, default: '' },
        company: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' }
    },
    logisticsDetails: {
        fromLocation: { type: String, default: '' },
        toLocation: { type: String, default: '' },
        mode: { type: String, default: '' },
        commodity: { type: String, default: '' },
        weight: { type: String, default: '' },
        dateOfShipment: { type: String, default: '' }
    },
    price: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Negotiating', 'Closed-Won', 'Closed-Lost'],
        default: 'New'
    },
    timeline: [timelineSchema],
    followUpDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Ensure a vendor can only have one CRM lead per enquiry
crmLeadSchema.index({ vendor: 1, enquiry: 1 }, { unique: true });
crmLeadSchema.index({ status: 1 });
crmLeadSchema.index({ vendor: 1, createdAt: -1 });

module.exports = mongoose.model('CrmLead', crmLeadSchema);
