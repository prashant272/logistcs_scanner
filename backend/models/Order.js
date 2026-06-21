const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        location: { type: String } // Optional: Coordinates or simpler location string
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{
        menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
        name: { type: String, required: true },
        variant: { type: String }, // e.g., 'Half'
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'UPI'],
        default: 'COD'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", orderSchema);
