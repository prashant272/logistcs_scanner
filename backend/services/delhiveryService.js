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

    // 3. Create Warehouse (For Aggregators / Dynamic Pickups)
    async createWarehouse(payload) {
        try {
            const token = await this.getToken();
            const config = await DelhiveryConfig.findOne();
            const baseUrl = getBaseUrl(config.is_production);

            // Endpoint: /client-warehouses/ (from Delhivery Docs pg 26 sample curl)
            const response = await axios.post(`${baseUrl}/client-warehouses/`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
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

        try {
            // Convert nested JSON to stringified fields for multipart/form-data
            const formPayload = {};

            for (const key in payload) {
                if (payload[key] !== undefined && payload[key] !== null) {
                    if (key === 'doc_file' && payload[key].buffer) {
                        if (typeof File !== 'undefined') {
                            formPayload[key] = new File([payload[key].buffer], payload[key].originalname, { type: payload[key].mimetype });
                        } else {
                            formPayload[key] = new Blob([payload[key].buffer], { type: payload[key].mimetype });
                        }
                    } else if (typeof payload[key] === 'object') {
                        // Delhivery expects all nested objects and list fields to be JSON strings
                        formPayload[key] = JSON.stringify(payload[key]);
                    } else {
                        formPayload[key] = payload[key];
                    }
                }
            }

            // Use axios.postForm which natively handles multipart/form-data
            const response = await axios.postForm(`${baseUrl}/manifest`, formPayload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Delhivery Manifest Error:', error.response?.data || error.message);
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
    }
};

module.exports = delhiveryService;
