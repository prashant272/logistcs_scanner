const mongoose = require('mongoose');
const Pricing = require('../models/Pricing');

// Add new pricing
exports.addPricing = async (req, res) => {
    try {
        const {
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            shippingLine,
            weightRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            cbmRange,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,

            price,
            currency,
            message,
            creditRequired
        } = req.body;

        const pricing = await Pricing.create({
            vendor: req.user.id,
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            shippingLine,
            weightRange,
            cbmRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price,
            currency: currency || 'INR',
            message: message || '',
            status: 'active'
        });

        res.status(201).json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all pricing for the authenticated vendor
exports.getVendorPricing = async (req, res) => {
    try {
        let query = { vendor: req.user.id };
        let pricing = await Pricing.find(query).sort({ createdAt: -1 });

        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0,0,0,0);
        let modified = false;

        for (let p of pricing) {
            if (p.status === 'active' && new Date(p.validUntil) < fifteenDaysAgo) {
                p.status = 'disabled';
                await p.save();
                modified = true;
            }
        }
        
        if (modified) {
            pricing = await Pricing.find(query).sort({ createdAt: -1 });
        }

        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Toggle pricing status (active/disabled)
exports.togglePricingStatus = async (req, res) => {
    try {
        const pricing = await Pricing.findOne({ _id: req.params.id, vendor: req.user.id });
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found or unauthorized' });
        }

        pricing.status = pricing.status === 'active' ? 'disabled' : 'active';
        await pricing.save();
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete pricing entry
exports.deletePricing = async (req, res) => {
    try {
        const pricing = await Pricing.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found or unauthorized' });
        }
        res.json({ message: 'Pricing entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Search pricing matching search criteria
exports.searchPricing = async (req, res) => {
    try {
        const {
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            weightRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            cbmRange,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            viaPort // new field for IHC feature
        } = req.body;

        if (!fromLocation || !toLocation || !type) {
            return res.status(400).json({ message: 'From, To, and Type are required parameters' });
        }

        const parseLoc = (locStr) => {
            const match = locStr.match(/^([^(]+)\s*(?:\(([^)]+)\))?$/);
            if (match) {
                return {
                    city: match[1].trim(),
                    code: match[2] ? match[2].trim() : ''
                };
            }
            return { city: locStr.trim(), code: '' };
        };

        const fromParsed = parseLoc(fromLocation);
        const toParsed = parseLoc(toLocation);

        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const fromOr = [
            { fromLocation: { $regex: new RegExp(escapeRegExp(fromLocation.trim()), 'i') } }
        ];
        if (fromParsed.city) fromOr.push({ fromLocation: { $regex: new RegExp(escapeRegExp(fromParsed.city), 'i') } });
        if (fromParsed.code) fromOr.push({ fromLocation: { $regex: new RegExp(escapeRegExp(fromParsed.code), 'i') } });

        const toOr = [
            { toLocation: { $regex: new RegExp(escapeRegExp(toLocation.trim()), 'i') } }
        ];
        if (toParsed.city) toOr.push({ toLocation: { $regex: new RegExp(escapeRegExp(toParsed.city), 'i') } });
        if (toParsed.code) toOr.push({ toLocation: { $regex: new RegExp(escapeRegExp(toParsed.code), 'i') } });

        // If viaPort is provided, the primary vendor search is from Origin -> ViaPort
        let finalToOr = toOr;
        let ihcMatches = [];
        
        if (viaPort && type.toLowerCase() === 'sea') {
            const viaParsed = parseLoc(viaPort);
            const viaClean = viaPort.replace(/\s*\(.*?\)\s*/g, '').trim();
            const viaOr = [
                { toLocation: { $regex: new RegExp(`^${escapeRegExp(viaPort.trim())}$`, 'i') } },
                { toLocation: { $regex: new RegExp(escapeRegExp(viaPort.trim()), 'i') } },
                { toLocation: { $regex: new RegExp(escapeRegExp(viaClean), 'i') } }
            ];
            if (viaParsed.city) {
                viaOr.push({ toLocation: { $regex: new RegExp(`^${escapeRegExp(viaParsed.city)}$`, 'i') } });
                viaOr.push({ toLocation: { $regex: new RegExp(escapeRegExp(viaParsed.city), 'i') } });
            }
            if (viaParsed.code) {
                viaOr.push({ toLocation: { $regex: new RegExp(`^${escapeRegExp(viaParsed.code)}$`, 'i') } });
            }
            
            finalToOr = viaOr; // Search vendor price to viaPort instead of destination
            
            // We also need to fetch the IHC prices to attach later
            const IhcPricing = require('../models/IhcPricing');
            // Try to find IHC prices for viaPort -> original toLocation
            const cleanDest = toLocation.replace(/\s*\(.*?\)\s*/g, '').trim();
            const ihcQuery = {
                viaPort: { $regex: new RegExp(escapeRegExp(viaClean), 'i') },
                destination: { $regex: new RegExp(`^${escapeRegExp(cleanDest)}$`, 'i') }
            };
            ihcMatches = await IhcPricing.find(ihcQuery);
        }

        // Find matches, populate vendor details
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');

        let userRole = 'customer'; // Default to customer
        let currentUserId = null;
        const authHeader = req.header("Authorization");
        if (authHeader) {
            try {
                const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const currentUser = await User.findById(decoded.id);
                if (currentUser) {
                    if (currentUser.role === 'vendor' && currentUser.verificationStatus !== 'Approved' && currentUser.verificationStatus !== 'Pre-Approved') {
                        return res.status(403).json({ message: 'Your account is not approved yet. Please wait for admin approval to search rates.' });
                    }
                    userRole = currentUser.role;
                    currentUserId = currentUser._id;
                }
            } catch (err) {
                // Ignore token error, treat as customer
            }
        }

        // Build query matching active options (pricing remains searchable up to 15 days after expiry)
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0,0,0,0);

        const query = {
            $and: [
                { $or: fromOr },
                { $or: finalToOr }
            ],
            type: type.toLowerCase(),
            status: 'active',
            validUntil: { $gte: fifteenDaysAgo }
        };

        if (currentUserId) {
            query.vendor = { $ne: currentUserId };
        }

        if (type.toLowerCase() === 'air') {
            if (category) query.category = category.toLowerCase();
            if (airline) query.airline = airline.trim();
            if (weightRange) query.weightRange = weightRange.trim();
        } else if (type.toLowerCase() === 'land') {
            if (truckLoad) query.truckLoad = truckLoad.trim();
            if (vehicleType) query.vehicleType = vehicleType.trim();
        } else if (type.toLowerCase() === 'sea') {
            if (seaLoadType) query.seaLoadType = seaLoadType.trim();
            if (seaLoadType === 'FCL' && fclStandard) {
                query.fclStandard = { $in: [fclStandard.trim(), '', null] };
            } else if (seaLoadType === 'LCL') {
                if (weightRange) query.weightRange = weightRange.trim();
                if (cbmRange) query.cbmRange = cbmRange.trim();
            }
        } else if (type.toLowerCase() === 'warehouse') {
            if (warehouseRateType) query.warehouseRateType = warehouseRateType.trim();
            if (warehouseStorageType) query.warehouseStorageType = warehouseStorageType.trim();
        } else if (type.toLowerCase() === 'cha') {
            if (chaServiceType) query.chaServiceType = chaServiceType.trim();
            if (chaCargoType) query.chaCargoType = chaCargoType.trim();
        }

        console.log('[searchPricing] Request Body:', req.body);
        console.log('[searchPricing] Constructed Query:', JSON.stringify(query, null, 2));
        const matches = await Pricing.find(query)
            .populate({
                path: 'vendor',
                populate: { path: 'activePlan' }
            })
            .sort({ price: 1 }); // Sort by lowest price first
        console.log('[searchPricing] Matches count:', matches.length);

        if (matches.length > 0) {
            // Extract codes/cities to lookup countryCode
            const uniqueLocs = new Set();
            matches.forEach(m => {
                if (m.fromLocation) uniqueLocs.add(m.fromLocation.trim());
                if (m.toLocation) uniqueLocs.add(m.toLocation.trim());
            });

            const locArray = Array.from(uniqueLocs);
            const codes = [];
            const cities = [];

            const parseLocStr = (locStr) => {
                const match = locStr.match(/^([^(]+)\s*(?:\(([^)]+)\))?$/);
                if (match) {
                    return {
                        city: match[1].trim(),
                        code: match[2] ? match[2].trim() : ''
                    };
                }
                return { city: locStr.trim(), code: '' };
            };

            locArray.forEach(l => {
                const parsed = parseLocStr(l);
                if (parsed.code) codes.push(parsed.code.toUpperCase());
                if (parsed.city) cities.push(parsed.city);
            });

            const Location = require('../models/Location');
            const locations = await Location.find({
                $or: [
                    { code: { $in: codes } },
                    { city: { $in: cities.map(c => new RegExp(`^${escapeRegExp(c)}$`, 'i')) } }
                ]
            });

            const locMap = {};
            locations.forEach(loc => {
                if (loc.code) locMap[loc.code.toUpperCase()] = loc.countryCode;
                if (loc.city) locMap[loc.city.toLowerCase()] = loc.countryCode;
            });

            const processedResults = matches.map(match => {
                const matchObj = match.toObject();

                // Dynamic country codes lookup
                const fromParsed = parseLocStr(matchObj.fromLocation || '');
                const toParsed = parseLocStr(matchObj.toLocation || '');

                let fromCountryCode = '';
                if (fromParsed.code) fromCountryCode = locMap[fromParsed.code.toUpperCase()];
                if (!fromCountryCode && fromParsed.city) fromCountryCode = locMap[fromParsed.city.toLowerCase()];

                let toCountryCode = '';
                if (toParsed.code) toCountryCode = locMap[toParsed.code.toUpperCase()];
                if (!toCountryCode && toParsed.city) toCountryCode = locMap[toParsed.city.toLowerCase()];

                matchObj.fromLocationCountryCode = fromCountryCode || '';
                matchObj.toLocationCountryCode = toCountryCode || '';

                // Apply deduction percentage only if another vendor is searching
                if (matchObj.vendor && matchObj.vendor.deductionPercentage && userRole === 'vendor') {
                    const discount = matchObj.price * (matchObj.vendor.deductionPercentage / 100);
                    matchObj.price = parseFloat((matchObj.price - discount).toFixed(2));
                }
                
                // Attach IHC Pricing if it exists
                if (ihcMatches && ihcMatches.length > 0) {
                    const reqSize = fclStandard ? fclStandard.trim() : '';
                    let matchedIhc = null;
                    if (reqSize) {
                        const normalizedSize = reqSize.includes('40') ? '40ft' : '20ft';
                        matchedIhc = ihcMatches.find(m => m.containerSize === normalizedSize);
                    }
                    if (!matchedIhc) {
                        matchedIhc = ihcMatches.find(m => m.containerSize === '20ft') || ihcMatches[0];
                    }

                    matchObj.ihcPrice = matchedIhc.ihcPrice;
                    matchObj.viaPort = matchedIhc.viaPort;
                    matchObj.originalDestination = matchedIhc.destination;
                    matchObj.ihcContainerSize = matchedIhc.containerSize;
                    
                    // Attach all rates for size-wise dropdown/listing display on the frontend
                    matchObj.ihcRates = ihcMatches.map(m => ({
                        containerSize: m.containerSize,
                        ihcPrice: m.ihcPrice
                    }));
                }
                
                return matchObj;
            }).filter(matchObj => {
                if (!matchObj.vendor) return true;
                const mode = matchObj.vendor.serviceIn || 'Both';
                if (mode === 'B2B' && userRole !== 'vendor') return false;
                if (mode === 'B2C' && userRole !== 'customer') return false;
                return true;
            });

            console.log('[searchPricing] Matches before filter:', matches.length);
            console.log('[searchPricing] ProcessedResults after filter:', processedResults.length);
            if (processedResults.length > 0) {
                console.log('[searchPricing] Returning matched: true, count:', processedResults.length);
                res.json({ matched: true, results: processedResults });
            } else {
                console.log('[searchPricing] Returning matched: false');
                res.json({ matched: false });
            }
        } else {
            res.json({ matched: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update pricing entry
exports.updatePricing = async (req, res) => {
    try {
        const {
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            weightRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            cbmRange,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price,
            currency,
            message,
            creditRequired
        } = req.body;

        const pricing = await Pricing.findOne({ _id: req.params.id, vendor: req.user.id });
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found or unauthorized' });
        }

        pricing.fromLocation = fromLocation || pricing.fromLocation;
        pricing.toLocation = toLocation || pricing.toLocation;
        pricing.type = type || pricing.type;
        pricing.category = category !== undefined ? category : pricing.category;
        pricing.airline = airline !== undefined ? airline : pricing.airline;
        pricing.weightRange = weightRange !== undefined ? weightRange : pricing.weightRange;
        pricing.cbmRange = cbmRange !== undefined ? cbmRange : pricing.cbmRange;
        pricing.truckLoad = truckLoad !== undefined ? truckLoad : pricing.truckLoad;
        pricing.vehicleType = vehicleType !== undefined ? vehicleType : pricing.vehicleType;
        pricing.seaLoadType = seaLoadType !== undefined ? seaLoadType : pricing.seaLoadType;
        pricing.fclStandard = fclStandard !== undefined ? fclStandard : pricing.fclStandard;
        pricing.warehouseRateType = warehouseRateType !== undefined ? warehouseRateType : pricing.warehouseRateType;
        pricing.warehouseStorageType = warehouseStorageType !== undefined ? warehouseStorageType : pricing.warehouseStorageType;
        pricing.chaServiceType = chaServiceType !== undefined ? chaServiceType : pricing.chaServiceType;
        pricing.chaCargoType = chaCargoType !== undefined ? chaCargoType : pricing.chaCargoType;
        pricing.handlingType = handlingType !== undefined ? handlingType : pricing.handlingType;
        pricing.additionalServices = additionalServices !== undefined ? additionalServices : pricing.additionalServices;
        pricing.deliverySpeed = deliverySpeed || pricing.deliverySpeed;
        pricing.validUntil = validUntil || pricing.validUntil;
        pricing.price = price !== undefined ? Number(price) : pricing.price;
        pricing.currency = currency !== undefined ? currency : pricing.currency;
        pricing.message = message !== undefined ? message : pricing.message;

        await pricing.save();
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Bulk add pricing entries for a vendor
exports.bulkAddPricing = async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ message: 'Entries array is required and must not be empty' });
        }

        const pricingEntries = [];
        for (const entry of entries) {
            const {
                fromLocation,
                toLocation,
                type,
                category,
                airline,
                weightRange,
                truckLoad,
                vehicleType,
                seaLoadType,
                fclStandard,
                warehouseRateType,
                warehouseStorageType,
                chaServiceType,
                chaCargoType,
                handlingType,
                additionalServices,
                deliverySpeed,
                validUntil,
                price
            } = entry;

            const cleanFromLocation = fromLocation ? String(fromLocation).trim() : 'Test Origin';
            const cleanToLocation = toLocation ? String(toLocation).trim() : 'Test Destination';
            
            let cleanType = type ? String(type).toLowerCase().trim() : 'air';
            const allowedTypes = ['air', 'sea', 'land', 'warehouse', 'cha'];
            if (!allowedTypes.includes(cleanType)) {
                cleanType = 'air';
            }

            const cleanDeliverySpeed = deliverySpeed ? String(deliverySpeed).trim() : '3-5';
            const cleanValidUntil = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const cleanPrice = (price !== undefined && price !== null && !isNaN(Number(price))) ? Number(price) : 100;

            pricingEntries.push({
                vendor: req.user.id,
                fromLocation: cleanFromLocation,
                toLocation: cleanToLocation,
                type: cleanType,
                category: category ? category.toLowerCase().trim() : 'domestic',
                airline: airline || '',
                weightRange: weightRange || '',
                truckLoad: truckLoad || '',
                vehicleType: vehicleType || '',
                seaLoadType: seaLoadType || '',
                fclStandard: fclStandard || '',
                warehouseRateType: warehouseRateType || '',
                warehouseStorageType: warehouseStorageType || '',
                chaServiceType: chaServiceType || '',
                chaCargoType: chaCargoType || '',
                handlingType: handlingType || '',
                additionalServices: additionalServices || '',
                deliverySpeed: cleanDeliverySpeed,
                validUntil: isNaN(cleanValidUntil.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : cleanValidUntil,
                price: cleanPrice,
                status: 'active'
            });
        }

        const inserted = await Pricing.insertMany(pricingEntries);
        res.status(201).json({
            message: `Successfully imported ${inserted.length} pricing entries`,
            count: inserted.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during bulk import', error: error.message });
    }
};
