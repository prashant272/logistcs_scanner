const express = require('express');
const router = express.Router();
const upload = require('../utils/r2Upload');
const protect = require('../middleware/authMiddleware');

// @desc    Upload file to Cloudflare R2
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Construct the public URL if R2_PUBLIC_URL is provided
    let fileUrl = req.file.location;
    if (process.env.R2_PUBLIC_URL) {
        // req.file.key is what we set in multerS3: 'uploads/1234-5678.ext'
        fileUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
    }

    res.status(200).json({
        message: 'File uploaded successfully',
        url: fileUrl
    });
});

module.exports = router;
