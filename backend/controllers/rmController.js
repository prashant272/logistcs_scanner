const RM = require('../models/RM');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logActivity = require('../utils/activityLogger');

// @desc    Create a new Relationship Manager
// @route   POST /api/rm
// @access  Admin
exports.createRM = async (req, res) => {
    try {
        const { name, email, mobile, password, permissions } = req.body;

        if (!name || !email || !mobile || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const rmExists = await RM.findOne({ email });
        if (rmExists) {
            return res.status(400).json({ message: 'RM with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const rm = await RM.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            permissions: permissions || []
        });

        res.status(201).json(rm);
    } catch (error) {
        console.error('Error creating RM:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all RMs
// @route   GET /api/rm
// @access  Admin
exports.getRMs = async (req, res) => {
    try {
        const rms = await RM.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(rms);
    } catch (error) {
        console.error('Error fetching RMs:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update RM
// @route   PUT /api/rm/:id
// @access  Admin
exports.updateRM = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;
        const rm = await RM.findById(req.params.id);

        if (!rm) {
            return res.status(404).json({ message: 'RM not found' });
        }

        rm.name = name || rm.name;
        rm.email = email || rm.email;
        rm.mobile = mobile || rm.mobile;
        
        if (req.body.permissions) {
            rm.permissions = req.body.permissions;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            rm.password = await bcrypt.hash(password, salt);
        }

        const updatedRM = await rm.save();
        res.status(200).json(updatedRM);
    } catch (error) {
        console.error('Error updating RM:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete RM
// @route   DELETE /api/rm/:id
// @access  Admin
exports.deleteRM = async (req, res) => {
    try {
        const rm = await RM.findById(req.params.id);
        if (!rm) {
            return res.status(404).json({ message: 'RM not found' });
        }
        await rm.deleteOne();
        
        // Remove assignment from all vendors
        await User.updateMany({ assignedRM: req.params.id }, { assignedRM: null });

        res.status(200).json({ message: 'RM removed' });
    } catch (error) {
        console.error('Error deleting RM:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign RM to Vendor
// @route   PUT /api/rm/assign
// @access  Admin
exports.assignRM = async (req, res) => {
    try {
        const { vendorId, rmId } = req.body;

        if (!vendorId) {
            return res.status(400).json({ message: 'Vendor ID is required' });
        }

        const vendor = await User.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // rmId can be null to unassign
        if (rmId) {
            const rm = await RM.findById(rmId);
            if (!rm) {
                return res.status(404).json({ message: 'RM not found' });
            }
        }

        vendor.assignedRM = rmId || null;
        await vendor.save();

        await logActivity('ASSIGN_RM', req, vendorId, { rmId });

        res.status(200).json({ message: 'RM assigned successfully', vendor });
    } catch (error) {
        console.error('Error assigning RM:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    RM Login
// @route   POST /api/rm/login
// @access  Public
const jwt = require('jsonwebtoken');

exports.loginRM = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const rm = await RM.findOne({ email });
        if (!rm) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, rm.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: rm._id, role: 'RM' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            _id: rm._id,
            name: rm.name,
            email: rm.email,
            role: 'RM',
            permissions: rm.permissions,
            token
        });
    } catch (error) {
        console.error('Error in RM login:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Activity Logs
// @route   GET /api/rm/activity
// @access  Admin
const Activity = require('../models/Activity');

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await Activity.find()
            .populate('performedBy', 'name email role')
            .populate('vendorId', 'name company email')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
