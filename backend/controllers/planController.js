const Plan = require('../models/Plan');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const axios = require('axios');
const crypto = require('crypto');

// Get plans with optional queries (userType, country)
exports.getPlans = async (req, res) => {
    try {
        const { userType, country, activeOnly } = req.query;
        let query = {};
        if (userType) query.userType = userType;
        if (country) {
            query.$or = [
                { country: { $regex: new RegExp(`\\b${country}\\b`, 'i') } },
                { country: { $regex: /Others/i } },
                { country: { $regex: /Worldwide/i } }
            ];
        }
        if (activeOnly === 'true') {
            query.status = 'Active';
        }

        const plans = await Plan.find(query).sort({ price: 1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a plan
exports.createPlan = async (req, res) => {
    try {
        const { name, price, currency, status, inquiryLimit, duration, userType, country, description, planType } = req.body;
        if (!name || !price || !inquiryLimit || !duration || !userType || !country) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const plan = await Plan.create({
            name,
            price: Number(price),
            currency: currency || 'INR',
            status: status || 'Active',
            planType: planType || 'Regular',
            inquiryLimit: Number(inquiryLimit),
            duration,
            userType,
            country,
            description: description || ''
        });

        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update plan status
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Plan.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Plan.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Upgrade user plan
exports.upgradeUserPlan = async (req, res) => {
    try {
        const { planId } = req.body;
        if (!planId) {
            return res.status(400).json({ message: 'Plan ID is required' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (plan.status !== 'Active') {
            return res.status(400).json({ message: 'Selected plan is inactive' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (plan.planType === 'Topup') {
            // Check if user has an active regular plan that was paid for (price > 0)
            if (!user.activePlan || !user.planEndDate || user.planEndDate < new Date()) {
                return res.status(400).json({ message: 'You must have an active regular plan to purchase a top-up.' });
            }
            
            // Populate activePlan if it's just an ID
            const activePlanDoc = await Plan.findById(user.activePlan);
            if (!activePlanDoc || activePlanDoc.price <= 0) {
                return res.status(400).json({ message: 'You can only purchase a top-up if you are on a paid premium plan.' });
            }
        }

        // Determine plan end date based on duration
        const planStartDate = new Date();
        const planEndDate = new Date();
        if (plan.duration === 'Monthly') {
            planEndDate.setMonth(planEndDate.getMonth() + 1);
        } else if (plan.duration === 'Quarterly') {
            planEndDate.setMonth(planEndDate.getMonth() + 3);
        } else if (plan.duration === 'Half-Yearly') {
            planEndDate.setMonth(planEndDate.getMonth() + 6);
        } else if (plan.duration === 'Yearly') {
            planEndDate.setFullYear(planEndDate.getFullYear() + 1);
        } else {
            planEndDate.setMonth(planEndDate.getMonth() + 1); // default to 1 month
        }

        let updateData = {};
        if (plan.planType === 'Topup') {
            updateData = {
                $inc: { topupEnquiryLimit: plan.inquiryLimit },
                topupPlanEndDate: planEndDate
            };
        } else {
            updateData = {
                activePlan: plan._id,
                planStartDate,
                planEndDate
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).populate('activePlan');

        res.json({
            message: `Successfully upgraded to plan ${plan.name}`,
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create Razorpay Order for Plan subscription
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { planId, couponCode } = req.body;
        if (!planId) {
            return res.status(400).json({ message: 'Plan ID is required' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        if (plan.status !== 'Active') {
            return res.status(400).json({ message: 'Selected plan is inactive' });
        }

        let isOutsideIndia = false;
        if (req.user) {
            const user = await User.findById(req.user.id);
            
            if (plan.planType === 'Topup') {
                if (!user.activePlan || !user.planEndDate || user.planEndDate < new Date()) {
                    return res.status(400).json({ message: 'You must have an active regular plan to purchase a top-up.' });
                }
                const activePlanDoc = await Plan.findById(user.activePlan);
                if (!activePlanDoc || activePlanDoc.price <= 0) {
                    return res.status(400).json({ message: 'You can only purchase a top-up if you are on a paid premium plan.' });
                }
            }

            if (user && user.country && user.country.toLowerCase() !== 'india' && user.country.toLowerCase() !== 'in') {
                isOutsideIndia = true;
            }
        }

        let basePrice = plan.price;
        let currencyCode = isOutsideIndia ? 'USD' : 'INR';

        let finalPrice = basePrice;
        let discountAmount = 0;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
            if (coupon && coupon.status === 'Active' && new Date(coupon.expiryDate) >= new Date()) {
                if (coupon.discountType === 'Percent') {
                    discountAmount = (basePrice * coupon.discountValue) / 100;
                } else {
                    discountAmount = coupon.discountValue;
                }
                if (discountAmount > basePrice) {
                    discountAmount = basePrice;
                }
                finalPrice = basePrice - discountAmount;
            }
        }

        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_SQFIjwkG0C66Mu';
        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';

        let gstAmount = Math.round((finalPrice * 18) / 100);
        let totalPriceWithGst = finalPrice + gstAmount;

        const amountInPaise = Math.round(totalPriceWithGst * 100);

        const authHeader = 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: amountInPaise,
                currency: currencyCode,
                receipt: `rcpt_${plan._id.toString().slice(-6)}_${Date.now().toString().slice(-8)}`
            },
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            orderId: response.data.id,
            amount: response.data.amount,
            currency: response.data.currency,
            keyId: keyId,
            planName: plan.name,
            planPrice: basePrice,
            finalPrice: finalPrice,
            gstAmount: gstAmount,
            totalPriceWithGst: totalPriceWithGst,
            discountAmount: discountAmount
        });
    } catch (error) {
        console.error('Razorpay Order Creation Error:', error.response?.data || error.message);
        res.status(500).json({ 
            message: 'Failed to create payment order', 
            error: error.response?.data?.error?.description || error.message 
        });
    }
};

// Verify Razorpay Payment Signature and Upgrade Plan
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!planId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'All payment verification details are required' });
        }

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET || '1Z1SD6PB3KZG5IVSyZ7FitVD';

        const generated_signature = crypto
            .createHmac('sha256', keySecret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (plan.planType === 'Topup') {
            if (!user.activePlan || !user.planEndDate || user.planEndDate < new Date()) {
                return res.status(400).json({ message: 'You must have an active regular plan to purchase a top-up.' });
            }
            
            const activePlanDoc = await Plan.findById(user.activePlan);
            if (!activePlanDoc || activePlanDoc.price <= 0) {
                return res.status(400).json({ message: 'You can only purchase a top-up if you are on a paid premium plan.' });
            }
        }

        const planStartDate = new Date();
        const planEndDate = new Date();
        if (plan.duration === 'Monthly') {
            planEndDate.setMonth(planEndDate.getMonth() + 1);
        } else if (plan.duration === 'Quarterly') {
            planEndDate.setMonth(planEndDate.getMonth() + 3);
        } else if (plan.duration === 'Half-Yearly') {
            planEndDate.setMonth(planEndDate.getMonth() + 6);
        } else if (plan.duration === 'Yearly') {
            planEndDate.setFullYear(planEndDate.getFullYear() + 1);
        } else {
            planEndDate.setMonth(planEndDate.getMonth() + 1);
        }

        let updateData = {};
        if (plan.planType === 'Topup') {
            updateData = {
                $inc: { topupEnquiryLimit: plan.inquiryLimit },
                topupPlanEndDate: planEndDate
            };
        } else {
            updateData = {
                activePlan: plan._id,
                planStartDate,
                planEndDate
            };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).populate('activePlan');

        res.json({
            message: `Successfully subscribed to ${plan.name}`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Razorpay Payment Verification Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const UpgradeActivity = require('../models/UpgradeActivity');

exports.logUpgradeActivity = async (req, res) => {
    try {
        const { action, planId, planName, amount, notes } = req.body;
        
        await UpgradeActivity.create({
            vendor: req.user.id,
            action,
            planDetails: { planId, planName, amount },
            notes
        });

        res.status(201).json({ message: 'Activity logged successfully' });
    } catch (error) {
        console.error('Log Upgrade Activity Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUpgradeRequests = async (req, res) => {
    try {
        const activities = await UpgradeActivity.find()
            .populate('vendor', 'name email phone company address')
            .sort({ createdAt: -1 })
            .lean();

        const vendorsMap = new Map();

        for (const act of activities) {
            if (!act.vendor) continue;
            
            const vendorId = act.vendor._id.toString();
            if (!vendorsMap.has(vendorId)) {
                const User = require('../models/User');
                const vendorData = await User.findById(vendorId).populate('activePlan').lean();
                
                vendorsMap.set(vendorId, {
                    vendor: act.vendor,
                    currentPlan: vendorData?.activePlan?.name || 'Free / None',
                    latestActivity: act.createdAt,
                    activities: []
                });
            }
            
            vendorsMap.get(vendorId).activities.push(act);
        }

        const data = Array.from(vendorsMap.values());
        res.json({ data });
    } catch (error) {
        console.error('Get Upgrade Requests Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
