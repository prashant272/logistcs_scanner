const fs = require('fs');
const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Location = require('./models/Location');

dotenv.config();

// Helper to parse SQL values line
// E.g. (1, 'IXZ', 'VOPB', 'Veer Savarkar Airport', ..., 'airport', 0),
function parseSqlLine(line) {
    // Trim leading/trailing whitespace, parenthesis, and trailing comma/semicolon
    const trimmed = line.trim();
    if (!trimmed.startsWith('(')) return null;

    // Find the end parenthesis matching the start
    // A simple regex or split can work since strings are quoted
    // Let's parse character by character to handle quotes and commas properly
    const values = [];
    let current = '';
    let inString = false;
    let escape = false;

    // Remove outer parentheses
    const body = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/\);?$/, '');

    for (let i = 0; i < body.length; i++) {
        const char = body[i];

        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === "'" || char === '"') {
            inString = !inString;
            continue;
        }

        if (char === ',' && !inString) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());

    // Normalize value helpers
    return values.map(v => {
        if (v.toUpperCase() === 'NULL') return null;
        // Strip quotes if they somehow remained
        return v.replace(/^['"]|['"]$/g, '');
    });
}

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // Clear existing locations first
        console.log('Clearing old locations...');
        await Location.deleteMany({});

        const fileStream = fs.createReadStream('e:/logostics_scanner/logisticscannerdb.sql');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let currentTable = null;
        const locationsToInsert = [];

        console.log('Reading SQL dump...');
        for await (const line of rl) {
            // Identify table
            if (line.includes('INSERT INTO `location_master`')) {
                currentTable = 'location_master';
                continue;
            } else if (line.includes('INSERT INTO `land_location_master`')) {
                currentTable = 'land_location_master';
                continue;
            } else if (line.includes('INSERT INTO `warehouse_location_master`')) {
                currentTable = 'warehouse_location_master';
                continue;
            } else if (line.startsWith('INSERT INTO') || line.startsWith('CREATE TABLE') || line.startsWith('--')) {
                currentTable = null;
            }

            if (currentTable) {
                const parsed = parseSqlLine(line);
                if (!parsed || parsed.length < 5) continue;

                if (currentTable === 'location_master') {
                    // Columns: id(0), code(1), icao(2), name(3), lat(4), lon(5), elev(6), url(7), tz(8), city_code(9), country(10), city(11), state(12), county(13), type(14), status(15)
                    const code = parsed[1];
                    const icao = parsed[2];
                    const name = parsed[3];
                    const countryCode = parsed[10] || 'IN';
                    const city = parsed[11];
                    const state = parsed[12];
                    const country = parsed[13] || 'India';
                    const typeRaw = parsed[14];

                    // Skip empty codes or plans
                    if (!code || !typeRaw) continue;

                    let type = 'Airport';
                    if (typeRaw.toLowerCase() === 'seaport') {
                        type = 'Seaport';
                    } else if (typeRaw.toLowerCase() === 'airport') {
                        type = 'Airport';
                    } else {
                        continue;
                    }

                    locationsToInsert.push({
                        type,
                        code,
                        icao,
                        name,
                        country,
                        countryCode: countryCode.toUpperCase(),
                        city: city || state || 'N/A',
                        state: state || city || 'N/A'
                    });

                } else if (currentTable === 'land_location_master') {
                    // Columns: id(0), code(1), name(2), city_code(3), country(4), city(5), state(6), county(7), status(8), type(9)
                    const code = parsed[1];
                    const name = parsed[2];
                    const countryCode = parsed[4] || 'IN';
                    const city = parsed[5];
                    const state = parsed[6];
                    const country = parsed[7] || 'India';

                    if (!code || !name) continue;

                    locationsToInsert.push({
                        type: 'Land Port',
                        code,
                        icao: '',
                        name,
                        country,
                        countryCode: countryCode.toUpperCase(),
                        city: city || state || 'N/A',
                        state: state || city || 'N/A'
                    });

                } else if (currentTable === 'warehouse_location_master') {
                    // Columns: id(0), code(1), name(2), city_code(3), country(4), city(5), state(6), district(7), county(8), status(9), type(10)
                    const code = parsed[1];
                    const name = parsed[2];
                    const countryCode = parsed[4] || 'IN';
                    const city = parsed[5];
                    const state = parsed[6];
                    const country = parsed[8] || 'India';

                    if (!code || !name) continue;

                    locationsToInsert.push({
                        type: 'Warehouse',
                        code,
                        icao: '',
                        name,
                        country,
                        countryCode: countryCode.toUpperCase(),
                        city: city || state || 'N/A',
                        state: state || city || 'N/A'
                    });
                }
            }
        }

        console.log(`Extracted ${locationsToInsert.length} locations. Inserting into MongoDB...`);
        if (locationsToInsert.length > 0) {
            await Location.insertMany(locationsToInsert);
            console.log('Seeding completed successfully!');
        } else {
            console.log('No locations extracted.');
        }

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

seed();
