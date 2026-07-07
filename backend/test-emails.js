require('dotenv').config();
const {
    sendVendorRegistrationAdminAlert,
    sendVendorWelcomeEmail,
    sendVendorStatusUpdateEmail,
    sendEnquiryToVendorAlert,
    sendEnquiryCustomerConfirmation,
    sendEnquiryAcceptedCustomerAlert,
    sendGuestAccountCreatedEmail,
    sendAdminCreatedUserEmail,
    handleSignupNotification
} = require('./services/notificationService');

const email = 'prashantkrjha12@gmail.com';

const testEmails = async () => {
    try {
        console.log('Sending Test OTP...');
        await handleSignupNotification({ email, phone: '+919999999999', country: 'India', otp: '123456', role: 'vendor' });

        console.log('Sending Vendor Registration Alert...');
        await sendVendorRegistrationAdminAlert({ name: 'Prashant', companyName: 'Logistics Scanner', email, phone: '9999999999' });

        console.log('Sending Vendor Welcome Email...');
        await sendVendorWelcomeEmail(email, 'Prashant');

        console.log('Sending Vendor Status Update...');
        await sendVendorStatusUpdateEmail(email, 'Prashant', true);

        console.log('Sending Enquiry to Vendor...');
        await sendEnquiryToVendorAlert(email, { cargoType: 'Electronics', pickupCity: 'Delhi', pickupCountry: 'India', destinationCity: 'Dubai', destinationCountry: 'UAE', weight: '500', volume: '2' });

        console.log('Sending Enquiry Customer Confirmation...');
        await sendEnquiryCustomerConfirmation(email, { cargoType: 'Electronics', pickupCity: 'Delhi', destinationCity: 'Dubai' });

        console.log('Sending Enquiry Accepted Alert...');
        await sendEnquiryAcceptedCustomerAlert(email, 'Vendor XYZ', { cargoType: 'Electronics' });

        console.log('Sending Guest Account Created Email...');
        await sendGuestAccountCreatedEmail(email, 'Prashant', 'RandomPassword123');

        console.log('Sending Admin Created User Email...');
        await sendAdminCreatedUserEmail(email, 'Prashant', 'AdminPass123', 'vendor');

        console.log('All test emails sent successfully.');
    } catch (error) {
        console.error('Error sending test emails:', error);
    }
};

testEmails();
