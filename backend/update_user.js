const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User'); // Adjust path if needed. Assuming models/User.js exists

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const email = 'business@droobvoyage.com';
            const user = await User.findOne({ email });

            if (!user) {
                console.log(`User with email ${email} not found.`);
                process.exit(1);
            }

            console.log(`Found user: ${user.name} (${user.role})`);

            // Update role
            user.role = 'vendor';

            // Update password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash('123456', salt);

            await user.save();
            console.log(`Successfully updated role to vendor and password to 123456 for ${email}`);
        } catch (error) {
            console.error('Error updating user:', error);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });
