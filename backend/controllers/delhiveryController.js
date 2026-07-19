const delhiveryService = require('../services/delhiveryService');
const DelhiveryConfig = require('../models/DelhiveryConfig');
const PtlBooking = require('../models/PtlBooking');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- Admin Endpoints ---

exports.getAdminConfig = async (req, res) => {
    try {
        let config = await DelhiveryConfig.findOne();
        if (!config) {
            config = await DelhiveryConfig.create({});
        }
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateAdminConfig = async (req, res) => {
    try {
        let config = await DelhiveryConfig.findOne();
        if (!config) {
            config = new DelhiveryConfig(req.body);
        } else {
            Object.assign(config, req.body);
            // If credentials change, reset token
            if (req.body.username || req.body.password) {
                config.jwt_token = '';
                config.token_generated_at = null;
            }
        }
        await config.save();
        res.status(200).json({ message: 'Config updated successfully', config });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllPtlBookings = async (req, res) => {
    try {
        const bookings = await PtlBooking.find().populate('user_id', 'name email company phone').sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- Vendor / Customer Endpoints ---

exports.estimatePrice = async (req, res) => {
    try {
        const { weight_g, dimensions, source_pin, consignee_pin, payment_mode, cod_amount, shipment_value, freight_mode, rov_insurance } = req.body;
        
        // Parse dimensions from string '10x10x10,20x20x20' to array of objects or strings depending on what Delhivery expects. 
        // Commonly they expect list of objects: [{length: 10, breadth: 10, height: 10}] or just list of strings.
        // Let's pass list of objects.
        let dimArray = dimensions;
        if (typeof dimensions === 'string') {
            dimArray = dimensions.split(',').map(d => {
                const parts = d.split('x');
                return { length_cm: parseFloat(parts[0]), width_cm: parseFloat(parts[1]), height_cm: parseFloat(parts[2]), box_count: 1 };
            });
        }

        // 1. Call Delhivery Freight API
        const payload = {
            dimensions: dimArray,
            weight_g: parseFloat(weight_g),
            cheque_payment: false,
            source_pin: String(source_pin),
            consignee_pin: String(consignee_pin),
            payment_mode: payment_mode.toLowerCase() === 'cod' ? 'cod' : 'prepaid',
            freight_mode: freight_mode || 'fod',
            rov_insurance: rov_insurance !== undefined ? rov_insurance : false,
            inv_amount: shipment_value ? parseFloat(shipment_value) : (cod_amount ? parseFloat(cod_amount) : 1000) // invoice amount is mandatory for insurance
        };
        
        console.log("SENDING TO DELHIVERY:", JSON.stringify(payload, null, 2));

        const delhiveryResponse = await delhiveryService.estimateFreight(payload);
        
        console.log("✅ DELHIVERY RATE RECEIVED:", delhiveryResponse);

        // delhiveryResponse is now the object { basePrice, finalPrice, breakup }
        if (!delhiveryResponse || !delhiveryResponse.basePrice) {
            return res.status(400).json({ message: 'Delhivery calculation failed', details: delhiveryResponse });
        }

        const basePrice = delhiveryResponse.finalPrice; // Delhivery's total is our base

        // 2. Apply Markup
        const config = await DelhiveryConfig.findOne();
        let markupPercent = 0;
        
        // Fetch user from DB to get role since token might only have ID
        let userRole = 'customer';
        if (req.user && req.user.id) {
            const dbUser = await User.findById(req.user.id);
            if (dbUser) {
                userRole = dbUser.role;
            }
        }
        
        // If user is vendor, use vendor margin. Otherwise (customer or guest), use customer margin.
        if (userRole === 'vendor') {
            markupPercent = config?.vendor_margin_percent || 10;
        } else {
            markupPercent = config?.customer_margin_percent || 20;
        }

        const finalPrice = basePrice + (basePrice * (markupPercent / 100));

        // 3. Fetch Expected TAT
        let tatData = null;
        if (source_pin && consignee_pin) {
            tatData = await delhiveryService.estimateTat(source_pin, consignee_pin);
        }

        const responseBreakup = delhiveryResponse.breakup || {};
        if (tatData && tatData.tat) {
            responseBreakup.tat = tatData.tat;
        }

        res.status(200).json({
            success: true,
            basePrice,
            finalPrice,
            markupApplied: markupPercent,
            breakup: responseBreakup
        });

    } catch (error) {
        console.error("estimatePrice error:", error);
        res.status(500).json({ message: 'Failed to estimate price', error: error.message || error });
    }
};

exports.createPtlBooking = async (req, res) => {
    try {
        let payloadData = req.body;
        // Parse payload if it's sent as multipart form-data string
        if (req.body.payload) {
            payloadData = JSON.parse(req.body.payload);
        }
        
        const {
            origin_pin, dest_pin, weight_g, dimensions, 
            pickup_address, drop_address, pickup_details, drop_details, billing_details, gstin, payment_mode, cod_amount,
            basePrice, finalPrice, order_details, vendor_markup_fee, gst_amount, total_amount,
            freight_mode, rov_insurance, fm_pickup
        } = payloadData;

        let currentUser = req.user;
        let isGuest = false;
        
        // Fetch full user details if token was provided (to get the role)
        if (currentUser && currentUser.id) {
            const dbUser = await User.findById(currentUser.id);
            if (dbUser) {
                currentUser = { id: dbUser._id, role: dbUser.role };
            }
        }

        // Auto-create user if guest
        if (!currentUser) {
            isGuest = true;
            const contactEmail = billing_details?.email || pickup_details?.email;
            const contactMobile = billing_details?.mobile || pickup_details?.mobile;
            const contactName = billing_details?.contactName || pickup_details?.contactName || 'Guest User';
            const companyName = billing_details?.facilityName || pickup_details?.facilityName || '';

            if (contactEmail && contactMobile) {
                // Check if user already exists
                let existingUser = await User.findOne({ email: contactEmail.toLowerCase() });
                if (!existingUser) {
                    const randomPassword = Math.random().toString(36).slice(-8);
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(randomPassword, salt);
                    existingUser = await User.create({
                        name: contactName,
                        email: contactEmail.toLowerCase(),
                        phone: contactMobile,
                        password: hashedPassword,
                        role: 'customer',
                        company: companyName
                    });
                    console.log(`Auto-created user ${contactEmail} with password ${randomPassword}`);
                }
                currentUser = { id: existingUser._id, role: existingUser.role };
            }
        }

        const booking = new PtlBooking({
            user_id: currentUser ? currentUser.id : null,
            user_model: currentUser ? (currentUser.role === 'vendor' ? 'Vendor' : 'User') : null,
            user_role: currentUser ? currentUser.role : 'guest',
            origin_pin,
            dest_pin,
            pickup_address,
            drop_address,
            weight_g,
            dimensions,
            payment_mode,
            cod_amount,
            base_price: basePrice,
            charged_price: finalPrice,
            vendor_markup_fee: vendor_markup_fee || 0,
            gst_amount: gst_amount || 0,
            total_amount: total_amount || finalPrice,
            order_details: order_details || {},
            delhivery_status: 'PENDING'
        });

        const resolvedGst = billing_details?.gstin || gstin;
        const resolvedPan = billing_details?.pan;

        // Use a deterministic warehouse name based on PAN/GST or User ID so we can reuse it
        const uniqueId = resolvedGst || resolvedPan || req.user?.id || Date.now();
        let dynamicWarehouseName = `WH-${uniqueId}`.substring(0, 40); // Keep it under limits

        // Save it to the booking model so we can use it later for pickup requests
        booking.client_warehouse_name = dynamicWarehouseName;

        const warehousePayload = {
            name: dynamicWarehouseName,
            pin_code: origin_pin,
            city: pickup_details?.city || "New Delhi",
            state: pickup_details?.state || "Delhi",
            country: "India",
            address_details: {
                address: pickup_details?.addressLine || pickup_address || "Test Pickup Address",
                contact_person: pickup_details?.contactName || "Test Contact",
                phone_number: pickup_details?.mobile || "9999999999",
                email: pickup_details?.email || "test@logisticscanner.com"
            },
            same_as_fwd_add: true,
            billing_details: {
                legal_address: {
                    same_as_physical_address: true,
                    pin_code: origin_pin
                }
            }
        };

        if (resolvedGst) {
            warehousePayload.billing_details.gst_number = resolvedGst;
        } else if (resolvedPan) {
            warehousePayload.billing_details.pan_number = resolvedPan;
        } else {
            // Fallback
            warehousePayload.billing_details.gst_number = "07AAAAA0000A1Z5";
        }

        try {
            await delhiveryService.createWarehouse(warehousePayload);
        } catch (whError) {
            console.warn("Warehouse Creation returned an error:", whError);
            let errorMessage = whError?.error?.message || "";
            if (Array.isArray(errorMessage)) errorMessage = errorMessage[0] || "";
            
            if (typeof errorMessage === 'string' && (errorMessage.includes("already exists") || errorMessage.includes("CLIENT_STORES_CREATE"))) {
                console.log("Warehouse already exists, reusing it:", dynamicWarehouseName);
                // Proceed normally
            } else if (typeof errorMessage === 'string' && (errorMessage.includes("Duplicate PAN") || errorMessage.includes("Duplicate GST"))) {
                console.log("Retrying warehouse creation with a fallback generated PAN to bypass collision...");
                const randomDigits = Math.floor(1000 + Math.random() * 9000);
                const fallbackPan = `ABCPA${randomDigits}K`; // More realistic valid PAN structure
                
                warehousePayload.name = `WH-FB-${Date.now()}`;
                dynamicWarehouseName = warehousePayload.name; // Update the variable used in manifest
                booking.client_warehouse_name = dynamicWarehouseName; // Update booking too
                
                warehousePayload.billing_details.pan_number = fallbackPan;
                delete warehousePayload.billing_details.gst_number; // remove gst to avoid conflict
                
                try {
                    await delhiveryService.createWarehouse(warehousePayload);
                } catch (retryError) {
                    console.error("Retry Warehouse Creation Failed:", retryError);
                    return res.status(400).json({ success: false, message: "Failed to register pickup location even after retry." });
                }
            } else {
                return res.status(400).json({ success: false, message: "Failed to register pickup location with Delhivery." });
            }
        }

        console.log("Waiting 3 seconds for Delhivery FAAS to sync the new warehouse...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 2. Prepare Manifest Payload for Delhivery B2B LTL API
        // According to the new B2B API Document, the payload is different from B2C
        const manifestPayload = {
            pickup_location_name: dynamicWarehouseName,
            payment_mode: payment_mode === "cod" ? "cod" : "prepaid",
            cod_amount: payment_mode === "cod" ? parseFloat(cod_amount) : 0,
            weight: weight_g, // in grams
            rov_insurance: rov_insurance !== undefined ? rov_insurance : false,
            dropoff_location: {
                consignee_name: drop_details?.contactName || drop_details?.facilityName || "Test Consignee",
                address: drop_details?.addressLine || drop_address || "Test Drop Address",
                city: drop_details?.city || "Unknown City",
                state: drop_details?.state || "Unknown State",
                zip: dest_pin,
                phone: drop_details?.mobile || "9999999999"
            },
            shipment_details: [
                {
                    order_id: order_details?.reference_id || `ORD-${Date.now()}`,
                    box_count: dimensions ? dimensions.reduce((acc, d) => acc + (d.box_count || 1), 0) : 1,
                    description: order_details?.description || "General Goods"
                }
            ],
            dimensions: dimensions ? dimensions.map(d => ({
                length: d.length_cm,
                width: d.width_cm,
                height: d.height_cm,
                box_count: d.box_count
            })) : [],
            freight_mode: freight_mode === "fod" ? "fod" : "fop", // strictly fop or fod as per doc
            ...(payment_mode === "cod" ? { cod_amount: parseFloat(cod_amount) || 0 } : {}),
            billing_address: {
                name: billing_details?.facilityName || pickup_details?.facilityName || "Test Company",
                company: billing_details?.facilityName || pickup_details?.facilityName || "Test Company",
                consignor: billing_details?.contactName || pickup_details?.contactName || "Test Consignor",
                address: billing_details?.addressLine || pickup_details?.addressLine || pickup_address || "Test Pickup Address",
                city: billing_details?.city || pickup_details?.city || "New Delhi",
                state: billing_details?.state || pickup_details?.state || "Delhi",
                pin: billing_details?.pincode || origin_pin,
                phone: billing_details?.mobile || pickup_details?.mobile || "9999999999",
                gstin: billing_details?.gstin || gstin || "07AAAAA0000A1Z5",
                pan: (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(billing_details?.pan)) ? billing_details.pan : 
                     (typeof (billing_details?.gstin || gstin) === 'string' && (billing_details?.gstin || gstin).length >= 12 ? (billing_details?.gstin || gstin).substring(2, 12).toUpperCase() : "AAAAA0000A"),
                gst_number: billing_details?.gstin || gstin || "07AAAAA0000A1Z5",
                pan_number: (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(billing_details?.pan)) ? billing_details.pan : 
                     (typeof (billing_details?.gstin || gstin) === 'string' && (billing_details?.gstin || gstin).length >= 12 ? (billing_details?.gstin || gstin).substring(2, 12).toUpperCase() : "AAAAA0000A")
            },
            fm_pickup: fm_pickup !== undefined ? fm_pickup : true,
            invoices: [
                {
                    inv_num: order_details?.invoice_number || "INV001",
                    inv_amt: order_details?.invoice_amount || cod_amount || 1000
                }
            ]
        };

        // 3. Optional Document Attachment
        if (req.file) {
            // Include document for paperless movement
            manifestPayload.enable_paperless_movement = true;
            // Provide a Blob since axios postForm will natively convert this to a file upload stream
            // Since Blob doesn't carry a filename attribute required by some servers natively until attached to FormData,
            // we will handle the actual file appending differently in delhiveryService if needed.
            // But let's pass an object that delhiveryService can identify as a file:
            manifestPayload.doc_file = {
                buffer: req.file.buffer,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype
            };
            
            manifestPayload.doc_data = [
                {
                    doc_type: "INVOICE_COPY",
                    doc_meta: {
                        invoice_num: [order_details?.invoice_number || "INV001"]
                    }
                }
            ];
        }

        console.log("\n=================================");
        console.log("📦 SENDING MANIFEST TO DELHIVERY B2B:");
        console.log(JSON.stringify(manifestPayload, null, 2));
        console.log("=================================\n");

        let delhiveryResponse = null;
        let manifestSuccess = false;
        let attempts = 0;
        let lastManifestError = null;

        while (attempts < 3 && !manifestSuccess) {
            try {
                attempts++;
                const delhiveryService = require('../services/delhiveryService');
                delhiveryResponse = await delhiveryService.createManifest(manifestPayload);
                
                console.log(`\n✅ DELHIVERY MANIFEST ACCEPTED (Attempt ${attempts}):`);
                console.log(JSON.stringify(delhiveryResponse, null, 2));
                console.log("=================================\n");
                
                if (delhiveryResponse.job_id) {
                    booking.delhivery_job_id = delhiveryResponse.job_id;
                    booking.delhivery_status = 'PROCESSING';
                } else if (delhiveryResponse.packages && delhiveryResponse.packages.length > 0) {
                    booking.delhivery_lr_number = delhiveryResponse.packages[0].waybill;
                    booking.delhivery_status = 'BOOKED';
                }
                manifestSuccess = true;
            } catch (manifestError) {
                lastManifestError = manifestError;
                console.error(`\n❌ DELHIVERY MANIFEST REJECTED (Attempt ${attempts}):`);
                console.error(manifestError);
                console.error("=================================\n");
                
                const errString = JSON.stringify(manifestError).toLowerCase();
                
                // Specific check for Wallet / Balance errors
                if (errString.includes("balance") || errString.includes("wallet") || errString.includes("limit")) {
                    console.error("\n⚠️ DELHIVERY WALLET ERROR: Insufficient Balance or Limit Exceeded!");
                    console.error("Please recharge your Delhivery Wallet from the Client Portal.\n");
                    break;
                }
                
                if (errString.includes("faas") || errString.includes("not been configured")) {
                    console.log(`Warehouse FAAS not synced yet. Waiting 5 seconds before retry ${attempts + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    // Break if it's not a FAAS sync error
                    break;
                }
            }
        }

        if (!manifestSuccess) {
            throw new Error(`Delhivery API Error: ${JSON.stringify(lastManifestError)}`);
        }

        await booking.save();

        res.status(201).json({
            success: true,
            message: 'PTL Booking Created Successfully',
            booking,
            delhiveryResponse
        });

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: 'Failed to create booking', error: error.message });
    }
};

exports.checkManifestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await PtlBooking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        if (!booking.delhivery_job_id || booking.delhivery_lr_number) {
            return res.status(400).json({ success: false, message: 'Booking already processed or no job ID found' });
        }
        
        const delhiveryService = require('../services/delhiveryService');
        const statusResponse = await delhiveryService.getManifestStatus(booking.delhivery_job_id);
        
        console.log(`\n🔍 CHECKING MANIFEST STATUS FOR JOB_ID: ${booking.delhivery_job_id}`);
        console.log(JSON.stringify(statusResponse, null, 2));
        console.log("=================================\n");

        if (statusResponse && statusResponse.data) {
            const data = statusResponse.data;
            if ((data.status === 'Complete' || data.status === 'SUCCESS' || data.status === 'Success') && data.lrnum) {
                booking.delhivery_lr_number = data.lrnum;
                booking.delhivery_status = 'BOOKED';
                await booking.save();
                return res.status(200).json({ success: true, message: 'LR Number generated successfully', booking });
            } else if (data.status === 'Processing') {
                return res.status(200).json({ success: true, message: 'Still processing at Delhivery', status: 'Processing' });
            } else {
                // E.g. failed or rejected by Delhivery
                booking.delhivery_status = 'FAILED';
                let reason = 'Manifest generation failed at Delhivery';
                if (data.error) reason = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                else if (data.message) reason = data.message;
                else if (data.remarks) reason = data.remarks;
                booking.failure_reason = reason;
                await booking.save();
                return res.status(400).json({ success: false, message: 'Manifest generation failed at Delhivery', data });
            }
        }
        
        return res.status(400).json({ success: false, message: 'Invalid response from Delhivery' });
    } catch (error) {
        console.error("CHECK MANIFEST ERROR:", error);
        res.status(500).json({ success: false, message: 'Failed to check manifest status', error: error.message });
    }
};

exports.getMyPtlBookings = async (req, res) => {
    try {
        const bookings = await PtlBooking.find({ user_id: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.trackPtlBooking = async (req, res) => {
    try {
        const { lrn } = req.params;
        const trackData = await delhiveryService.trackShipment(lrn);
        res.status(200).json(trackData);
    } catch (error) {
        res.status(500).json({ message: 'Failed to track shipment', error: error.message || error });
    }
};

exports.checkServiceability = async (req, res) => {
    try {
        const { pincode } = req.params;
        const weight = req.query.weight || 1000;
        const delhiveryService = require('../services/delhiveryService');
        const data = await delhiveryService.checkServiceability(pincode, weight);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Failed to check serviceability', error: error.message || error });
    }
};

exports.getAllPtlBookings = async (req, res) => {
    try {
        const bookings = await PtlBooking.find().sort({ createdAt: -1 }).populate('user_id', 'name email role');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.printLabel = async (req, res) => {
    try {
        const { lrn } = req.params;
        const delhiveryService = require('../services/delhiveryService');
        const data = await delhiveryService.getPackingSlip(lrn);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate label', error: error.message || error });
    }
};

exports.cancelPtlBooking = async (req, res) => {
    try {
        const { lrn } = req.params;
        const booking = await PtlBooking.findOne({ delhivery_lr_number: lrn });
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Must be in a cancellable state (e.g. BOOKED, PROCESSING, PENDING)
        const nonCancellableStates = ['CANCELLED', 'DELIVERED', 'RTO', 'DISPATCHED', 'IN TRANSIT'];
        if (nonCancellableStates.includes(booking.delhivery_status.toUpperCase())) {
            return res.status(400).json({ success: false, message: `Cannot cancel booking in ${booking.delhivery_status} state.` });
        }

        const delhiveryService = require('../services/delhiveryService');
        const data = await delhiveryService.cancelShipment(lrn);

        // Update DB
        booking.delhivery_status = 'CANCELLED';
        await booking.save();

        res.status(200).json({ success: true, message: 'Order cancelled successfully', data });
    } catch (error) {
        console.error("Cancel Order Error:", error);
        res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message || error });
    }
};

exports.schedulePickup = async (req, res) => {
    try {
        const { lrn } = req.params;
        const { pickup_date, start_time, expected_package_count } = req.body;
        
        const booking = await PtlBooking.findOne({ delhivery_lr_number: lrn });
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        if (!booking.client_warehouse_name) {
            return res.status(400).json({ success: false, message: 'Client warehouse name not found for this booking. Cannot schedule pickup.' });
        }

        const payload = {
            client_warehouse: booking.client_warehouse_name,
            pickup_date: pickup_date, // "YYYY-MM-DD"
            start_time: start_time,   // "HH:MM:SS"
            expected_package_count: Number(expected_package_count)
        };

        const delhiveryService = require('../services/delhiveryService');
        const data = await delhiveryService.createPickupRequest(payload);

        if (data && data.data && data.data.pickup_id) {
            booking.delhivery_pickup_id = String(data.data.pickup_id);
            await booking.save();
        }

        res.status(200).json({ success: true, message: 'Pickup scheduled successfully', data });
    } catch (error) {
        console.error("Schedule Pickup Error:", error);
        res.status(500).json({ success: false, message: 'Failed to schedule pickup', error: error.message || error });
    }
};
