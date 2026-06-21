const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/authMiddleware');

// File a new complaint
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { subject, message, vendor, priority, screenshot } = req.body;
        if (!subject || !message || !vendor) {
            return res.status(400).json({ message: 'Subject, message, and vendor are required' });
        }

        // Generate serial complaintId (CMP-XXXXX)
        const count = await Complaint.countDocuments();
        const complaintId = `CMP-${String(count + 1).padStart(5, '0')}`;

        const complaint = await Complaint.create({
            complaintId,
            client: req.user.id,
            vendor,
            subject,
            message,
            priority: priority || 'Medium',
            screenshot: screenshot || '',
            status: 'Pending'
        });
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's complaints (raised or against them)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const isAdmin = req.user.id === 'ad0000000000000000000000';
        const { type } = req.query;
        let query = {};

        if (!isAdmin) {
            if (type === 'against') {
                query = { vendor: req.user.id };
            } else {
                query = { client: req.user.id };
            }
        } else {
            if (type === 'against') {
                query = { vendor: { $exists: true, $ne: null } };
            } else {
                query = { client: { $exists: true, $ne: null } };
            }
        }

        const complaints = await Complaint.find(query)
            .populate('client', 'name company email phone role')
            .populate('vendor', 'name company email phone role')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Get all complaints
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        // Simple admin authorization check
        if (req.user.id !== 'ad0000000000000000000000') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }

        const complaints = await Complaint.find({})
            .populate('client', 'name company email phone role')
            .populate('vendor', 'name company email phone role')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Admin: Update complaint status
router.put('/admin/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== 'ad0000000000000000000000') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }

        const { status } = req.body;
        if (!status || !['Pending', 'Rejected', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = status;
        await complaint.save();

        const populatedComplaint = await Complaint.findById(complaint._id)
            .populate('client', 'name company email phone role')
            .populate('vendor', 'name company email phone role');

        res.json(populatedComplaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
