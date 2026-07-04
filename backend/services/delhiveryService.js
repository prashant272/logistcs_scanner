const axios = require('axios');
const DelhiveryConfig = require('../models/DelhiveryConfig');

const getBaseUrl = (isProd) => {
    return isProd ? 'https://ltl-clients-api.delhivery.com' : 'https://ltl-clients-api-dev.delhivery.com';
};

const delhiveryService = {
    // 1. Token Management
    async getToken() {
        let config = await DelhiveryConfig.findOne();
        if (!config) {
            throw new Error('Delhivery Configuration not found in Admin Settings.');
        }

        if (!config.username || !config.password) {
            throw new Error('Delhivery credentials missing. Please update in Admin Settings.');
        }

        const now = new Date();
        const tokenAgeHours = config.token_generated_at ? (now - config.token_generated_at) / (1000 * 60 * 60) : 25;

        // Token expires in 24 hours, refresh if older than 23 hours
        if (config.jwt_token && tokenAgeHours < 23) {
            return config.jwt_token;
        }

        // Generate new token
        try {
            const baseUrl = getBaseUrl(config.is_production);
            const response = await axios.post(`${baseUrl}/ums/login`, {
                username: config.username,
                password: config.password
            });

            if (response.data && response.data.success && response.data.data && response.data.data.jwt) {
                config.jwt_token = response.data.data.jwt;
                config.token_generated_at = now;
                await config.save();
                return config.jwt_token;
            } else {
                throw new Error('Failed to generate Delhivery token. Invalid response.');
            }
        } catch (error) {
            console.error('Delhivery Login Error:', error.response?.data || error.message);
            throw new Error('Could not authenticate with Delhivery.');
        }
    },

    // 2. Calculate Freight Estimate
    async estimateFreight(payload) {
        try {
            const token = await this.getToken();
            const config = await DelhiveryConfig.findOne();
            const baseUrl = getBaseUrl(config.is_production);

            const response = await axios.post(`${baseUrl}/freight/estimate`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                return {
                    basePrice: response.data.data.price_breakup?.base_freight_charge || 0,
                    finalPrice: response.data.data.total || 0,
                    markupApplied: 0,
                    breakup: response.data.data
                };
            } else {
                throw new Error('Invalid response from Delhivery pricing API');
            }
        } catch (error) {
            console.error('Delhivery Freight Estimate Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },
    // 2.5 Calculate Expected TAT
    async estimateTat(origin_pin, destination_pin) {
        try {
            const token = await this.getToken();
            const config = await DelhiveryConfig.findOne();
            const baseUrl = getBaseUrl(config.is_production);

            const response = await axios.get(`${baseUrl}/tat/estimate?origin_pin=${origin_pin}&destination_pin=${destination_pin}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Source': 'Client'
                }
            });

            if (response.data && response.data.success) {
                return response.data.data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Delhivery TAT Estimate Error:', error.response?.data || error.message);
            return null; // Return null instead of throwing so it doesn't break rate calculation
        }
    },

    // 3. Create Warehouse (For Aggregators / Dynamic Pickups)
    async createWarehouse(payload) {
        try {
            const token = await this.getToken();
            const config = await DelhiveryConfig.findOne();
            const baseUrl = getBaseUrl(config.is_production);

            // Endpoint: /client-warehouse/create/ (from Delhivery Docs B2B Page 20)
            const response = await axios.post(`${baseUrl}/client-warehouse/create/`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data && response.data.success === false) {
                throw { response: { data: response.data } };
            }
            return response.data;
        } catch (error) {
            console.error('Delhivery Create Warehouse Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 4. Serviceability (Pincode Check)
    async checkServiceability(pincode, weight = 1000) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);

        try {
            const response = await axios.get(`${baseUrl}/pincode-service/${pincode}?weight=${weight}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Serviceability Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 4. Create Manifest
    async createManifest(payload) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);
        const FormData = require('form-data');

        try {
            const formData = new FormData();

            for (const key in payload) {
                if (payload[key] !== undefined && payload[key] !== null) {
                    if (key === 'doc_file' && payload[key].buffer) {
                        let fileBuffer = payload[key].buffer;
                        // Convert serialized buffer back to native Buffer if necessary
                        if (fileBuffer.type === 'Buffer' && Array.isArray(fileBuffer.data)) {
                            fileBuffer = Buffer.from(fileBuffer.data);
                        }
                        formData.append(key, fileBuffer, {
                            filename: payload[key].originalname || 'invoice.pdf',
                            contentType: payload[key].mimetype || 'application/pdf'
                        });
                    } else if (typeof payload[key] === 'object') {
                        // Delhivery expects all nested objects and list fields to be JSON strings
                        formData.append(key, JSON.stringify(payload[key]));
                    } else {
                        // Coerce numbers/booleans to strings to prevent form-data stream type errors
                        formData.append(key, String(payload[key]));
                    }
                }
            }

            const response = await axios.post(`${baseUrl}/manifest`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Manifest Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 4.5 Get Manifest Status (Async Job Result)
    async getManifestStatus(jobId) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);

        try {
            const response = await axios.get(`${baseUrl}/manifest?job_id=${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Manifest Status Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 5. Track Shipment
    async trackShipment(lrn) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);

        try {
            const response = await axios.get(`${baseUrl}/lrn/track?lrnum=${lrn}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Track Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 6. Print Label / Packing Slip
    async getPackingSlip(lrn) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        
        const baseUrl = getBaseUrl(config.is_production);

        try {
            // As per Delhivery B2B API Document Page 53: Get Label URLs API
            const response = await axios.get(`${baseUrl}/label/get_urls/std/${lrn}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                responseType: 'json'
            });
            
            // The response contains an array of URLs. We need to fetch the base64 data from each URL.
            const urls = response.data?.data;
            if (urls && Array.isArray(urls)) {
                const base64Images = [];
                for (const url of urls) {
                    try {
                        const imgRes = await axios.get(url);
                        if (imgRes.data && imgRes.data.data) {
                            base64Images.push(imgRes.data.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch label image from URL:", url, err.message);
                    }
                }
                return { success: true, images: base64Images };
            }
            
            return response.data;
        } catch (error) {
            console.error('Delhivery Packing Slip Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 7. Cancel Shipment
    async cancelShipment(lrn) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);

        try {
            const response = await axios.delete(`${baseUrl}/lrn/cancel/${lrn}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Cancel Shipment Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    },

    // 8. Create Pickup Request
    async createPickupRequest(payload) {
        const token = await this.getToken();
        const config = await DelhiveryConfig.findOne();
        const baseUrl = getBaseUrl(config.is_production);

        try {
            // Note: Delhivery B2B Pickup API usually has a trailing slash and no /api prefix depending on version, 
            // but we'll use baseUrl/pickup_requests/ as per docs.
            const response = await axios.post(`${baseUrl}/pickup_requests/`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Pickup Request Error:', error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
};

module.exports = delhiveryService;
