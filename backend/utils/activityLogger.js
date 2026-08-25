const Activity = require('../models/Activity');

const logActivity = async (actionType, req, vendorId, details = {}) => {
    try {
        if (!req.user) return; // Cannot log without user
        
        let performerModel = 'Admin';
        if (req.user.role === 'RM') performerModel = 'RM';
        else if (req.user.role === 'vendor' || req.user.role === 'customer') performerModel = 'User';

        const performedBy = req.user.id;

        const activity = new Activity({
            actionType,
            performedBy,
            performerModel,
            vendorId,
            details
        });

        await activity.save();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

module.exports = logActivity;
