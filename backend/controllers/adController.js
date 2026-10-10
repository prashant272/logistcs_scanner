const Ad = require('../models/Ad');

// Create a new Ad (Admin only)
exports.createAd = async (req, res) => {
    try {
        const { title, sponsorName, headline, description, imageUrl, features, buttonText, linkUrl, placement, targetSection, isActive } = req.body;
        
        const newAd = new Ad({
            title,
            sponsorName,
            headline,
            description,
            imageUrl,
            features,
            buttonText,
            linkUrl,
            placement,
            targetSection,
            isActive
        });
        
        await newAd.save();
        res.status(201).json({ message: 'Ad created successfully', ad: newAd });
    } catch (error) {
        console.error('Error creating Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all Ads (Admin only)
exports.getAllAds = async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        console.error('Error fetching Ads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an Ad (Admin only)
exports.updateAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json({ message: 'Ad updated successfully', ad });
    } catch (error) {
        console.error('Error updating Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an Ad (Admin only)
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Error deleting Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get active Ads by section (Public / Vendors)
exports.getActiveAds = async (req, res) => {
    try {
        const { section } = req.query; // 'direct_enquiry' or 'b2b_enquiry'
        
        let query = { isActive: true };
        
        if (section) {
            query.targetSection = { $in: [section, 'both'] };
        }
        
        const ads = await Ad.find(query).sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        console.error('Error fetching active Ads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
