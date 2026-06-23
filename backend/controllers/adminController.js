const Admin = require('../models/Admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    // Hardcoded check for admin@2026 (password is optional now)
    if (email === 'admin@biryaniyoyo.com' && (password === 'admin@2026' || !password)) {
        // Create a dummy ID for the token since we are bypassing DB for now
        // OR find the actual admin in DB if exists. 
        // For simplicity requested by user:
        const token = jwt.sign({ id: 'ad0000000000000000000000' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return res.json({
            _id: 'ad0000000000000000000000',
            name: 'Master Admin',
            email: email,
            token: token,
        });
    }

    res.status(401).json({ message: 'Invalid email' });
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private
exports.getVendors = async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('-password').populate('assignedRM').sort({ createdAt: -1 });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private
exports.getCustomers = async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' }).select('-password').sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all unique guests from enquiries
// @route   GET /api/admin/guests
// @access  Private
exports.getGuests = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        // Find enquiries where client is not set but guestEmail/guestName is provided
        const enquiries = await Enquiry.find({ 
            client: null, 
            guestEmail: { $ne: '' } 
        }).sort({ createdAt: -1 });

        const uniqueGuestsMap = {};
        enquiries.forEach(e => {
            if (e.guestEmail && !uniqueGuestsMap[e.guestEmail]) {
                uniqueGuestsMap[e.guestEmail] = {
                    name: e.guestName,
                    email: e.guestEmail,
                    phone: e.guestPhone,
                    company: e.guestCompany,
                    createdAt: e.createdAt
                };
            }
        });
        
        res.json(Object.values(uniqueGuestsMap));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get history of enquiries & bookings for a customer
// @route   GET /api/admin/customer-history/:id
// @access  Private
exports.getCustomerHistory = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const history = await Enquiry.find({ client: req.params.id })
            .populate('vendor', 'name company email')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get history of enquiries & bookings for a guest by email or phone
// @route   GET /api/admin/guest-history
// @access  Private
exports.getGuestHistory = async (req, res) => {
    try {
        const { email, phone } = req.query;
        const Enquiry = require('../models/Enquiry');
        let query = { client: null };
        if (email) {
            query.guestEmail = email;
        } else if (phone) {
            query.guestPhone = phone;
        } else {
            return res.status(400).json({ message: 'Email or phone parameter is required' });
        }

        const history = await Enquiry.find(query)
            .populate('vendor', 'name company email')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Impersonate vendor / Get login token for vendor
// @route   GET /api/admin/impersonate/:vendorId
// @access  Private
exports.impersonateVendor = async (req, res) => {
    try {
        const vendor = await User.findById(req.params.vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        
        // Generate userToken for this vendor
        const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: vendor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Toggle vendor verification status
// @route   PUT /api/admin/vendors/:id/verify
// @access  Private
exports.toggleVendorVerification = async (req, res) => {
    try {
        const { status } = req.body;
        if (status && !['Pending', 'Approved', 'Declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const vendor = await User.findById(req.params.id);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        if (status) {
            vendor.verificationStatus = status;
            vendor.isVerified = (status === 'Approved');
        } else {
            // fallback toggle logic
            vendor.isVerified = !vendor.isVerified;
            vendor.verificationStatus = vendor.isVerified ? 'Approved' : 'Declined';
        }

        if (vendor.isVerified && !vendor.approvedAt) {
            vendor.approvedAt = new Date();
        }

        await vendor.save();

        // Send email notification to vendor about the status change
        const { sendVendorStatusUpdateEmail } = require('../services/notificationService');
        await sendVendorStatusUpdateEmail(vendor.email, vendor.name, vendor.isVerified);

        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin pricing management controllers
// @desc    Get pricing for a specific vendor
// @route   GET /api/admin/pricing/:vendorId
// @access  Private
exports.adminGetVendorPricing = async (req, res) => {
    try {
        const Pricing = require('../models/Pricing');
        const pricing = await Pricing.find({ vendor: req.params.vendorId }).sort({ createdAt: -1 });
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add pricing for a specific vendor
// @route   POST /api/admin/pricing
// @access  Private
exports.adminAddPricing = async (req, res) => {
    try {
        const Pricing = require('../models/Pricing');
        const {
            vendorId,
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

        if (!vendorId) {
            return res.status(400).json({ message: 'vendorId is required' });
        }

        const pricing = await Pricing.create({
            vendor: vendorId,
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

// @desc    Toggle pricing status
// @route   PUT /api/admin/pricing/:id/toggle
// @access  Private
exports.adminTogglePricingStatus = async (req, res) => {
    try {
        const Pricing = require('../models/Pricing');
        const pricing = await Pricing.findById(req.params.id);
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found' });
        }
        pricing.status = pricing.status === 'active' ? 'disabled' : 'active';
        await pricing.save();
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete pricing entry
// @route   DELETE /api/admin/pricing/:id
// @access  Private
exports.adminDeletePricing = async (req, res) => {
    try {
        const Pricing = require('../models/Pricing');
        const pricing = await Pricing.findByIdAndDelete(req.params.id);
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found' });
        }
        res.json({ message: 'Pricing entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update pricing entry
// @route   PUT /api/admin/pricing/:id
// @access  Private
exports.adminUpdatePricing = async (req, res) => {
    try {
        const Pricing = require('../models/Pricing');
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

        const pricing = await Pricing.findById(req.params.id);
        if (!pricing) {
            return res.status(404).json({ message: 'Pricing entry not found' });
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

// Via Pricing controllers
// @desc    Get all via pricing entries
// @route   GET /api/admin/via-pricing
// @access  Private
exports.getViaPricing = async (req, res) => {
    try {
        const ViaPricing = require('../models/ViaPricing');
        const list = await ViaPricing.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add a via pricing entry
// @route   POST /api/admin/via-pricing
// @access  Private
exports.addViaPricing = async (req, res) => {
    try {
        const ViaPricing = require('../models/ViaPricing');
        const { toLocation, via, ihcPrice, standard20 } = req.body;
        
        if (!toLocation || !via || ihcPrice === undefined || standard20 === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const item = await ViaPricing.create({
            toLocation,
            via,
            ihcPrice: Number(ihcPrice),
            standard20: Number(standard20)
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a via pricing entry
// @route   DELETE /api/admin/via-pricing/:id
// @access  Private
exports.deleteViaPricing = async (req, res) => {
    try {
        const ViaPricing = require('../models/ViaPricing');
        const item = await ViaPricing.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get dashboard stats for admin
// @route   GET /api/admin/dashboard-stats
// @access  Private
exports.getAdminDashboardStats = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const Complaint = require('../models/Complaint');
        const FinanceApplication = require('../models/FinanceApplication');
        
        // Parallel queries for speed
        const [
            totalCustomers,
            totalVendors,
            pendingVendors,
            totalEnquiries,
            acceptedEnquiries,
            rejectedEnquiries,
            totalFinanceApps,
            pendingFinanceApps,
            totalComplaints,
            openComplaints,
            recentVendors,
            recentBookings,
            guestEmails,
            recentAllEnquiries
        ] = await Promise.all([
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'vendor' }),
            User.countDocuments({ role: 'vendor', verificationStatus: { $ne: 'Approved' } }),
            Enquiry.countDocuments(),
            Enquiry.countDocuments({ status: 'Accepted' }),
            Enquiry.countDocuments({ status: 'Declined' }),
            FinanceApplication.countDocuments(),
            FinanceApplication.countDocuments({ adminStatus: 'Pending' }),
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'Pending' }),
            User.find({ role: 'vendor' }).sort({ createdAt: -1 }).limit(5).select('name email company isVerified verificationStatus createdAt'),
            Enquiry.find({ status: 'Accepted' }).sort({ createdAt: -1 }).limit(5).populate('client', 'name email').populate('vendor', 'name company'),
            Enquiry.distinct('guestEmail', { client: null, guestEmail: { $ne: '' } }),
            Enquiry.find().sort({ createdAt: -1 }).limit(8).populate('client', 'name email').populate('vendor', 'name company')
        ]);

        res.json({
            users: {
                customers: totalCustomers,
                vendors: totalVendors,
                pendingVendors: pendingVendors,
                guests: guestEmails.length
            },
            enquiries: {
                total: totalEnquiries,
                accepted: acceptedEnquiries,
                rejected: rejectedEnquiries
            },
            finance: {
                total: totalFinanceApps,
                pending: pendingFinanceApps
            },
            complaints: {
                total: totalComplaints,
                open: openComplaints
            },
            recentActivity: {
                vendors: recentVendors,
                bookings: recentBookings,
                enquiries: recentAllEnquiries
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
