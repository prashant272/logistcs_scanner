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

module.exports = router;
