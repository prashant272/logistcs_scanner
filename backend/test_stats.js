const mongoose = require('mongoose');
const Enquiry = require('./models/Enquiry'); // Adjust path

async function testStats() {
    try {
        await mongoose.connect('mongodb+srv://prashantkrjha12:Pra%401234@cluster0.qu1wf66.mongodb.net/logistics_scanner?retryWrites=true&w=majority&appName=Cluster0');
        
        // Target vendor ID based on user's screenshot
        // Let's find Gokul Sankar
        const User = require('./models/User');
        const user = await User.findOne({ email: 'gokulsankar143@gmail.com' });
        if (!user) {
            console.log("User not found");
            return;
        }

        const query = { client: user._id, isBooking: true, isDirect: true };
        console.log("Query:", query);

        const count = await Enquiry.countDocuments(query);
        console.log("Raw Count:", count);

        const docs = await Enquiry.find(query).select('isLocked status isDirect isBooking client vendor');
        console.log("Docs:", docs);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

testStats();
