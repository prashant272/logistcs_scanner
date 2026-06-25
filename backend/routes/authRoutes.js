const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, verifyOTP, resendOTP, forgotPassword, resetPassword, updateUserProfile, deleteUserAccount } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const { uploadDoc } = require('../services/uploadService');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserAccount);

const User = require('../models/User');
// Route to get all vendors for logged in users
router.get('/vendors', protect, async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }).select('name company email phone').sort({ company: 1, name: 1 });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route to get all customers for logged in users
router.get('/customers', protect, async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' }).select('name company email phone').sort({ company: 1, name: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route for file upload (images and documents to Cloudflare R2 / AWS S3)
router.post('/upload', protect, (req, res, next) => {
    uploadDoc.single('file')(req, res, (err) => {
        if (err) {
            console.error("Upload error details:", err);
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
    res.json({ url: publicUrl });
});

const GuestView = require('../models/GuestView');
const jwt = require('jsonwebtoken');

// Public route to search vendors
router.get('/public-vendors-search', async (req, res) => {
    try {
        const { lsid, country, city } = req.query;
        let query = { role: 'vendor' };
        
        if (country) {
            query.country = new RegExp('^' + country + '$', 'i');
        }
        if (city) {
            query.city = new RegExp('^' + city + '$', 'i');
        }

        const vendors = await User.find(query)
            .select('_id company name city country verificationStatus activePlan')
            .populate('activePlan')
            .lean();

        // Helper to generate deterministic LSID
        const getLSID = (id) => {
            let hash = 0;
            const str = id.toString();
            for (let i = 0; i < str.length; i++) {
                hash = (hash * 31 + str.charCodeAt(i)) % 900000;
            }
            return 1000000000 + Math.abs(hash);
        };

        let results = vendors.map(v => ({
            ...v,
            lsid: getLSID(v._id),
            organizationName: v.company || v.name || 'N/A',
            isVerified: v.activePlan && v.activePlan.price > 0
        }));

        if (lsid) {
            const cleanLsid = lsid.replace(/[^0-9]/g, '');
            results = results.filter(v => 
                v.lsid.toString().includes(cleanLsid) || 
                v._id.toString().includes(lsid)
            );
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Endpoint to view specific vendor details with gating
router.get('/public-vendors-search/:id/details', async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { fingerprint } = req.query;

        // Find the requested vendor
        const targetVendor = await User.findById(vendorId).select('-password').populate('activePlan');
        if (!targetVendor || targetVendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Helper to generate deterministic LSID
        const getLSID = (id) => {
            let hash = 0;
            const str = id.toString();
            for (let i = 0; i < str.length; i++) {
                hash = (hash * 31 + str.charCodeAt(i)) % 900000;
            }
            return 1000000000 + Math.abs(hash);
        };

        const isVerified = targetVendor.activePlan && targetVendor.activePlan.price > 0;

        const vendorData = {
            ...targetVendor.toObject(),
            lsid: getLSID(targetVendor._id),
            organizationName: targetVendor.company || targetVendor.name || 'N/A',
            isVerified
        };

        // 1. Check if user is logged in and approved
        let isApprovedUser = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const currentUser = await User.findById(decoded.id);
                if (currentUser) {
                    // Admin, Customer, or Approved Vendor are bypasses
                    if (currentUser.role === 'customer' || currentUser.role === 'admin' || currentUser.verificationStatus === 'Approved') {
                        isApprovedUser = true;
                    }
                }
            } catch (err) {
                // Token invalid/expired - treat as guest
            }
        }

        if (isApprovedUser) {
            return res.json(vendorData);
        }

        // 2. Gating logic for Guest/Unapproved user using IP + Fingerprint
        if (!fingerprint) {
            return res.status(400).json({ message: 'Device fingerprint is required' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

        // Check if there is a GuestView record for either this fingerprint OR IP
        let guestRecord = await GuestView.findOne({
            $or: [
                { fingerprint: fingerprint },
                { ipAddress: ip }
            ]
        });

        if (!guestRecord) {
            // First time view
            guestRecord = new GuestView({
                ipAddress: ip,
                fingerprint: fingerprint,
                viewedVendors: [vendorId]
            });
            await guestRecord.save();
            return res.json(vendorData);
        }

        // Check if they are trying to view a vendor they've already viewed
        const hasViewedThis = guestRecord.viewedVendors.some(id => id.toString() === vendorId);
        if (hasViewedThis) {
            return res.json(vendorData);
        }

        // If they have already viewed a vendor, block them
        if (guestRecord.viewedVendors.length >= 1) {
            return res.status(403).json({
                message: 'You have exceeded the limit of 1 vendor view. Please register and get approved to view more vendor details.',
                restricted: true
            });
        }

        // If for some reason they have viewed 0, let them view
        guestRecord.viewedVendors.push(vendorId);
        await guestRecord.save();
        return res.json(vendorData);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const VendorContact = require('../models/VendorContact');

// Route to submit a contact request to a vendor (public)
router.post('/vendor-contact', async (req, res) => {
    try {
        const { vendorId, name, email, message } = req.body;
        if (!vendorId || !name || !email || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if vendor exists
        const vendor = await User.findById(vendorId);
        if (!vendor || vendor.role !== 'vendor') {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const newContact = new VendorContact({
            vendorId,
            name,
            email,
            message
        });

        await newContact.save();
        res.status(201).json({ message: 'Contact request submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route to get contact requests for logged in vendor (protected)
router.get('/vendor-contact/my', protect, async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ message: 'Access denied. Vendor role required.' });
        }
        
        const contacts = await VendorContact.find({ vendorId: req.user._id })
            .sort({ createdAt: -1 });
            
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
