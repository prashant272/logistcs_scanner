const mongoose = require('mongoose');

const delhiveryConfigSchema = new mongoose.Schema({
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    jwt_token: { type: String, default: '' },
    token_generated_at: { type: Date },
    vendor_margin_percent: { type: Number, default: 10 },
    customer_margin_percent: { type: Number, default: 20 },
    is_production: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DelhiveryConfig', delhiveryConfigSchema);
