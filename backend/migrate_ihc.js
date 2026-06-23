const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const IhcPricing = require('./models/IhcPricing');

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const content = fs.readFileSync('../logisticscanner_backup.sql', 'utf8');
    const lines = content.split('\n');

    const locationsMap = {};
    const icdRecords = [];

    let isLocationTable = false;
    let isIcdTable = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.startsWith('INSERT INTO `location_master` VALUES') || 
            line.startsWith('INSERT INTO `location_master_new` VALUES') || 
            line.startsWith('INSERT INTO `land_location_master` VALUES')) {
            isLocationTable = true;
            isIcdTable = false;
            continue; // The values start from the next line or on the same line if single line dump, but usually next line.
        } else if (line.startsWith('INSERT INTO `icd_port_via` VALUES')) {
            isLocationTable = false;
            isIcdTable = true;
            continue;
        } else if (line.startsWith('/*!40000 ALTER TABLE') || line.startsWith('UNLOCK TABLES') || line.startsWith('--')) {
            isLocationTable = false;
            isIcdTable = false;
        }

        if (isLocationTable && line.startsWith('(')) {
            // parse location
            // e.g. (1,'DEL','Delhi',...)
            // Just split by comma. This is fragile if cities have commas, but it's a quick migration script.
            const parts = line.substring(1, line.length - 2).split(','); 
            if (parts.length >= 3) {
                const id = parseInt(parts[0]);
                const code = parts[1] ? parts[1].replace(/['\);]/g, '') : '';
                let title = parts[2] ? parts[2].replace(/['\);]/g, '') : '';
                if (!title && parts[3]) {
                    title = parts[3].replace(/['\);]/g, '');
                }
                locationsMap[id] = title || code;
                if (id === 121 || id === 57 || Object.keys(locationsMap).length === 1) {
                    console.log(`Parsed location ID ${id}: code=${code}, title=${title}, RAW=${line}`);
                }
            }
        }

        if (isIcdTable && line.startsWith('(')) {
            // parse icd_port_via
            const parts = line.substring(1, line.length - 2).split(','); 
            if (parts.length >= 10) {
                const id = parseInt(parts[0]);
                const to_id = parseInt(parts[3]);
                const import_price = parseFloat(parts[6]);
                const via = parseInt(parts[9]);
                const standard = parts[10] ? parts[10].replace(/['\);]/g, '') : '';
                
                icdRecords.push({ id, to_id, via, import_price, standard });
            }
        }
    }

    console.log(`Found ${Object.keys(locationsMap).length} locations`);
    console.log(`Found ${icdRecords.length} ICD records`);
    console.log(`ID 121 is: ${locationsMap[121]}`);
    console.log(`ID 57 is: ${locationsMap[57]}`);

    let inserted = 0;
    for (const record of icdRecords) {
        if (record.standard === '20') {
            const destinationName = locationsMap[record.to_id];
            const viaName = locationsMap[record.via];

            if (destinationName && viaName) {
                try {
                    const exists = await IhcPricing.findOne({ viaPort: viaName, destination: destinationName });
                    if (!exists) {
                        await IhcPricing.create({
                            viaPort: viaName,
                            destination: destinationName,
                            ihcPrice: record.import_price,
                            standard20: record.import_price, // As per current implementation standard20 is required
                            currency: 'INR'
                        });
                        inserted++;
                        console.log(`Inserted: ${viaName} -> ${destinationName}`);
                    }
                } catch(e) {
                    console.log('Error inserting:', e.message);
                }
            } else {
                console.log(`Mapping missing for: to_id=${record.to_id}, via=${record.via}`);
            }
        }
    }

    console.log(`Successfully migrated ${inserted} via pricing records.`);
    mongoose.disconnect();
}

migrate().catch(console.error);
