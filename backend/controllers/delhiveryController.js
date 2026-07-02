const delhiveryService = require('../services/delhiveryService');
const DelhiveryConfig = require('../models/DelhiveryConfig');
const PtlBooking = require('../models/PtlBooking');

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
        const { weight_g, dimensions, source_pin, consignee_pin, payment_mode, cod_amount } = req.body;
        
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
            freight_mode: 'fod',
            rov_insurance: false,
            inv_amount: cod_amount ? parseFloat(cod_amount) : 1000 // invoice amount is mandatory
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
        
        // If user is vendor, use vendor margin. Otherwise (customer or guest), use customer margin.
        if (req.user && req.user.role === 'vendor') {
            markupPercent = config?.vendor_margin_percent || 10;
        } else {
            markupPercent = config?.customer_margin_percent || 20;
        }

        const finalPrice = basePrice + (basePrice * (markupPercent / 100));

        res.status(200).json({
            success: true,
            basePrice,
            finalPrice,
            markupApplied: markupPercent,
            breakup: delhiveryResponse.breakup
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
            pickup_address, drop_address, pickup_details, drop_details, gstin, payment_mode, cod_amount,
            basePrice, finalPrice, order_details
        } = payloadData;

        const booking = new PtlBooking({
            user_id: req.user ? req.user.id : null,
            user_model: req.user ? (req.user.role === 'vendor' ? 'Vendor' : 'User') : null,
            user_role: req.user ? req.user.role : 'guest',
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
            order_details: order_details || {},
            delhivery_status: 'PENDING'
        });

        // 1. Create Warehouse dynamically for the pickup address
        const dynamicWarehouseName = `CUSTWH-${Date.now()}`;
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
                email: pickup_details?.email || ""
            }
        };

        try {
            await delhiveryService.createWarehouse(warehousePayload);
        } catch (whError) {
            console.error("Dynamic Warehouse Creation Failed:", whError);
            return res.status(400).json({ success: false, message: "Failed to register pickup location with Delhivery." });
        }

        // 2. Prepare Manifest Payload for Delhivery B2B LTL API
        // According to the new B2B API Document, the payload is different from B2C
        const manifestPayload = {
            pickup_location_name: dynamicWarehouseName,
            payment_mode: payment_mode === "cod" ? "cod" : "prepaid",
            cod_amount: payment_mode === "cod" ? parseFloat(cod_amount) : 0,
            weight: weight_g, // in grams
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
            freight_mode: "fop", // or fod, mandatory for Retail clients
            billing_address: {
                name: pickup_details?.facilityName || "Test Company",
                company: pickup_details?.facilityName || "Test Company",
                consignor: pickup_details?.contactName || "Test Consignor",
                address: pickup_details?.addressLine || pickup_address || "Test Pickup Address",
                city: pickup_details?.city || "New Delhi",
                state: pickup_details?.state || "Delhi",
                pin: origin_pin,
                phone: pickup_details?.mobile || "9999999999",
                gstin: gstin || "07AAAAA0000A1Z5",
                pan: gstin || "07AAAAA0000A1Z5", // Fallback mapping for Delhivery validation bug
                gst_number: gstin || "07AAAAA0000A1Z5",
                pan_number: gstin || "07AAAAA0000A1Z5"
            },
            fm_pickup: true, // Mandatory for retail client
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
        try {
            const delhiveryService = require('../services/delhiveryService');
            // Ensure delhiveryService.createManifest sends as JSON or form-data appropriately
            delhiveryResponse = await delhiveryService.createManifest(manifestPayload);
            
            console.log("\n✅ DELHIVERY MANIFEST ACCEPTED:");
            console.log(JSON.stringify(delhiveryResponse, null, 2));
            console.log("=================================\n");
            
            // Save waybill and job id if returned
            if (delhiveryResponse.packages && delhiveryResponse.packages.length > 0) {
                booking.delhivery_lr_number = delhiveryResponse.packages[0].waybill;
                booking.delhivery_status = 'BOOKED';
            }
        } catch (manifestError) {
            console.error("\n❌ DELHIVERY MANIFEST REJECTED:");
            console.error(manifestError);
            console.error("=================================\n");
            // We can choose to fail the whole process, or just save locally as failed
            throw new Error(`Delhivery API Error: ${JSON.stringify(manifestError)}`);
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
