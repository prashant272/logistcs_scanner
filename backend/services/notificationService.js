const nodemailer = require('nodemailer');
const axios = require('axios');

const path = require('path');

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

const wrapPremiumEmail = (htmlContent) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logistics Scanner</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fc; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f7fc; padding: 15px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 auto;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #ffffff; padding: 30px 15px 20px; border-bottom: 1px solid #f0f0f0;">
                            <img src="cid:logo_img" alt="Logistics Scanner Logo" style="max-height: 55px; width: auto; object-fit: contain; display: block;" />
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 30px 25px; color: #334155; line-height: 1.6; font-size: 15px;">
                            ${htmlContent}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 30px 20px; border-top: 1px solid #e2e8f0;">
                            <h4 style="margin: 0 0 8px 0; color: #0B1E43; font-size: 18px; font-weight: 800;">Logistics Scanner</h4>
                            <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px; font-weight: 600;">The Global B2B Freight Platform</p>
                            
                            <!-- Main Action Button -->
                            <div style="margin-bottom: 25px;">
                                <a href="https://logisticsscanner.com" style="display: inline-block; padding: 12px 30px; background-color: #00b2fe; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">Visit Website</a>
                            </div>
                            
                            <!-- Social Media Icons -->
                            <div style="margin-bottom: 25px;">
                                <a href="https://www.facebook.com/logisticsscanner" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="https://img.icons8.com/color/48/facebook-new.png" alt="Facebook" style="width: 32px; height: 32px;" />
                                </a>
                                <a href="https://x.com/Logisticscanner" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="https://img.icons8.com/ios-filled/50/twitterx--v2.png" alt="X" style="width: 30px; height: 30px;" />
                                </a>
                                <a href="https://www.instagram.com/logisticsscanner/" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="https://img.icons8.com/color/48/instagram-new--v1.png" alt="Instagram" style="width: 32px; height: 32px;" />
                                </a>
                                <a href="https://www.linkedin.com/company/logisticsscanner/" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="https://img.icons8.com/color/48/linkedin.png" alt="LinkedIn" style="width: 32px; height: 32px;" />
                                </a>
                                <a href="https://www.youtube.com/@Logisticsscanner" target="_blank" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="https://img.icons8.com/color/48/youtube-play.png" alt="YouTube" style="width: 32px; height: 32px;" />
                                </a>
                            </div>
                            
                            <!-- App Badges -->
                            <div style="margin-bottom: 25px;">
                                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Download Our App</p>
                                <a href="https://apps.apple.com/us/app/logisticsscanner-freight-cha/id6749311566" style="display: inline-block; margin: 0 5px; text-decoration: none;">
                                    <img src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg" alt="Download on the App Store" style="height: 38px; width: auto;" />
                                </a>
                                <a href="https://play.google.com/store/apps/details?id=com.logosticdekhoapp.app&hl=en_IN" style="display: inline-block; margin: 0 5px; text-decoration: none;">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" style="height: 38px; width: auto;" />
                                </a>
                            </div>
                            
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 500; line-height: 1.5;">
                                &copy; ${new Date().getFullYear()} Logistics Scanner. All rights reserved.<br/>
                                This is an automated message, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * Send Email via Gmail SMTP
 * @param {Object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `"Logistics Scanner" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: wrapPremiumEmail(html),
            attachments: [
                {
                    filename: 'logo.png',
                    path: path.join(__dirname, '../assets/logo.png'),
                    cid: 'logo_img'
                }
            ]
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
        <h2 style="color: #0B1E43; margin-top: 0;">Welcome to LogisticsScanner!</h2>
        <p>Your OTP for email verification is: <strong style="font-size: 24px; color: #00b2fe; letter-spacing: 2px; padding: 10px; background: #f8fafc; border-radius: 8px; display: inline-block; margin: 10px 0;">${otp}</strong></p>
        <p style="color: #64748b;">Please enter this code to complete your registration. Valid for 10 minutes.</p>
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
        <h2 style="color: #0B1E43; margin-top: 0; border-bottom: 2px solid #00b2fe; padding-bottom: 10px; display: inline-block;">New Vendor Registration Alert</h2>
        <p style="color: #475569;">A new vendor has just registered on the platform and requires verification.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <ul style="list-style-type: none; padding: 0; margin: 0; color: #334155;">
                <li style="margin-bottom: 10px;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Name:</strong> ${vendorDetails.name}</li>
                <li style="margin-bottom: 10px;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Company:</strong> ${vendorDetails.companyName || 'N/A'}</li>
                <li style="margin-bottom: 10px;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Email:</strong> ${vendorDetails.email}</li>
                <li style="margin-bottom: 0;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Phone:</strong> ${vendorDetails.phone}</li>
            </ul>
        </div>
        <p style="color: #475569;">Please log in to the admin panel to review and verify this vendor.</p>
    `;
    return await sendEmail({ to: ADMIN_EMAIL, subject, html });
};

