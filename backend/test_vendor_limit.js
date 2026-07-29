require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry');
const User = require('./models/User');

async function checkOldUnacceptedB2B() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/logistics_scanner');
        
        const vendorIds = await User.find({ role: 'vendor' }).distinct('_id');
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

        const q = {
            isDirect: true,
            client: { $in: vendorIds },
            type: { $ne: 'land' },
            createdAt: { $lte: threeHoursAgo },
            responses: { $not: { $elemMatch: { status: { $in: ['Accepted', 'Quoted'] } } } },
            status: { $ne: 'Accepted' }
        };

        const count = await Enquiry.countDocuments(q);
        const enqs = await Enquiry.find(q).select('_id createdAt guestName client').limit(3).populate('client', 'name');
        
        console.log(`Found ${count} unaccepted B2B enquiries older than 3 hours.`);
        for (const enq of enqs) {
            console.log(`- ID: ${enq._id} | Created: ${enq.createdAt} | Creator: ${enq.guestName || (enq.client ? enq.client.name : 'Unknown')}`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOldUnacceptedB2B();
