const mongoose = require('mongoose');

const manualTrackingSchema = new mongoose.Schema({
    lr_number: { type: String, required: true, unique: true },
    custom_location: { type: String, required: true },
    added_by: { type: String }, // Can store admin ID or username if needed later
}, { timestamps: true });

module.exports = mongoose.model('ManualTracking', manualTrackingSchema);
