const Activity = require('../models/Activity');

const logActivity = async (actionType, req, vendorId, details = {}) => {
    try {
        if (!req.user) return; // Cannot log without user
        
        const performerModel = req.user.role === 'RM' ? 'RM' : 'Admin';
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
