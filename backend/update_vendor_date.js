require('dotenv').config();
const mongoose = require('mongoose');

async function updateVendorDate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./models/User');

        const vendor = await User.findOne({ email: 'sales@accuratelogistics.co' });
        if (!vendor) {
            console.log('Vendor with email sales@accuratelogistics.co not found.');
            process.exit(1);
        }

        console.log('Current Vendor Data:');
        console.log({
            _id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            company: vendor.company,
            createdAt: vendor.createdAt,
            approvedAt: vendor.approvedAt
        });

        // Set approvedAt to createdAt
        vendor.approvedAt = vendor.createdAt;
        await vendor.save();

        console.log('\nUpdated Vendor Data:');
        console.log({
            _id: vendor._id,
            name: vendor.name,
            email: vendor.email,
            company: vendor.company,
            createdAt: vendor.createdAt,
            approvedAt: vendor.approvedAt
        });

        console.log('\nSuccessfully updated approvedAt to match createdAt!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating vendor:', err);
        process.exit(1);
    }
}

updateVendorDate();
