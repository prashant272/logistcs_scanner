const Offer = require('../models/Offer');

// Create Offer
exports.createOffer = async (req, res) => {
    try {
        const offer = await Offer.create(req.body);
        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get All Offers
exports.getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Validate Offer
exports.validateOffer = async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        const offer = await Offer.findOne({ code: code.toUpperCase(), isActive: true });

        if (!offer) {
            return res.status(404).json({ message: "Invalid Coupon Code" });
        }

        if (offer.assignedTo && req.user && offer.assignedTo.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'This offer is strictly assigned to another user.' });
        }

        if (orderValue < offer.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ₹${offer.minOrderValue} required` });
        }

        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: "Offer deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
