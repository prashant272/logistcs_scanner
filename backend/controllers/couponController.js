const Coupon = require('../models/Coupon');
const Plan = require('../models/Plan');

// Get all coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, expiryDate, status } = req.body;
        if (!code || !discountType || !discountValue || !expiryDate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            expiryDate: new Date(expiryDate),
            status: status || 'Active'
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Toggle status
exports.toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        coupon.status = coupon.status === 'Active' ? 'Inactive' : 'Active';
        await coupon.save();
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Coupon.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Validate a coupon for checkout
exports.validateCoupon = async (req, res) => {
    try {
        const { code, planId } = req.body;
        if (!code || !planId) {
            return res.status(400).json({ message: 'Coupon code and Plan ID are required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        if (coupon.status !== 'Active') {
            return res.status(400).json({ message: 'Coupon is inactive' });
        }

        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'Percent') {
            discountAmount = (plan.price * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // Cap discount to plan price
        if (discountAmount > plan.price) {
            discountAmount = plan.price;
        }

        const finalPrice = plan.price - discountAmount;

        res.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            finalPrice
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountType, discountValue, expiryDate, status } = req.body;
        
        const updated = await Coupon.findByIdAndUpdate(
            id,
            {
                code: code ? code.toUpperCase() : undefined,
                discountType,
                discountValue: discountValue ? Number(discountValue) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                status
            },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
