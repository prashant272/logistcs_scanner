require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./models/User');
    const vendors = await User.find({ role: 'vendor', company: /SRKN GLOBAL/i })
        .select('name company activePlan planStartDate planEndDate createdAt');
    console.log(JSON.stringify(vendors, null, 2));
    process.exit(0);
});
