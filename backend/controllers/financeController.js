const FinanceApplication = require('../models/FinanceApplication');

// @desc    Submit a new Finance Application
// @route   POST /api/finance
// @access  Vendor
exports.submitApplication = async (req, res) => {
    try {
        const { director1, personalDetails, director2, businessDetails } = req.body;
        
        // User can submit multiple applications, so we don't block them.

        const app = await FinanceApplication.create({
            vendor: req.user.id,
            director1,
            personalDetails,
            director2,
            businessDetails
        });

        res.status(201).json({ message: 'Finance application submitted successfully!', app });
    } catch (error) {
        console.error('Error submitting finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Vendor's own Finance Application
// @route   GET /api/finance/my
// @access  Vendor
exports.getMyApplications = async (req, res) => {
    try {
        const apps = await FinanceApplication.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        console.error('Error fetching my finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Finance Applications
// @route   GET /api/admin/finance
// @access  Admin
exports.getAllApplications = async (req, res) => {
    try {
        const apps = await FinanceApplication.find()
            .populate('vendor', 'name email company phone')
            .sort({ createdAt: -1 });
        res.status(200).json(apps);
    } catch (error) {
        console.error('Error fetching all finance apps:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Finance Application Status (Admin)
// @route   PUT /api/admin/finance/:id/status
// @access  Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { adminStatus, approvedAmount, processingFees, rejectionReason, termsAndConditions } = req.body;
        
        const app = await FinanceApplication.findById(req.params.id);
        if (!app) {
            return res.status(404).json({ message: 'Application not found' });
        }

        app.adminStatus = adminStatus || app.adminStatus;
        app.approvedAmount = approvedAmount !== undefined ? approvedAmount : app.approvedAmount;
        app.processingFees = processingFees !== undefined ? processingFees : app.processingFees;
        app.rejectionReason = rejectionReason !== undefined ? rejectionReason : app.rejectionReason;
        app.termsAndConditions = termsAndConditions !== undefined ? termsAndConditions : app.termsAndConditions;

        await app.save();

        res.status(200).json({ message: 'Application updated successfully', app });
    } catch (error) {
        console.error('Error updating finance app:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