const sendVendorWelcomeEmail = async (vendorEmail, vendorName) => {
    const subject = 'Welcome to Logistics Scanner! Action Required';
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0;">Welcome aboard, ${vendorName}!</h2>
        <p style="color: #475569;">Thank you for registering as a vendor on <strong style="color: #00b2fe;">Logistics Scanner</strong>.</p>
        <div style="background-color: #eff6ff; border-left: 4px solid #00b2fe; padding: 15px 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #1e3a8a; font-weight: 600;">Our representative will contact you shortly to complete your onboarding process.</p>
        </div>
        <p style="color: #475569;">Once your profile is verified, you will be able to start receiving enquiries and managing your shipments.</p>
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendVendorStatusUpdateEmail = async (vendorEmail, vendorName, isApproved) => {
    const status = isApproved ? 'Approved' : 'Suspended/Rejected';
    const subject = `Your Vendor Profile Status Update: ${status}`;
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0;">Hello ${vendorName},</h2>
        <p style="color: #475569;">Your vendor profile status has been updated by the administration.</p>
        <div style="background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 16px;"><strong>Current Status:</strong> <span style="color: ${isApproved ? '#16a34a' : '#dc2626'}; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${status}</span></p>
        </div>
        ${isApproved
        ? '<p style="color: #475569;">You can now log in to your dashboard and manage your pricing, bookings, and enquiries!</p>'
        : '<p style="color: #475569;">If you have any questions or require further assistance, please contact our support team.</p>'
    }
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendEnquiryToVendorAlert = async (vendorEmail, enquiryDetails) => {
    const subject = 'New Enquiry Received - Logistics Scanner';
    
    // Format location strings
    const pickupStr = enquiryDetails.pickupCountry && enquiryDetails.pickupCountry !== 'Any' ? `${enquiryDetails.pickupCity}, ${enquiryDetails.pickupCountry}` : enquiryDetails.pickupCity;
    const destStr = enquiryDetails.destinationCountry && enquiryDetails.destinationCountry !== 'Any' ? `${enquiryDetails.destinationCity}, ${enquiryDetails.destinationCountry}` : enquiryDetails.destinationCity;
    const volumeStr = enquiryDetails.volume && enquiryDetails.volume !== 'N/A' ? `${enquiryDetails.volume} cbm` : '';
    const weightStr = enquiryDetails.weight && enquiryDetails.weight !== 'N/A' ? `${enquiryDetails.weight} kg` : '';
    const weightVolStr = [weightStr, volumeStr].filter(Boolean).join(' / ') || 'N/A';
    
    const formattedCargoType = enquiryDetails.cargoType ? `${enquiryDetails.cargoType.toUpperCase()} Freight` : 'N/A';

    const html = `
        <h2 style="color: #0B1E43; margin-top: 0; border-bottom: 2px solid #00b2fe; padding-bottom: 10px; display: inline-block;">You Have Received a New Enquiry!</h2>
        <p style="color: #475569;">A customer has sent you a direct enquiry.</p>
        <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 20px 0;">
            <tr><td style="padding: 12px 15px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 40%;"><strong style="color: #0B1E43;">Cargo Type</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${formattedCargoType}</td></tr>
            <tr><td style="padding: 12px 15px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"><strong style="color: #0B1E43;">Pickup</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${pickupStr}</td></tr>
            <tr><td style="padding: 12px 15px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"><strong style="color: #0B1E43;">Destination</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${destStr}</td></tr>
            <tr><td style="padding: 12px 15px; background-color: #f8fafc; border-right: 1px solid #e2e8f0;"><strong style="color: #0B1E43;">Weight/Volume</strong></td><td style="padding: 12px 15px;">${weightVolStr}</td></tr>
        </table>
        <p style="color: #475569; font-weight: 600; text-align: center; margin-top: 30px;">Please log in to your vendor dashboard to review and provide a quotation.</p>
    `;
    return await sendEmail({ to: vendorEmail, subject, html });
};

const sendEnquiryCustomerConfirmation = async (customerEmail, enquiryDetails) => {
    const subject = 'Your Enquiry Has Been Sent Successfully';
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0;">Enquiry Sent!</h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #334155; line-height: 1.6;">Your enquiry for <strong style="color: #00b2fe;">${enquiryDetails.cargoType}</strong> from <strong>${enquiryDetails.pickupCity}</strong> to <strong>${enquiryDetails.destinationCity}</strong> has been successfully sent to the vendor.</p>
        </div>
        <p style="color: #475569;">You will be notified once the vendor responds or provides a quotation.</p>
        <p style="color: #0B1E43; font-weight: 700; margin-top: 30px;">Thank you for using Logistics Scanner!</p>
    `;
    return await sendEmail({ to: customerEmail, subject, html });
};

const sendEnquiryAcceptedCustomerAlert = async (customerEmail, vendorName, enquiryDetails) => {
    const subject = 'Your Enquiry Has Been Accepted!';
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0; border-bottom: 2px solid #10b981; padding-bottom: 10px; display: inline-block;">Enquiry Accepted</h2>
        <p style="color: #475569;">Great news! Your enquiry for <strong style="color: #0B1E43;">${enquiryDetails.cargoType}</strong> has been accepted by <strong style="color: #00b2fe;">${vendorName}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #334155; font-weight: 600;">Please log in to your customer dashboard to proceed with the booking or to view further details and quotation.</p>
        </div>
    `;
    return await sendEmail({ to: customerEmail, subject, html });
};

const sendGuestAccountCreatedEmail = async (customerEmail, customerName, generatedPassword) => {
    const subject = 'Your Customer Account has been Created - Logistics Scanner';
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0;">Welcome to Logistics Scanner, ${customerName || 'Customer'}!</h2>
        <p style="color: #475569;">Thank you for submitting your enquiry. To help you track your enquiries easily, we have automatically created a customer account for you.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin-top: 0; font-weight: 700; color: #0B1E43;">Here are your login details:</p>
            <ul style="list-style-type: none; padding: 0; margin: 0; color: #334155;">
                <li style="margin-bottom: 10px;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Email:</strong> ${customerEmail}</li>
                <li><strong style="color: #0B1E43; width: 100px; display: inline-block;">Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #0f172a; font-weight: bold;">${generatedPassword}</code></li>
            </ul>
        </div>
        <p style="color: #475569;">You can use these credentials to log in to your dashboard and track your responses. If you prefer to change your password, you can use the "Forgot Password" option on the login page.</p>
    `;
    return await sendEmail({ to: customerEmail, subject, html });
};

const sendAdminCreatedUserEmail = async (email, name, password, role) => {
    const subject = `Your ${role.charAt(0).toUpperCase() + role.slice(1)} Account has been Created - Logistics Scanner`;
    const html = `
        <h2 style="color: #0B1E43; margin-top: 0;">Welcome to Logistics Scanner, ${name || 'User'}!</h2>
        <p style="color: #475569;">An administrator has created a <strong style="color: #00b2fe;">${role}</strong> account for you on our platform.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin-top: 0; font-weight: 700; color: #0B1E43;">Here are your login details:</p>
            <ul style="list-style-type: none; padding: 0; margin: 0; color: #334155;">
                <li style="margin-bottom: 10px;"><strong style="color: #0B1E43; width: 100px; display: inline-block;">Email:</strong> ${email}</li>
                <li><strong style="color: #0B1E43; width: 100px; display: inline-block;">Password:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #0f172a; font-weight: bold;">${password}</code></li>
            </ul>
        </div>
        <p style="color: #475569; font-weight: 600; text-align: center;">You can use these credentials to log in to your dashboard. We highly recommend changing your password after your first login.</p>
    `;
    return await sendEmail({ to: email, subject, html });
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
    sendEnquiryAcceptedCustomerAlert,
    sendGuestAccountCreatedEmail,
    sendAdminCreatedUserEmail
};
