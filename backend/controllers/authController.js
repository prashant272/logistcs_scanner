const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { handleSignupNotification, sendSMS, sendWhatsAppOTP, sendEmail, sendVendorWelcomeEmail, sendVendorRegistrationAdminAlert } = require('../services/notificationService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, role, company } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Update details for unverified user and send a new OTP
            userExists.name = name;
            userExists.password = hashedPassword;
            userExists.phone = phone;
            userExists.address = address;
            userExists.role = role || 'customer';
            userExists.company = company || '';
            userExists.otp = otp;
            userExists.otpExpires = otpExpires;
            await userExists.save();

            const notification = await handleSignupNotification({
                email,
                phone,
                country: address,
                otp,
                role: userExists.role
            });

            return res.status(200).json({
                message: 'Registration updated. Please verify the OTP sent to your email/mobile.',
                email: userExists.email,
                isVerified: false,
                notification
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address, // Contains country name
            role: role || 'customer',
            company: company || '',
            otp,
            otpExpires,
            isVerified: false
        });

        if (user) {
            // Trigger OTP dispatch (SMS if India, always Email)
            const notification = await handleSignupNotification({
                email,
                phone,
                country: address,
                otp,
                role: user.role
            });

            res.status(201).json({
                message: 'Registration successful. Please verify the OTP sent to your email/mobile.',
                email: user.email,
                isVerified: false,
                notification
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Please provide email and OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Allow '123456' as a developer master OTP for testing if notification service fails
        if (user.otp !== otp && otp !== '123456') {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }

        if (otp !== '123456' && user.otpExpires && user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Verify user
        user.isVerified = true;
        user.otp = '';
        user.otpExpires = null;
        await user.save();

        // Send Welcome SMS if from India
        const isIndia = (user.address && user.address.toLowerCase() === 'india') || (user.phone && user.phone.startsWith('+91'));
        if (isIndia) {
            const templateID = user.role === 'vendor' ? "1707175750032925464" : "1707175750054912723";
            await sendSMS({ mobile: user.phone, otp: '', templateID });
        }

        // Send Welcome Email based on role
        if (user.role === 'vendor') {
            await sendVendorWelcomeEmail(user.email, user.name);
            await sendVendorRegistrationAdminAlert({
                name: user.name,
                companyName: user.company,
                email: user.email,
                phone: user.phone
            });
        } else {
            const welcomeSubject = 'Welcome to The LogisticScanner!';
            const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <h2 style="color: #00b2fe;">Welcome, ${user.name}!</h2>
                    <p>Your account with The LogisticScanner has been verified and created successfully.</p>
                    <p>Happy Shipping, Seamless Delivery!</p>
                </div>
            `;
            await sendEmail({ to: user.email, subject: welcomeSubject, html: welcomeHtml });
        }

        res.status(200).json({
            message: 'Verification successful. You are now logged in.',
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            company: user.company,
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Trigger OTP dispatch
        const notification = await handleSignupNotification({
            email: user.email,
            phone: user.phone,
            country: user.address,
            otp,
            role: user.role
        });

        res.status(200).json({
            message: 'A new OTP has been sent.',
            notification
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Bypassing password verification for admin emails
        if (email && (email.toLowerCase() === 'admin@biryaniyoyo.com' || email.toLowerCase() === 'admin@logisticscanner.com')) {
            const token = jwt.sign({ id: 'ad0000000000000000000000' }, process.env.JWT_SECRET, { expiresIn: '30d' });
            return res.json({
                _id: 'ad0000000000000000000000',
                name: 'Master Admin',
                email: email,
                role: 'admin',
                token: token
            });
        }

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Check if user is verified
            if (!user.isVerified) {
                return res.status(400).json({ 
                    message: 'Your account is not verified. Please verify your OTP.',
                    isVerified: false,
                    email: user.email
                });
            }

            // Check if role is specified and matches
            if (role && user.role !== role) {
                return res.status(401).json({ message: 'You are not registered for this role' });
            }

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                company: user.company,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        if (req.user.id === 'ad0000000000000000000000') {
            return res.json({
                _id: 'ad0000000000000000000000',
                name: 'Admin Master',
                email: 'admin@logisticscanner.com',
                role: 'admin',
                isVerified: true,
                verificationStatus: 'Approved'
            });
        }
        const user = await User.findById(req.user.id).select('-password').populate('activePlan');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot Password - Generate & Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ message: 'Please provide email and phone number' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        // Clean phone numbers to compare digits
        const cleanUserPhone = user.phone.replace(/\D/g, '');
        const cleanInputPhone = phone.replace(/\D/g, '');
        if (cleanUserPhone !== cleanInputPhone && user.phone !== phone) {
            return res.status(400).json({ message: 'Phone number does not match our records' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send OTP via Email
        const emailSubject = 'Your OTP for LogisticsScanner Password Reset';
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                <h2 style="color: #00b2fe;">Password Reset Request</h2>
                <p>Your OTP for resetting your password is: <strong style="font-size: 18px; color: #00b2fe;">${otp}</strong></p>
                <p>Please enter this code on the website to reset your password. Valid for 10 minutes.</p>
            </div>
        `;
        const emailResult = await sendEmail({ to: email, subject: emailSubject, html: emailHtml });

        // Send OTP via SMS if in India
        const isIndia = (user.address && user.address.toLowerCase().includes('india')) || 
                        (user.phone && (user.phone.startsWith('+91') || user.phone.replace(/\D/g, '').startsWith('91')));
        let smsResult = null;
        let waResult = null;

        // Always attempt WhatsApp OTP
        waResult = await sendWhatsAppOTP({ mobile: user.phone, otp });

        if (isIndia) {
            const templateID = user.role === 'vendor' ? "1707175750664448317" : "1707175750668490308";
            smsResult = await sendSMS({ mobile: user.phone, otp, templateID });
        }

        res.status(200).json({
            message: 'OTP sent to your email and mobile number.',
            email: user.email,
            notification: {
                emailSent: emailResult.success,
                waSent: waResult.success,
                smsSent: smsResult ? smsResult.success : false,
                smsSkipped: !isIndia
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp && otp !== '123456') {
            return res.status(400).json({ message: 'Invalid OTP code' });
        }

        if (otp !== '123456' && user.otpExpires && user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otp = '';
        user.otpExpires = null;
        user.isVerified = true;
        await user.save();

        res.status(200).json({
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
    try {
        if (req.user.id === 'ad0000000000000000000000') {
            return res.status(403).json({ message: 'Admin profile cannot be updated' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const fieldsToUpdate = [
            'firstName', 'lastName', 'phone', 'company', 'address',
            'profilePhoto', 'uploadedDocument', 'country', 'city', 'state', 'pincode',
            'website', 'alternativeEmail', 'alternativeNumber', 'dateOfIncorporation',
            'companyAge', 'directorsNames', 'directorsCount', 'lastYearTurnover',
            'companyProfile', 'serviceIn', 'services', 'deductionPercentage'
        ];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        if (req.body.firstName || req.body.lastName) {
            const first = req.body.firstName || user.firstName;
            const last = req.body.lastName || user.lastName;
            user.name = `${first} ${last}`.trim();
        } else if (req.body.name) {
            user.name = req.body.name;
        }

        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
