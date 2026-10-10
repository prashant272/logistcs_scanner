const Popup = require('../models/Popup');

// Create a new popup (Admin only)
exports.createPopup = async (req, res) => {
    try {
        const { title, content, imageUrl, buttonText, buttonLink, targetAudience, displayType, targetRoutes, frequency, isActive } = req.body;
        
        const newPopup = new Popup({
            title,
            content,
            imageUrl,
            buttonText,
            buttonLink,
            targetAudience,
            displayType,
            targetRoutes,
            frequency,
            isActive
        });

        await newPopup.save();
        res.status(201).json({ message: 'Popup created successfully', popup: newPopup });
    } catch (error) {
        console.error('Error creating popup:', error);
        res.status(500).json({ message: 'Error creating popup', error: error.message });
    }
};

// Get all popups (Admin only)
exports.getAllPopups = async (req, res) => {
    try {
        const popups = await Popup.find().sort({ createdAt: -1 });
        res.status(200).json(popups);
    } catch (error) {
        console.error('Error fetching popups:', error);
        res.status(500).json({ message: 'Error fetching popups', error: error.message });
    }
};

// Update a popup (Admin only)
exports.updatePopup = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPopup = await Popup.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        
        if (!updatedPopup) {
            return res.status(404).json({ message: 'Popup not found' });
        }
        
        res.status(200).json({ message: 'Popup updated successfully', popup: updatedPopup });
    } catch (error) {
        console.error('Error updating popup:', error);
        res.status(500).json({ message: 'Error updating popup', error: error.message });
    }
};

// Delete a popup (Admin only)
exports.deletePopup = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPopup = await Popup.findByIdAndDelete(id);
        
        if (!deletedPopup) {
            return res.status(404).json({ message: 'Popup not found' });
        }
        
        res.status(200).json({ message: 'Popup deleted successfully' });
    } catch (error) {
        console.error('Error deleting popup:', error);
        res.status(500).json({ message: 'Error deleting popup', error: error.message });
    }
};

// Get active popups (Public/Authenticated)
exports.getActivePopups = async (req, res) => {
    try {
        const { role, path } = req.query; // role can be 'customer', 'vendor', or '' (guest)
        
        // Find active popups
        const popups = await Popup.find({ isActive: true });
        
        // Filter based on audience and path
        const matchingPopups = popups.filter(popup => {
            // Audience check
            const roleMatches = popup.targetAudience === 'all' || popup.targetAudience === role;
            if (!roleMatches) return false;
            
            // Route check
            if (popup.displayType === 'global') return true;
            
            if (popup.displayType === 'specific_route' && path) {
                // simple exact match or prefix match (e.g., if targetRoute is '/vendor', it matches '/vendor/my-pricing')
                // For exact path matching, we can use simple includes
                return popup.targetRoutes.some(target => path.startsWith(target));
            }
            return false;
        });

        res.status(200).json(matchingPopups);
    } catch (error) {
        console.error('Error fetching active popups:', error);
        res.status(500).json({ message: 'Error fetching active popups', error: error.message });
    }
};
