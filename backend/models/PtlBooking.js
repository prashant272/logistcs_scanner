const mongoose = require('mongoose');

const ptlBookingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'user_model' },
    user_model: { type: String, required: true, enum: ['User', 'Vendor'] },
    user_role: { type: String, enum: ['customer', 'vendor'] },
    
    // Origin and Destination
    origin_pin: { type: String, required: true },
    dest_pin: { type: String, required: true },
    pickup_address: { type: Object },
    drop_address: { type: Object },
    
    // Package Details
    weight_g: { type: Number, required: true },
    dimensions: [{
        length_cm: Number,
        width_cm: Number,
        height_cm: Number,
        box_count: Number
    }],
    
    // Pricing
    payment_mode: { type: String, enum: ['cod', 'prepaid'], default: 'prepaid' },
    inv_amount: { type: Number },
    
    cod_amount: { type: Number, default: 0 },
    base_price: { type: Number, required: true },
    charged_price: { type: Number, required: true }, // The original finalPrice before markup
    vendor_markup_fee: { type: Number, default: 0 },
    gst_amount: { type: Number, default: 0 },
    total_amount: { type: Number }, // charged_price + markup + gst
    vendor_payment_status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    order_details: { type: Object, default: {} },

    // Delhivery Specific
    delhivery_lr_number: { type: String }, // Actually assigned LRN from Delhivery
    delhivery_job_id: { type: String }, // Async Job ID from Delhivery B2B Manifest API
    delhivery_status: { type: String, default: 'INITIATED' },
    delhivery_tracking_history: { type: Array, default: [] },
    waybills: [{ type: String }],
    delhivery_pickup_id: { type: String },
    shipping_label_url: { type: String },
    client_warehouse_name: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('PtlBooking', ptlBookingSchema);
