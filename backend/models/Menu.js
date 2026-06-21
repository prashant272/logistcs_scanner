const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a menu name"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please add a description"],
    },
    price: {
        type: Number,
        default: 0
    },
    variants: [{
        name: { type: String, required: true }, // e.g., 'Quarter', 'Half', 'Full'
        price: { type: Number, required: true }
    }],
    category: {
        type: String,
        required: [true, "Please add a category"],
        enum: ['Chicken Biryani', 'Mutton Biryani', 'Veg Biryani', 'Starters', 'Combos', 'Sides', 'Beverages', 'Other'],
        default: 'Other'
    },
    image: {
        type: String,
        default: "https://via.placeholder.com/150",
    },
    available: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Menu", menuSchema);
