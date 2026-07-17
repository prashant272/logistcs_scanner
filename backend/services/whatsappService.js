const axios = require('axios');

/**
 * Send WhatsApp Template Message using Wabridge API
 * @param {string} mobile - Destination phone number
 * @param {string} templateId - The approved Template ID from Wabridge
 * @param {Array<string>} variables - Array of variable strings to fill the template
 * @returns {Promise<Object>} Response object
 */
const sendWhatsAppTemplate = async (mobile, templateId, variables = [], country = '') => {
    try {
        // Clean mobile number (remove +, spaces, dashes)
        let cleanMobile = mobile ? mobile.replace(/\D/g, '') : '';
        
        // Check if India: if country contains 'india', or if country is missing/blank AND length is 10
        const isIndia = (country && country.toLowerCase().includes('india')) || (!country && cleanMobile.length === 10);
        
        // If it's identified as India and exactly 10 digits (and didn't start with '+'), prepend 91
        if (isIndia && cleanMobile.length === 10 && !mobile.startsWith('+')) {
            cleanMobile = '91' + cleanMobile;
        }

        if (!cleanMobile) {
            console.error('[WhatsApp Service] Error: Invalid or missing mobile number');
            return { success: false, error: 'Invalid mobile number' };
        }

        const payload = {
            "app-key": process.env.WABRIDGE_APP_KEY || "9f0df15d-1058-44b2-9beb-ff309449afa9",
            "auth-key": process.env.WABRIDGE_AUTH_KEY || "0ede54ddb11953c237dc825c4bdcd43e3ec41ce335a7d2591b",
            "device_id": process.env.WABRIDGE_DEVICE_ID || "6960a3783524dd5a0916b9d5",
            "destination_number": cleanMobile,
            "template_id": templateId,
            "variables": variables,
            "button_variable": [],
            "media": "",
            "message": ""
        };

        const response = await axios.post('https://web.wabridge.com/api/createmessage', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`[WhatsApp Service] Template '${templateId}' sent to ${cleanMobile}. Response:`, response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[WhatsApp Service] Error sending WhatsApp template:', error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send WhatsApp notification when a vendor accepts an enquiry
 * @param {string} mobile - Customer/Vendor phone number
 * @param {Object} enquiryDetails - details of the enquiry (type, pickupCity, destinationCity)
 * @param {string} vendorName - Name of the vendor who accepted
 * @param {string} country - Country of the customer
 * @param {string} customerName - Name of the customer
 */
const sendEnquiryAcceptedWhatsApp = async (mobile, enquiryDetails, vendorName, country = '', customerName = 'Customer') => {
    // The Wabridge template ID you provide will go here
    const TEMPLATE_ID = process.env.WABRIDGE_ENQUIRY_ACCEPTED_TEMPLATE_ID || "1532744188323973";
    
    // Variables must match exactly what we put in Wabridge {{1}}, {{2}}, {{3}}, {{4}}, {{5}}
    const variables = [
        customerName,
        `*${enquiryDetails.cargoType ? enquiryDetails.cargoType.toUpperCase() + ' Freight' : 'Freight'}*`,
        `*${enquiryDetails.pickupCity || 'Origin'}*`,
        `*${enquiryDetails.destinationCity || 'Destination'}*`,
        `*${vendorName || 'a Vendor'}*`
    ];

    return await sendWhatsAppTemplate(mobile, TEMPLATE_ID, variables, country);
};

/**
 * Send WhatsApp notification to a vendor when a new enquiry is received
 * @param {string} mobile - Vendor phone number
 * @param {Object} enquiryDetails - details of the enquiry
 * @param {string} vendorName - Name of the vendor
 * @param {string} country - Country of the vendor
 */
const sendNewEnquiryVendorWhatsApp = async (mobile, enquiryDetails, vendorName, country = '') => {
    const TEMPLATE_ID = process.env.WABRIDGE_NEW_ENQUIRY_VENDOR_TEMPLATE_ID || "4573386356251819";
    
    // Format date as DD MMM YYYY (e.g. 14 Jul 2026)
    const dateObj = new Date();
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Variables for template: {{1}} Vendor Name, {{2}} Shipment Type, {{3}} Date, {{4}} Origin, {{5}} Destination
    const variables = [
        vendorName || 'Vendor',
        `*${enquiryDetails.cargoType ? enquiryDetails.cargoType.toUpperCase() + ' Freight' : 'Freight'}*`,
        `*${dateStr}*`,
        `*${enquiryDetails.pickupCity || 'Origin'}*`,
        `*${enquiryDetails.destinationCity || 'Destination'}*`
    ];

    return await sendWhatsAppTemplate(mobile, TEMPLATE_ID, variables, country);
};

module.exports = {
    sendWhatsAppTemplate,
    sendEnquiryAcceptedWhatsApp,
    sendNewEnquiryVendorWhatsApp
};
