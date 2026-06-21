const nodemailer = require('nodemailer');
const axios = require('axios');

// Configure Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS (secure: false for port 587)
    auth: {
        user: 'logisticsscannerofficials@gmail.com',
        pass: 'hgltigcwgnzruasb'
    }
});

/**
 * Send Email via Gmail SMTP
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: '"Logisticsscanner" <logisticsscannerofficials@gmail.com>',
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email via SMTP:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send SMS via Juvlon API Gateway
 * @param {Object} options - { mobile, otp, templateID }
 */
const sendSMS = async ({ mobile, otp, templateID = "1707175750664448317" }) => {
    try {
        // Clean mobile number: remove non-digits to get digits only (e.g. 919801017333)
        let cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
            cleanMobile = '91' + cleanMobile;
        }
        
        let body = '';
        if (templateID === "1707175750664448317") {
            body = `BNBWL: Your OTP is ${otp} to complete your customer registration on LogisticsScanner. Valid for 10 minutes. Do not share with anyone.`;
        } else if (templateID === "1707175750032925464") {
            body = `BNBWL: Congratulations! Your account on LogisticsScanner has been successfully registered. Welcome aboard!`;
        } else {
            body = `BNBWL: Your OTP is ${otp} to complete registration on LogisticsScanner.`;
        }

        const payload = {
            apiKey: "D077FB8FD1262E56A02AE5138E5EB88C",
            mobile: cleanMobile,
            body: body,
            entityID: "1701175403064900652",
            templateID: templateID,
            headerID: "LOGSCN"
        };

        const response = await axios.post('https://api2.juvlon.com/v5/sendSMS', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Juvlon SMS sent response:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending SMS via Juvlon:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Helper to process signup OTP flow
 * @param {Object} userData - { email, phone, country, otp }
 */
const handleSignupNotification = async ({ email, phone, country, otp }) => {
    console.log(`\n====================================`);
    console.log(`[Notification Service] OTP Generated: ${otp} for ${email} / ${phone}`);
    console.log(`====================================\n`);
    // Check if the user is from India
    const isIndia = (country && country.toLowerCase().includes('india')) || 
                    (phone && (phone.startsWith('+91') || phone.replace(/\D/g, '').startsWith('91')));
    
    // Always send Email OTP
    const emailSubject = 'Your OTP for Email Verification';
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
            <h2>Welcome to LogisticsScanner!</h2>
            <p>Your OTP for email verification is: <strong style="font-size: 18px; color: #00b2fe;">${otp}</strong></p>
            <p>Please enter this code to complete your registration. Valid for 10 minutes.</p>
        </div>
    `;
    const emailResult = await sendEmail({ to: email, subject: emailSubject, html: emailHtml });

    let smsResult = null;
    if (isIndia) {
        // Send SMS OTP if from India
        smsResult = await sendSMS({ mobile: phone, otp, templateID: "1707175750664448317" });
    }

    return {
        emailSent: emailResult.success,
        smsSent: smsResult ? smsResult.success : false,
        smsSkipped: !isIndia
    };
};

module.exports = {
    sendEmail,
    sendSMS,
    handleSignupNotification
};
