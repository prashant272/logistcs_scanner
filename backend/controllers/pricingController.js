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
            weightRange,
            truckLoad,
            vehicleType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price
        } = req.body;

        const pricing = await Pricing.create({
            vendor: req.user.id,
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            weightRange,
            truckLoad,
            vehicleType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price,
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
        const isAdmin = req.user.id === 'ad0000000000000000000000';
        let query = {};
        if (!isAdmin) {
            query.vendor = req.user.id;
        }
        const pricing = await Pricing.find(query).sort({ createdAt: -1 });
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
            vehicleType
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
            { fromLocation: { $regex: new RegExp(`^${escapeRegExp(fromLocation.trim())}$`, 'i') } }
        ];
        if (fromParsed.city) fromOr.push({ fromLocation: { $regex: new RegExp(`^${escapeRegExp(fromParsed.city)}$`, 'i') } });
        if (fromParsed.code) fromOr.push({ fromLocation: { $regex: new RegExp(`^${escapeRegExp(fromParsed.code)}$`, 'i') } });

        const toOr = [
            { toLocation: { $regex: new RegExp(`^${escapeRegExp(toLocation.trim())}$`, 'i') } }
        ];
        if (toParsed.city) toOr.push({ toLocation: { $regex: new RegExp(`^${escapeRegExp(toParsed.city)}$`, 'i') } });
        if (toParsed.code) toOr.push({ toLocation: { $regex: new RegExp(`^${escapeRegExp(toParsed.code)}$`, 'i') } });

        // Build query matching active options
        const query = {
            $and: [
                { $or: fromOr },
                { $or: toOr }
            ],
            type: type.toLowerCase(),
            status: 'active',
            validUntil: { $gte: new Date() }
        };

        if (type.toLowerCase() === 'air') {
            if (category) query.category = category.toLowerCase();
            if (airline) query.airline = airline.trim();
            if (weightRange) query.weightRange = weightRange.trim();
        } else if (type.toLowerCase() === 'land') {
            if (truckLoad) query.truckLoad = truckLoad.trim();
            if (vehicleType) query.vehicleType = vehicleType.trim();
        }

        // Find matches, populate vendor details
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');

        let userRole = 'customer'; // Default to customer
        const authHeader = req.header("Authorization");
        if (authHeader) {
            try {
                const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const currentUser = await User.findById(decoded.id);
                if (currentUser) {
                    userRole = currentUser.role;
                }
            } catch (err) {
                // Ignore token error, treat as customer
            }
        }

        const matches = await Pricing.find(query)
            .populate('vendor')
            .sort({ price: 1 }); // Sort by lowest price first

        if (matches.length > 0) {
            const processedResults = matches.map(match => {
                const matchObj = match.toObject();
                // Apply deduction percentage only if another vendor is searching
                if (matchObj.vendor && matchObj.vendor.deductionPercentage && userRole === 'vendor') {
                    const discount = matchObj.price * (matchObj.vendor.deductionPercentage / 100);
                    matchObj.price = parseFloat((matchObj.price - discount).toFixed(2));
                }
                return matchObj;
            }).filter(matchObj => {
                if (!matchObj.vendor) return true;
                const mode = matchObj.vendor.serviceIn || 'Both';
                if (mode === 'B2B' && userRole !== 'vendor') return false;
                if (mode === 'B2C' && userRole !== 'customer') return false;
                return true;
            });

            if (processedResults.length > 0) {
                res.json({ matched: true, results: processedResults });
            } else {
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
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price
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
        pricing.truckLoad = truckLoad !== undefined ? truckLoad : pricing.truckLoad;
        pricing.vehicleType = vehicleType !== undefined ? vehicleType : pricing.vehicleType;
        pricing.handlingType = handlingType !== undefined ? handlingType : pricing.handlingType;
        pricing.additionalServices = additionalServices !== undefined ? additionalServices : pricing.additionalServices;
        pricing.deliverySpeed = deliverySpeed || pricing.deliverySpeed;
        pricing.validUntil = validUntil || pricing.validUntil;
        pricing.price = price !== undefined ? Number(price) : pricing.price;

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
