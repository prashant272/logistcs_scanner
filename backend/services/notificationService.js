const nodemailer = require('nodemailer');
const axios = require('axios');

// Configure Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // TLS (secure: false for port 587)
    auth: {
        user: process.env.EMAIL_USER || 'logisticsscannerofficials@gmail.com',
        pass: process.env.EMAIL_PASS || 'hgltigcwgnzruasb'
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
const sendSMS = async ({ mobile, otp, templateID = "1707175750668490308" }) => {
    try {
        // Clean mobile number: remove non-digits to get digits only
        let cleanMobile = mobile.replace(/\D/g, '');
        // Juvlon PHP code was sending 10 digits, so if it starts with 91, strip it.
        if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
            cleanMobile = cleanMobile.substring(2);
        }

        let body = '';
        if (templateID === "1707175750668490308") {
            body = `BNBWL: Your OTP is ${otp} to complete your customer registration on LogisticsScanner. Valid for 10 minutes. Do not share with anyone.`;
        } else if (templateID === "1707175750664448317") {
            body = `BNBWL: Your OTP is ${otp} to complete vendor registration on LogisticsScanner. Valid for 10 minutes. Do not share with anyone.`;
        } else if (templateID === "1707175750054912723") {
            body = `BNBWL: Welcome to LogisticsScanner! Your customer account has been created successfully. Happy shipping with us!`;
        } else if (templateID === "1707175750032925464") {
            body = `BNBWL: Congratulations! Your vendor account on LogisticsScanner has been successfully registered. Welcome aboard!`;
        } else {
            body = `BNBWL: Your OTP is ${otp} to complete your customer registration on LogisticsScanner. Valid for 10 minutes. Do not share with anyone.`;
            templateID = "1707175750668490308";
        }

        const payload = {
            apiKey: process.env.JUVLON_API_KEY || "D077FB8FD1262E56A02AE5138E5EB88C",
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
 * Send WhatsApp OTP via Meta Graph API
 * @param {Object} options - { mobile, otp }
 */
const sendWhatsAppOTP = async ({ mobile, otp }) => {
    try {
        // Clean mobile number (remove + and spaces)
        let cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
            cleanMobile = '91' + cleanMobile; // default to India if only 10 digits
        }

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanMobile,
            type: "template",
            template: {
                name: "otp_verification",
                language: {
                    code: "en_US"
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: String(otp)
                            }
                        ]
                    },
                    {
                        type: "button",
                        sub_type: "url",
                        index: "0",
                        parameters: [
                            {
                                type: "text",
                                text: String(otp)
                            }
                        ]
                    }
                ]
            }
        };

        const phoneId = process.env.WHATSAPP_PHONE_ID || '790783224112773';
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${phoneId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('WhatsApp OTP sent response:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error sending WhatsApp OTP:', error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Helper to process signup OTP flow
 * @param {Object} userData - { email, phone, country, otp, role }
 */
const handleSignupNotification = async ({ email, phone, country, otp, role = 'customer' }) => {
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
    // Run notifications concurrently to reduce delay
    const tasks = [
        sendEmail({ to: email, subject: emailSubject, html: emailHtml }),
        sendWhatsAppOTP({ mobile: phone, otp })
    ];

    if (isIndia) {
        const templateID = role === 'vendor' ? "1707175750664448317" : "1707175750668490308";
        tasks.push(sendSMS({ mobile: phone, otp, templateID }));
    }

    const results = await Promise.allSettled(tasks);

    const emailResult = results[0].status === 'fulfilled' ? results[0].value : { success: false };
    const waResult = results[1].status === 'fulfilled' ? results[1].value : { success: false };
    const smsResult = isIndia && results[2].status === 'fulfilled' ? results[2].value : { success: false };

    return {
        emailSent: emailResult.success,
        waSent: waResult.success,
        smsSent: smsResult.success,
        smsSkipped: !isIndia
    };
};

/**
 * Email Templates for Notifications
 */

const ADMIN_EMAIL = 'logisticsscannerofficials@gmail.com';

const sendVendorRegistrationAdminAlert = async (vendorDetails) => {
    const subject = `New Vendor Registration: ${vendorDetails.companyName || vendorDetails.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Vendor Registration Alert</h2>
            <p>A new vendor has just registered on the platform and requires verification.</p>
            <ul>
                <li><strong>Name:</strong> ${vendorDetails.name}</li>
                <li><strong>Company:</strong> ${vendorDetails.companyName || 'N/A'}</li>
                <li><strong>Email:</strong> ${vendorDetails.email}</li>
                <li><strong>Phone:</strong> ${vendorDetails.phone}</li>
            </ul>
            <p>Please log in to the admin panel to review and verify this vendor.</p>
        </div>
    `;
    return await sendEmail({ to: ADMIN_EMAIL, subject, html });
};

const sendVendorWelcomeEmail = async (vendorEmail, vendorName) => {
    const subject = 'Welcome to Logistics Scanner! Action Required';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome aboard, ${vendorName}!</h2>
            <p>Thank you for registering as a vendor on <strong>Logistics Scanner</strong>.</p>
            <p>Our representative will contact you shortly to complete your onboarding process.</p>
            <p>Once your profile is verified, you will be able to start receiving enquiries and managing your shipments.</p>
            <br>
            <p>Best Regards,</p>
            <p>Logistics Scanner Team</p>
        </div>
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendVendorStatusUpdateEmail = async (vendorEmail, vendorName, isApproved) => {
    const status = isApproved ? 'Approved' : 'Suspended/Rejected';
    const subject = `Your Vendor Profile Status Update: ${status}`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hello ${vendorName},</h2>
            <p>Your vendor profile status has been updated by the administration.</p>
            <p><strong>Current Status:</strong> <span style="color: ${isApproved ? 'green' : 'red'};">${status}</span></p>
            ${isApproved
            ? '<p>You can now log in to your dashboard and manage your pricing, bookings, and enquiries!</p>'
            : '<p>If you have any questions or require further assistance, please contact our support team.</p>'
        }
            <br>
            <p>Best Regards,</p>
            <p>Logistics Scanner Team</p>
        </div>
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendEnquiryToVendorAlert = async (vendorEmail, enquiryDetails) => {
    const subject = 'New Enquiry Received - Logistics Scanner';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>You Have Received a New Enquiry!</h2>
            <p>A customer has sent you a direct enquiry.</p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
                <tr><td><strong>Cargo Type</strong></td><td>${enquiryDetails.cargoType}</td></tr>
                <tr><td><strong>Pickup</strong></td><td>${enquiryDetails.pickupCity}, ${enquiryDetails.pickupCountry}</td></tr>
                <tr><td><strong>Destination</strong></td><td>${enquiryDetails.destinationCity}, ${enquiryDetails.destinationCountry}</td></tr>
                <tr><td><strong>Weight/Volume</strong></td><td>${enquiryDetails.weight} kg / ${enquiryDetails.volume} cbm</td></tr>
            </table>
            <p>Please log in to your vendor dashboard to review and provide a quotation.</p>
        </div>
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendEnquiryCustomerConfirmation = async (customerEmail, enquiryDetails) => {
    const subject = 'Your Enquiry Has Been Sent Successfully';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Enquiry Sent!</h2>
            <p>Your enquiry for <strong>${enquiryDetails.cargoType}</strong> from ${enquiryDetails.pickupCity} to ${enquiryDetails.destinationCity} has been successfully sent to the vendor.</p>
            <p>You will be notified once the vendor responds or provides a quotation.</p>
            <br>
            <p>Thank you for using Logistics Scanner!</p>
        </div>
    `;
    return await sendEmail({ to: customerEmail, subject, html });
};

const sendEnquiryAcceptedCustomerAlert = async (customerEmail, vendorName, enquiryDetails) => {
    const subject = 'Your Enquiry Has Been Accepted!';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Enquiry Accepted</h2>
            <p>Great news! Your enquiry for <strong>${enquiryDetails.cargoType}</strong> has been accepted by <strong>${vendorName}</strong>.</p>
            <p>Please log in to your customer dashboard to proceed with the booking or to view further details and quotation.</p>
            <br>
            <p>Best Regards,</p>
            <p>Logistics Scanner Team</p>
        </div>
    `;
    return await sendEmail({ to: customerEmail, subject, html });
};

module.exports = {
    sendEmail,
    sendSMS,
    sendWhatsAppOTP,
    handleSignupNotification,
    sendVendorRegistrationAdminAlert,
    sendVendorWelcomeEmail,
    sendVendorStatusUpdateEmail,
    sendEnquiryToVendorAlert,
    sendEnquiryCustomerConfirmation,
    sendEnquiryAcceptedCustomerAlert
};
