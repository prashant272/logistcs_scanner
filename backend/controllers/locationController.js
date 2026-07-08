const Location = require('../models/Location');

// Add new location
exports.addLocation = async (req, res) => {
    try {
        const {
            type,
            code,
            icao,
            name,
            country,
            countryCode,
            city,
            state
        } = req.body;

        if (!type || (!code && type !== 'Land Port') || !name || !country || !countryCode || !city || !state) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        const location = await Location.create({
            type,
            code,
            icao: icao || '',
            name,
            country,
            countryCode,
            city,
            state
        });

        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all locations (paginated & searchable)
exports.getLocations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;
        const { search, type } = req.query;

        let query = {};
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query = {
                $or: [
                    { code: searchRegex },
                    { icao: searchRegex },
                    { name: searchRegex },
                    { city: searchRegex },
                    { state: searchRegex },
                    { country: searchRegex }
                ]
            };
        }

        if (type) {
            if (type.includes(',')) {
                query.type = { $in: type.split(',') };
            } else {
                query.type = type;
            }
        }

        const totalLocations = await Location.countDocuments(query);
        const locations = await Location.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            locations,
            currentPage: page,
            totalPages: Math.ceil(totalLocations / limit),
            totalLocations
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete location by ID
exports.deleteLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update location by ID
exports.updateLocation = async (req, res) => {
    try {
        const {
            type,
            code,
            icao,
            name,
            country,
            countryCode,
            city,
            state
        } = req.body;

        const location = await Location.findByIdAndUpdate(
            req.params.id,
            { type, code, icao, name, country, countryCode, city, state },
            { new: true, runValidators: true }
        );

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json(location);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
