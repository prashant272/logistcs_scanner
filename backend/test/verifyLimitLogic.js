const mongoose = require('mongoose');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Plan = require('../models/Plan');
require('dotenv').config({ path: '../.env' });

const verifyLimits = async () => {
    console.log('--- Starting Limit Logic Verification ---\n');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Database');

        // Target a specific vendor or pick the first active vendor
        const targetEmail = process.argv[2]; // Can pass email as argument
        let vendorUser;

        if (targetEmail) {
            vendorUser = await User.findOne({ email: targetEmail, role: 'vendor' }).populate('activePlan');
        } else {
            vendorUser = await User.findOne({ role: 'vendor', activePlan: { $ne: null } }).populate('activePlan');
        }

        if (!vendorUser) {
            console.log('❌ No suitable vendor found for testing.');
            process.exit(1);
        }

        console.log(`\nTesting for Vendor: ${vendorUser.name} (${vendorUser.email})`);
        console.log(`Vendor ID: ${vendorUser._id}`);

        // 1. Calculate Limit
        let inquiryLimit = 5; // Default free limit
        const hasActivePlan = vendorUser.activePlan && vendorUser.planEndDate && new Date(vendorUser.planEndDate) > new Date();
        
        if (hasActivePlan && vendorUser.activePlan.inquiryLimit) {
            inquiryLimit = vendorUser.activePlan.inquiryLimit;
        }
        if (!vendorUser.topupPlanEndDate || new Date(vendorUser.topupPlanEndDate) > new Date()) {
            inquiryLimit += (vendorUser.topupEnquiryLimit || 0);
        }
        
        console.log(`📌 Total Allowed Limit for this month: ${inquiryLimit}`);

        // 2. Calculate Accepted Count (Using the new robust logic)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const vendorObjectId = new mongoose.Types.ObjectId(vendorUser._id);

        const acceptedCount = await Enquiry.countDocuments({
            $or: [
                { vendor: vendorObjectId, status: { $in: ['Accepted', 'Quoted'] }, updatedAt: { $gte: startOfMonth } },
                { 'responses': { $elemMatch: { vendor: vendorObjectId, status: { $in: ['Accepted', 'Quoted'] }, createdAt: { $gte: startOfMonth } } } }
            ]
        });

        console.log(`📊 Total Enquiries Accepted this month: ${acceptedCount}`);

        // 3. Final Verification
        console.log('\n--- Result ---');
        if (acceptedCount >= inquiryLimit) {
            console.log('🛑 BLOCKED: Monthly limit reached. The vendor will NOT be able to accept new enquiries.');
            console.log('   (They can still update their old quotes because of the alreadyRespondedThis check)');
        } else {
            console.log(`✅ ALLOWED: The vendor can still accept ${inquiryLimit - acceptedCount} more enquiries this month.`);
        }
        console.log('----------------------------------------\n');

    } catch (err) {
        console.error('Error during verification:', err);
    } finally {
        mongoose.connection.close();
    }
};

verifyLimits();
