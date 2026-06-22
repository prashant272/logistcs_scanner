const ContactMessage = require('../models/ContactMessage');

// @desc    Submit a new contact message
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res) => {
    try {
        const { userType, topic, name, organization, email, message } = req.body;

        if (!topic || !name || !organization || !email) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const newContact = await ContactMessage.create({
            userType,
            topic,
            name,
            organization,
            email,
            message
        });

        res.status(201).json({ message: 'Your message has been sent successfully', contact: newContact });
    } catch (error) {
        console.error('Error submitting contact message:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all contact messages for admin
// @route   GET /api/contact/admin/messages
// @access  Private (Admin)
exports.getContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update contact message status
// @route   PUT /api/contact/admin/:id/status
// @access  Private (Admin)
exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const message = await ContactMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (status && ['Pending', 'Resolved', 'Dismissed'].includes(status)) {
            message.status = status;
        } else {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        await message.save();
        res.status(200).json(message);
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
