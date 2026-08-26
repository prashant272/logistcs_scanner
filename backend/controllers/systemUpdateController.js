const SystemUpdate = require('../models/SystemUpdate');
const { broadcastVendorNotification } = require('../utils/notificationService');

// Admin: Create Update
exports.createSystemUpdate = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const newUpdate = await SystemUpdate.create({
            title,
            content,
            type: type || 'Announcement',
            createdBy: req.user.id
        });
        
        // Notify all vendors about the new update
        await broadcastVendorNotification(`New Update: ${title}`, 'info', '/vendor/updates');
        
        res.status(201).json(newUpdate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Get all Updates
exports.getSystemUpdates = async (req, res) => {
    try {
        const updates = await SystemUpdate.find().sort({ createdAt: -1 });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Update existing
exports.updateSystemUpdate = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const update = await SystemUpdate.findByIdAndUpdate(
            req.params.id,
            { title, content, type: type || 'Announcement' },
            { new: true }
        );
        if (!update) return res.status(404).json({ message: 'Update not found' });
        res.json(update);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Delete Update
exports.deleteSystemUpdate = async (req, res) => {
    try {
        const update = await SystemUpdate.findByIdAndDelete(req.params.id);
        if (!update) return res.status(404).json({ message: 'Update not found' });
        res.json({ message: 'Update deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Vendor: Get all Updates
exports.getVendorSystemUpdates = async (req, res) => {
    try {
        const updates = await SystemUpdate.find().sort({ createdAt: -1 });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
