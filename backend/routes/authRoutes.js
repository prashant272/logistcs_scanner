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

const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

const getSimilarity = (s1, s2) => {
    let longer = s1.toLowerCase();
    let shorter = s2.toLowerCase();
    if (s1.length < s2.length) { longer = s2.toLowerCase(); shorter = s1.toLowerCase(); }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - levenshtein(longer, shorter)) / parseFloat(longerLength);
};

const toTitleCase = (s) => {
    if (!s) return '';
    return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const getStandardizedMaps = (vendors) => {
    const countryFreq = {};
    const cityFreq = {};
    
    vendors.forEach(v => {
        if (v.country) {
            const c = v.country.trim().toLowerCase();
            countryFreq[c] = (countryFreq[c] || 0) + 1;
        }
        if (v.city) {
            const ct = v.city.trim().toLowerCase();
            cityFreq[ct] = (cityFreq[ct] || 0) + 1;
        }
    });

    const sortByFreq = (freqMap) => Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
    const sortedCountries = sortByFreq(countryFreq);
    const sortedCities = sortByFreq(cityFreq);

    const countryStandardMap = {};
    const cityStandardMap = {};

    const standardCountries = [];
    for (let c of sortedCountries) {
        let found = false;
        for (let std of standardCountries) {
            if (getSimilarity(c, std) >= 0.8) {
                countryStandardMap[c] = toTitleCase(std);
                found = true;
                break;
            }
        }
        if (!found) {
            standardCountries.push(c);
            countryStandardMap[c] = toTitleCase(c);
        }
    }

    const standardCities = [];
    for (let ct of sortedCities) {
        let found = false;
        // Explicit alias check before fuzzy logic
        if (ct === 'bengaluru' || ct === 'banglore') {
            cityStandardMap[ct] = 'Bangalore';
            continue;
        }
        for (let std of standardCities) {
            if (getSimilarity(ct, std) >= 0.8) {
                cityStandardMap[ct] = toTitleCase(std);
                found = true;
                break;
            }
        }
        if (!found) {
            standardCities.push(ct);
            cityStandardMap[ct] = toTitleCase(ct);
        }
    }

    // Hardcode overrides if they were skipped by similarity logic
    countryStandardMap['indiaa'] = 'India';

    return { countryStandardMap, cityStandardMap };
};

// Cache for standardized locations to prevent performance issues
let locationCache = {
    formattedLocations: null,
    maps: null,
    lastFetched: 0
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Public route to get all distinct countries and cities of existing vendors
router.get('/public-vendors-locations', async (req, res) => {
    try {
        if (Date.now() - locationCache.lastFetched < CACHE_TTL && locationCache.formattedLocations) {
            return res.json(locationCache.formattedLocations);
        }

        const vendors = await User.find({ role: 'vendor' }, 'country city').lean();
        const { countryStandardMap, cityStandardMap } = getStandardizedMaps(vendors);
        
        const locations = {};
        vendors.forEach(v => {
            if (v.country) {
                const c = countryStandardMap[v.country.trim().toLowerCase()] || toTitleCase(v.country.trim());
                if (!locations[c]) locations[c] = new Set();
                if (v.city) {
                    const ct = cityStandardMap[v.city.trim().toLowerCase()] || toTitleCase(v.city.trim());
                    locations[c].add(ct);
                }
            }
        });
        
        const formattedLocations = {};
        Object.keys(locations).sort().forEach(country => {
            formattedLocations[country] = Array.from(locations[country]).sort();
        });
        
        // Update cache
        locationCache = {
            formattedLocations,
            maps: { countryStandardMap, cityStandardMap },
            lastFetched: Date.now()
        };

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
        
        // Find all vendors first
        const allVendors = await User.find(query)
            .select('_id company name city country verificationStatus activePlan')
            .populate('activePlan')
            .lean();

        // Use cached maps if available and fresh, otherwise compute
        let currentMaps = locationCache.maps;
        if (!currentMaps || Date.now() - locationCache.lastFetched > CACHE_TTL) {
            currentMaps = getStandardizedMaps(allVendors);
            // We can silently update the cache here too
            locationCache.maps = currentMaps;
        }
        const { countryStandardMap, cityStandardMap } = currentMaps;

        // Helper to generate deterministic LSID
        const getLSID = (id) => {
            let hash = 0;
            const str = id.toString();
            for (let i = 0; i < str.length; i++) {
                hash = (hash * 31 + str.charCodeAt(i)) % 900000;
            }
            return 1000000000 + Math.abs(hash);
        };

        let results = allVendors.map(v => ({
            ...v,
            lsid: getLSID(v._id),
            organizationName: v.company || v.name || 'N/A',
            isVerified: v.activePlan && v.activePlan.price > 0
        }));

        // Apply fuzzy location filters in memory
        if (country) {
            results = results.filter(v => {
                if (!v.country) return false;
                const stdC = countryStandardMap[v.country.trim().toLowerCase()] || toTitleCase(v.country.trim());
                return stdC.toLowerCase() === country.toLowerCase();
            });
        }
        if (city) {
            results = results.filter(v => {
                if (!v.city) return false;
                const stdCt = cityStandardMap[v.city.trim().toLowerCase()] || toTitleCase(v.city.trim());
                return stdCt.toLowerCase() === city.toLowerCase();
            });
        }

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
