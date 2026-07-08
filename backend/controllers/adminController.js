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

    // Hardcoded check for admin@2026
    if (email === 'admin@biryaniyoyo.com' && password === 'admin@2026') {
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusFilter = req.query.status || 'All Status';

        const query = { role: 'vendor' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        if (statusFilter !== 'All Status') {
            if (statusFilter === 'Approved') {
                query.$or = [{ verificationStatus: 'Approved' }, { isVerified: true, verificationStatus: { $nin: ['Approved', 'Declined', 'Pending', 'Pre Approved'] } }];
            } else if (statusFilter === 'Declined') {
                query.verificationStatus = 'Declined';
            } else if (statusFilter === 'Pending') {
                query.$or = [{ verificationStatus: 'Pending' }, { isVerified: false, verificationStatus: { $nin: ['Approved', 'Declined', 'Pending', 'Pre Approved'] } }];
            } else if (statusFilter === 'Pre Approved') {
                query.verificationStatus = 'Pre Approved';
            } else if (statusFilter === 'Login') {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);
                query.lastActive = { $gte: startOfDay, $lte: endOfDay };
                // Must have logged in (lastActive should be strictly greater than createdAt by at least 1 second)
                query.$expr = { $gt: [{ $subtract: ["$lastActive", "$createdAt"] }, 5000] };
            } else if (statusFilter === 'Premium Vendors') {
                const Plan = require('../models/Plan');
                // Find plans containing the word 'Premium'
                const premiumPlans = await Plan.find({ 
                    price: { $gt: 0 },
                    name: { $regex: /premium/i }
                }).select('_id');
                const premiumPlanIds = premiumPlans.map(p => p._id);
                query.activePlan = { $in: premiumPlanIds };
                query.planEndDate = { $gt: new Date() };
            } else if (statusFilter === 'Paid Vendors') {
                const Plan = require('../models/Plan');
                // Find plans NOT containing the word 'Premium' but with price > 0
                const otherPaidPlans = await Plan.find({ 
                    price: { $gt: 0 },
                    name: { $not: /premium/i }
                }).select('_id');
                const otherPaidPlanIds = otherPaidPlans.map(p => p._id);
                query.activePlan = { $in: otherPaidPlanIds };
                query.planEndDate = { $gt: new Date() };
            }
        }

        const sortQuery = statusFilter === 'Login' ? { lastActive: -1 } : { createdAt: -1 };

        const totalCount = await User.countDocuments(query);
        const vendors = await User.find(query)
            .select('-password')
            .populate('assignedRM')
            .populate('activePlan')
            .sort(sortQuery)
            .skip(skip)
            .limit(limit);

        res.json({
            data: vendors,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private
exports.getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const query = { role: 'customer' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } }
            ];
        }

        const totalCount = await User.countDocuments(query);
        const customers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            data: customers,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
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
        const PtlBooking = require('../models/PtlBooking');
        const User = require('../models/User');

        const customer = await User.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const enquiries = await Enquiry.find({ client: req.params.id })
            .populate('responses.vendor', 'name company')
            .sort({ createdAt: -1 });

        let history = [];

        enquiries.forEach(enq => {
            history.push({
                _id: enq._id,
                isBooking: false,
                fromLocation: enq.fromLocation || '',
                toLocation: enq.toLocation || '',
                type: enq.type || 'LTL',
                price: null,
                vendor: null,
                responses: enq.responses || [],
                status: (enq.responses && enq.responses.length > 0) ? 'Responded' : 'Pending',
                createdAt: enq.createdAt
            });
        });

        const bookings = await PtlBooking.find({ user: req.params.id })
            .populate('vendor', 'name company')
            .sort({ createdAt: -1 });

        bookings.forEach(booking => {
            history.push({
                _id: booking._id,
                isBooking: true,
                fromLocation: booking.pickup_details?.city || 'N/A',
                toLocation: booking.drop_details?.city || 'N/A',
                type: 'Booking',
                price: booking.booking_details?.total_amount || 0,
                vendor: booking.vendor,
                status: booking.status || 'Accepted',
                createdAt: booking.createdAt
            });
        });

        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(history);
    } catch (error) {
        console.error("Error in getCustomerHistory:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get history of enquiries accepted by a vendor
// @route   GET /api/admin/vendor-history/:id
// @access  Private
exports.getVendorHistory = async (req, res) => {
    try {
        const User = require('../models/User');
        const Enquiry = require('../models/Enquiry');
        
        const vendor = await User.findById(req.params.id).select('name company email lastActive createdAt');
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const enquiries = await Enquiry.find({
            'responses': { $elemMatch: { vendor: req.params.id, status: { $in: ['Accepted', 'Quoted'] } } }
        }).select('fromLocation toLocation type createdAt responses isDirect').sort({ createdAt: -1 });

        let history = [];
        enquiries.forEach(e => {
            const response = e.responses.find(r => r.vendor && r.vendor.toString() === req.params.id);
            if (response && ['Accepted', 'Quoted'].includes(response.status)) {
                history.push({
                    enquiryId: e._id,
                    fromLocation: e.fromLocation,
                    toLocation: e.toLocation,
                    type: e.type,
                    isDirect: e.isDirect,
                    enquiryCreated: e.createdAt,
                    acceptedAt: response.createdAt,
                    status: response.status
                });
            }
        });

        // Sort history by accepted date descending (newest first)
        history.sort((a, b) => b.acceptedAt - a.acceptedAt);

        res.json({
            vendor: vendor,
            history: history
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Unaccept an enquiry for a vendor (Admin action)
// @route   PUT /api/admin/vendor-history/:vendorId/unaccept/:enquiryId
// @access  Private
exports.adminUnacceptEnquiry = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const { vendorId, enquiryId } = req.params;

        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        // Find the response
        const responseIndex = enquiry.responses.findIndex(r => r.vendor && r.vendor.toString() === vendorId);
        if (responseIndex === -1) {
            return res.status(404).json({ message: 'Vendor response not found in this enquiry' });
        }

        // Remove the response completely to revert the acceptance
        enquiry.responses.splice(responseIndex, 1);

        // If direct enquiry, revert the whole enquiry status
        if (enquiry.isDirect && enquiry.vendor && enquiry.vendor.toString() === vendorId) {
            enquiry.status = 'Pending';
        }

        await enquiry.save();
        res.json({ message: 'Enquiry acceptance reverted successfully' });
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
        
        // Generate userToken for this vendor with impersonated flag
        const token = jwt.sign({ id: vendor._id, impersonated: true }, process.env.JWT_SECRET, { expiresIn: '30d' });
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
        if (status && !['Pending', 'Pre Approved', 'Approved', 'Declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const vendor = await User.findById(req.params.id);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        if (status) {
            vendor.verificationStatus = status;
            vendor.isVerified = (status === 'Approved');
            if (status === 'Pre Approved') {
                vendor.preApprovedAt = new Date();
                vendor.uploadedDocument = ''; // Clear old document so popup shows
            }
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
            shippingLine,
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
            shippingLine,
            weightRange,
            truckLoad,
            vehicleType,
            handlingType,
            additionalServices,
            deliverySpeed,
            validUntil,
            price: Number(price),
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
            shippingLine,
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
        pricing.shippingLine = shippingLine !== undefined ? shippingLine : pricing.shippingLine;
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


// @desc    Get dashboard stats for admin
// @route   GET /api/admin/dashboard-stats
// @access  Private
exports.getAdminDashboardStats = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const Complaint = require('../models/Complaint');
        const FinanceApplication = require('../models/FinanceApplication');
        const User = require('../models/User');
        
        let dateFilter = {};
        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
        }
        
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
            User.countDocuments({ role: 'customer', ...dateFilter }),
            User.countDocuments({ role: 'vendor', ...dateFilter }),
            User.countDocuments({ role: 'vendor', verificationStatus: { $ne: 'Approved' }, ...dateFilter }),
            Enquiry.countDocuments(dateFilter),
            Enquiry.countDocuments({ status: 'Accepted', ...dateFilter }),
            Enquiry.countDocuments({ status: 'Declined', ...dateFilter }),
            FinanceApplication.countDocuments(dateFilter),
            FinanceApplication.countDocuments({ adminStatus: 'Pending', ...dateFilter }),
            Complaint.countDocuments(dateFilter),
            Complaint.countDocuments({ status: 'Pending', ...dateFilter }),
            User.find({ role: 'vendor', ...dateFilter }).sort({ createdAt: -1 }).limit(5).select('name email company isVerified verificationStatus createdAt'),
            Enquiry.find({ status: 'Accepted', ...dateFilter }).sort({ createdAt: -1 }).limit(5).populate('client', 'name email').populate('vendor', 'name company'),
            Enquiry.distinct('guestEmail', { client: null, guestEmail: { $ne: '' }, ...dateFilter }),
            Enquiry.find(dateFilter).sort({ createdAt: -1 }).limit(8).populate('client', 'name email').populate('vendor', 'name company')
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

// Get all enquiries for Admin with pagination and search
exports.getEnquiries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { guestName: { $regex: search, $options: 'i' } },
                    { guestEmail: { $regex: search, $options: 'i' } },
                    { fromLocation: { $regex: search, $options: 'i' } },
                    { toLocation: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const skip = (page - 1) * limit;
        const Enquiry = require('../models/Enquiry');
        const enquiries = await Enquiry.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('client', 'name email company phone')
            .populate('vendor', 'name email company phone');
            
        const total = await Enquiry.countDocuments(query);

        res.json({
            enquiries,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update an enquiry (Admin)
exports.updateEnquiry = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }
        res.json({ message: 'Enquiry updated successfully', enquiry });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete an enquiry (Admin)
exports.deleteEnquiry = async (req, res) => {
    try {
        const Enquiry = require('../models/Enquiry');
        const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }
        res.json({ message: 'Enquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add User (Admin) - bypasses OTP
exports.adminAddUser = async (req, res) => {
    try {
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const { sendAdminCreatedUserEmail } = require('../services/notificationService');
        const { name, email, phone, role, company, address } = req.body;
        let { password } = req.body;

        if (!name || !email || !phone || !role) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        let generatedPassword = false;
        if (!password) {
            // Auto-generate an 8-character password
            password = Math.random().toString(36).slice(-8);
            generatedPassword = true;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            company: company || '',
            address: address || '',
            isVerified: role === 'vendor' ? false : true,
            verificationStatus: role === 'vendor' ? 'Pending' : undefined
        });

        // Send email with credentials
        try {
            await sendAdminCreatedUserEmail(email, name, password, role);
        } catch (emailError) {
            console.error('Failed to send admin-created user email', emailError);
            // We don't fail the registration if email fails, but we might want to log it
        }

        res.status(201).json({ message: 'User added successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update vendor enquiry limit manually (by admin)
exports.updateVendorEnquiryLimit = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { limit } = req.body;

        if (limit === undefined || isNaN(limit)) {
            return res.status(400).json({ message: 'Valid limit is required' });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        vendor.topupEnquiryLimit = Number(limit);
        
        // If admin updates the limit manually, we should ensure it doesn't instantly expire.
        // Sync it with the main plan's end date, or if they don't have one, just clear the topup expiry
        // so it's a permanent override until changed.
        if (vendor.planEndDate) {
            vendor.topupPlanEndDate = vendor.planEndDate;
        } else {
            vendor.topupPlanEndDate = null;
        }
        
        await vendor.save();

        res.json({ message: 'Vendor enquiry limit updated successfully', vendor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update vendor plan manually (by admin)
exports.updateVendorPlan = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { planId } = req.body;

        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (!planId) {
            // Revert to free plan
            vendor.activePlan = null;
            vendor.planEndDate = null;
        } else {
            const Plan = require('../models/Plan');
            const plan = await Plan.findById(planId);
            if (!plan) {
                return res.status(404).json({ message: 'Plan not found' });
            }

            vendor.activePlan = plan._id;
            
            // Set end date based on duration
            const endDate = new Date();
            if (plan.duration === 'Yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            vendor.planEndDate = endDate;
        }

        await vendor.save();

        const updatedVendor = await User.findById(vendorId).populate('activePlan').select('-password');
        res.json({ message: 'Vendor plan updated successfully', vendor: updatedVendor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update vendor details
// @route   PUT /api/admin/vendors/:id
// @access  Private (Admin)
exports.updateVendorDetails = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { company, email, phone, country } = req.body;

        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (company) vendor.company = company;
        if (email) vendor.email = email;
        if (phone) vendor.phone = phone;
        if (country) vendor.country = country;

        await vendor.save();

        const updatedVendor = await User.findById(vendorId).populate('activePlan').select('-password');
        res.json({ message: 'Vendor details updated successfully', vendor: updatedVendor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyVendorDocuments = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { gst, pan, isBranchOf, branchAddress } = req.body;

        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        if (!gst && !pan) {
            return res.status(400).json({ message: 'Please provide at least GST or PAN to verify documents.' });
        }

        // Strict Check: GST must ALWAYS be unique, even for a branch.
        if (gst) {
            const duplicateGst = await User.findOne({ _id: { $ne: vendorId }, role: 'vendor', gst });
            if (duplicateGst) {
                // If it's a branch creation attempt but they reused the exact same GST, reject it
                if (isBranchOf) {
                    return res.status(400).json({ message: `This exact GST is already in use by ${duplicateGst.company}. A branch must have a unique GST.` });
                } else {
                    return res.status(409).json({
                        message: `Duplicate GST detected`,
                        duplicateVendor: {
                            _id: duplicateGst._id,
                            company: duplicateGst.company,
                            email: duplicateGst.email,
                            phone: duplicateGst.phone,
                            gst: duplicateGst.gst,
                            pan: duplicateGst.pan
                        }
                    });
                }
            }
        }

        // PAN check: PAN can be duplicate ONLY if isBranchOf is provided
        if (pan && !isBranchOf) {
            const duplicatePan = await User.findOne({ _id: { $ne: vendorId }, role: 'vendor', pan });
            if (duplicatePan) {
                return res.status(409).json({
                    message: `Duplicate PAN detected`,
                    duplicateVendor: {
                        _id: duplicatePan._id,
                        company: duplicatePan.company,
                        email: duplicatePan.email,
                        phone: duplicatePan.phone,
                        gst: duplicatePan.gst,
                        pan: duplicatePan.pan
                    }
                });
            }
        }

        if (gst) vendor.gst = gst;
        if (pan) vendor.pan = pan;
        if (branchAddress) vendor.address = branchAddress;
        
        if (isBranchOf) {
            vendor.isBranch = true;
            vendor.parentCompany = isBranchOf;
        }

        vendor.isVerified = true;
        vendor.verificationStatus = 'Approved';
        
        if (!vendor.approvedAt) {
            vendor.approvedAt = new Date();
        }

        await vendor.save();
        
        const updatedVendor = await User.findById(vendorId).populate('activePlan').populate('parentCompany', 'company gst pan').select('-password');
        res.json({ message: 'Vendor verified successfully', vendor: updatedVendor });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
