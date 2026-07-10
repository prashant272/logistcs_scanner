const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizeLocationInput } = require('../utils/locationNormalizer');

// Load environment variables (assuming it is run from backend root)
require('dotenv').config();

const migrateLocations = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const vendors = await User.find({ role: 'vendor' });
        console.log(`Found ${vendors.length} vendors. Normalizing locations...`);

        let updateCount = 0;

        for (let vendor of vendors) {
            let changed = false;
            let currentCountry = vendor.country;
            let currentCity = vendor.city;

            const normalized = await normalizeLocationInput(currentCountry, currentCity);

            if (currentCountry && normalized.country && currentCountry !== normalized.country) {
                vendor.country = normalized.country;
                changed = true;
            }

            if (currentCity && normalized.city && currentCity !== normalized.city) {
                vendor.city = normalized.city;
                changed = true;
            }

            if (changed) {
                await vendor.save();
                console.log(`Updated vendor ${vendor._id} (${vendor.name || vendor.company})`);
                console.log(`  Country: ${currentCountry} -> ${normalized.country}`);
                console.log(`  City: ${currentCity} -> ${normalized.city}`);
                updateCount++;
            }
        }

        console.log(`\nMigration complete. Updated ${updateCount} vendors.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateLocations();
