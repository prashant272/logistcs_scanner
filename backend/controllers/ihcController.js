const IhcPricing = require('../models/IhcPricing');
const Location = require('../models/Location');

exports.createIhcPricing = async (req, res) => {
    try {
        const { via, toLocation, standard20, ihcPrice, currency } = req.body;
        const viaPort = via;
        const destination = toLocation;

        // Basic validation
        if (!viaPort || !destination || standard20 === undefined || ihcPrice === undefined) {
            return res.status(400).json({ message: 'All fields (via, toLocation, standard20, ihcPrice) are required.' });
        }

        // Check if exists to avoid unique constraint error
        const existing = await IhcPricing.findOne({ viaPort, destination });
        if (existing) {
            return res.status(400).json({ message: 'IHC Price for this route and container size already exists.' });
        }

        const newIhc = new IhcPricing({
            viaPort,
            destination,
            standard20: Number(standard20),
            ihcPrice: Number(ihcPrice),
            currency: currency || 'INR'
        });

        await newIhc.save();
        res.status(201).json({ message: 'IHC Price created successfully', data: newIhc });
    } catch (err) {
        console.error('Error creating IHC pricing:', err);
        res.status(500).json({ message: 'Server error while creating IHC pricing' });
    }
};

exports.getAllIhcPricing = async (req, res) => {
    try {
        const ihcPricings = await IhcPricing.find().sort({ createdAt: -1 });
        res.status(200).json({ data: ihcPricings });
    } catch (err) {
        console.error('Error fetching IHC pricing:', err);
        res.status(500).json({ message: 'Server error while fetching IHC pricing' });
    }
};

exports.deleteIhcPricing = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await IhcPricing.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({ message: 'IHC Pricing not found' });
        }

        res.status(200).json({ message: 'IHC Pricing deleted successfully' });
    } catch (err) {
        console.error('Error deleting IHC pricing:', err);
        res.status(500).json({ message: 'Server error while deleting IHC pricing' });
    }
};

exports.updateIhcPricing = async (req, res) => {
    try {
        const { id } = req.params;
        const { via, toLocation, standard20, ihcPrice, currency } = req.body;
        
        const result = await IhcPricing.findByIdAndUpdate(
            id, 
            { ihcPrice: Number(ihcPrice), standard20: Number(standard20), viaPort: via, destination: toLocation }, 
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ message: 'IHC Pricing not found' });
        }

        res.status(200).json({ message: 'IHC Pricing updated successfully', data: result });
    } catch (err) {
        console.error('Error updating IHC pricing:', err);
        res.status(500).json({ message: 'Server error while updating IHC pricing' });
    }
};

// API for customer search to get available VIA ports for a specific destination
exports.getAvailableViaPorts = async (req, res) => {
    try {
        const { destination } = req.query;
        if (!destination) {
            return res.status(400).json({ message: 'Destination is required' });
        }

        // Find all distinct viaPorts that have an IHC price to the given destination
        const viaPorts = await IhcPricing.distinct('viaPort', { 
            destination: new RegExp(`^${destination}$`, 'i') 
        });

        res.status(200).json({ data: viaPorts });
    } catch (err) {
        console.error('Error fetching via ports:', err);
        res.status(500).json({ message: 'Server error while fetching via ports' });
    }
};
