const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, verifyOTP, resendOTP, forgotPassword, resetPassword, updateUserProfile, deleteUserAccount, submitPreApprovedDoc, getMyActivityHistory } = require('../controllers/authController');
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
router.post('/pre-approved-submit', protect, submitPreApprovedDoc);
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

// Global User Lookup by Phone (for Customer) or LS ID (for Vendor)
router.get('/lookup', protect, async (req, res) => {
    try {
        const { type, phone, lsid } = req.query;
        if (type === 'customer') {
            if (!phone) {
                return res.status(400).json({ message: 'Phone number is required' });
            }
            const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
            // Find customer globally using regex on last 10 digits
            const customer = await User.findOne({ 
                role: 'customer', 
                phone: { $regex: cleanPhone + '$' } 
            }).select('name company email phone');
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            return res.json(customer);
        } else if (type === 'vendor') {
            if (!lsid) {
                return res.status(400).json({ message: 'LS ID is required' });
            }
            const cleanLsid = lsid.replace(/[^0-9]/g, '');
            // Helper to generate deterministic LSID
            const getLSID = (id) => {
                let hash = 0;
                const str = id.toString();
                for (let i = 0; i < str.length; i++) {
                    hash = (hash * 31 + str.charCodeAt(i)) % 900000;
                }
                return 1000000000 + Math.abs(hash);
            };

            const vendors = await User.find({ role: 'vendor' }).select('name company email phone');
            const targetVendor = vendors.find(v => {
                const computed = getLSID(v._id).toString();
                return computed === cleanLsid || `ls-${computed}` === lsid.toLowerCase().trim() || v._id.toString() === lsid.trim();
            });

            if (!targetVendor) {
                return res.status(404).json({ message: 'Vendor not found' });
            }
            return res.json({
                _id: targetVendor._id,
                name: targetVendor.name,
                company: targetVendor.company,
                email: targetVendor.email,
                phone: targetVendor.phone,
                lsid: getLSID(targetVendor._id)
            });
        } else {
            return res.status(400).json({ message: 'Invalid lookup type' });
        }
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

// Public route for file upload (e.g., guest users attaching documents to enquiries)
router.post('/upload-public', (req, res, next) => {
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

// Public route to get all distinct countries and cities of existing vendors
router.get('/public-vendors-locations', async (req, res) => {
    try {
        const vendors = await User.find({ role: 'vendor' }, 'country city').lean();
        
        const locations = {};
        vendors.forEach(v => {
            if (v.country) {
                const c = v.country;
                if (!locations[c]) locations[c] = new Set();
                if (v.city) {
                    locations[c].add(v.city);
                }
            }
        });
        
        const formattedLocations = {};
        Object.keys(locations).sort().forEach(country => {
            formattedLocations[country] = Array.from(locations[country]).sort();
        });
        
        res.json(formattedLocations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

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

        const mongoose = require('mongoose');
        let targetVendor;

        if (mongoose.Types.ObjectId.isValid(vendorId)) {
            targetVendor = await User.findById(vendorId).select('-password').populate('activePlan').populate('parentCompany', 'company gst pan');
        }

        if (!targetVendor) {
            // First try a loose regex search
            const searchName = vendorId.replace(/-/g, '.*');
            const potentialVendors = await User.find({ 
                role: 'vendor', 
                $or: [
                    { company: { $regex: new RegExp(`^\\s*${searchName}.*`, 'i') } },
                    { name: { $regex: new RegExp(`^\\s*${searchName}.*`, 'i') } }
                ]
            }).select('-password').populate('activePlan').populate('parentCompany', 'company gst pan');

            // Then exact match the slug in JS to avoid collisions/whitespace issues
            for (let v of potentialVendors) {
                const generatedSlug = (v.company || v.name || 'vendor').trim().replace(/[\s\W-]+/g, '-').toLowerCase();
                // Sometimes trailing dashes exist in frontend slug, handle it
                if (generatedSlug === vendorId || generatedSlug.replace(/-+$/, '') === vendorId.replace(/-+$/, '')) {
                    targetVendor = v;
                    break;
                }
            }
            
            // Fallback if none perfectly matched the slug (e.g. extremely weird chars)
            if (!targetVendor && potentialVendors.length > 0) {
                targetVendor = potentialVendors[0];
            }
        }

        if (!targetVendor) {
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

        // Calculate Complaints Stats
        const Complaint = require('../models/Complaint');
        
        // Against Me
        const complaintsAgainst = await Complaint.find({ vendor: targetVendor._id });
        const againstStats = {
            total: complaintsAgainst.length,
            resolved: complaintsAgainst.filter(c => c.status === 'Resolved').length,
            pending: complaintsAgainst.filter(c => c.status === 'Pending').length
        };

        // Raised By Me
        const complaintsRaised = await Complaint.find({ client: targetVendor._id });
        const raisedStats = {
            total: complaintsRaised.length,
            resolved: complaintsRaised.filter(c => c.status === 'Resolved').length,
            pending: complaintsRaised.filter(c => c.status === 'Pending').length
        };

        const vendorData = {
            ...targetVendor.toObject(),
            lsid: getLSID(targetVendor._id),
            organizationName: targetVendor.company || targetVendor.name || 'N/A',
            isVerified,
            complaintsAgainst: againstStats,
            complaintsRaised: raisedStats
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

        // Direct traffic (e.g. QR code scan) bypasses the lock
        if (isApprovedUser || req.query.directVisit === 'true') {
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
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'vendor') {
            return res.status(403).json({ message: 'Access denied. Vendor role required.' });
        }
        
        const contacts = await VendorContact.find({ vendorId: user._id })
            .sort({ createdAt: -1 });
            
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
