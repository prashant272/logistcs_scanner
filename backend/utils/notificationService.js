const Notification = require('../models/Notification');
const { getIo, getUserSocket } = require('./socketSetup');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an in-app notification to a specific user and save to DB
 */
const sendNotification = async (userId, message, type = 'info', link = null) => {
    try {
        // Save to DB
        const notification = await Notification.create({
            userId,
            message,
            type,
            link
        });

        // Emit via socket if user is connected
        const socketId = getUserSocket(userId);
        const io = getIo();
        if (socketId && io) {
            io.to(socketId).emit('newNotification', notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

/**
 * Send an in-app notification to ALL admin users
 */
const sendAdminNotification = async (message, type = 'info', link = null) => {
    try {
        // Find all admin users
        const admins = await User.find({ role: 'admin' });
        
        const notifications = admins.map(admin => ({
            userId: admin._id,
            message,
            type,
            link
        }));

        // Insert into DB
        const savedNotifications = await Notification.insertMany(notifications);

        // Emit to adminRoom
        const io = getIo();
        if (io) {
            // Emitting to the room sends it to all connected sockets in that room
            // We can send the raw object to the room
            io.to('adminRoom').emit('newNotification', { message, type, link, isRead: false, createdAt: new Date() });
        }
        
        return savedNotifications;
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
};

/**
 * Send an email
 */
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
            return;
        }

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendNotification,
    sendAdminNotification,
    sendEmail
};
