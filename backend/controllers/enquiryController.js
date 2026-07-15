const Enquiry = require('../models/Enquiry');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Create a new enquiry
exports.createEnquiry = async (req, res) => {
    try {
        const {
            vendor,
            fromLocation,
            toLocation,
            type,
            category,
            airline,
            weightRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            fclUnit,
            cbmRange,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            length,
            width,
            height,
            unit,
            quantity,
            handlingType,
            additionalServices,
            deliverySpeed,
            price,
            targetPrice,
            isDirect,
            isBooking,
            excludedVendor,
            clientCreditRequired,
            guestName,
            guestEmail,
            guestPhone,
            guestCompany,
            commodity,
            message,
            attachment
        } = req.body;

        // Check for optional token
        let clientId = null;
        const authHeader = req.header("Authorization");
        if (authHeader) {
            try {
                const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                clientId = decoded.id;
            } catch (err) {
                // Ignore token error, treat as guest
            }
        }

        // Validate client and vendor ObjectIds
        let validatedClientId = (clientId && mongoose.Types.ObjectId.isValid(clientId)) ? clientId : null;
        const validatedVendorId = (vendor && mongoose.Types.ObjectId.isValid(vendor)) ? vendor : null;
        const validatedExcludedVendorId = (excludedVendor && mongoose.Types.ObjectId.isValid(excludedVendor)) ? excludedVendor : null;

        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const { sendGuestAccountCreatedEmail } = require('../services/notificationService');

        // Check customer enquiry limits if logged in
        if (validatedClientId) {
            const userObj = await User.findById(validatedClientId);
            const hasActivePlan = userObj && userObj.activePlan && userObj.planEndDate && new Date(userObj.planEndDate) > new Date();

            if (!hasActivePlan) {
                const count = await Enquiry.countDocuments({ client: validatedClientId });
                if (count >= 5) {
                    return res.status(403).json({
                        message: 'You have reached the limit of 5 free enquiries. Please upgrade your plan to continue.'
                    });
                }
            }
        } else if (guestEmail) {
            // Check if user already exists
            let guestUser = await User.findOne({ email: guestEmail.toLowerCase() });

            if (!guestUser) {
                // Create a new customer account automatically
                const generatedPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(generatedPassword, salt);

                guestUser = await User.create({
                    name: guestName || 'Guest User',
                    email: guestEmail.toLowerCase(),
                    phone: guestPhone || '',
                    password: hashedPassword,
                    role: 'customer',
                    company: guestCompany || '',
                    isVerified: true // Auto-verify so they can login directly
                });

                // Send email with credentials (run in background)
                sendGuestAccountCreatedEmail(guestEmail, guestName, generatedPassword)
                    .catch(err => console.error('Error sending guest account email:', err));
            }

            // Link the enquiry to this user
            validatedClientId = guestUser._id;
        }

        // Auto-correct isBooking if the client is a vendor (helps when they created it as a guest)
        let finalIsBooking = isBooking || false;
        if (validatedClientId) {
            const clientUser = await User.findById(validatedClientId);
            if (clientUser && clientUser.role === 'vendor') {
                finalIsBooking = true;
            }
        }

        // Sanitize type and category to avoid validation errors
        const sanitizedType = (type && ['air', 'sea', 'land', 'warehouse', 'cha'].includes(type.toLowerCase())) ? type.toLowerCase() : 'air';
        const sanitizedCategory = (category && ['domestic', 'international'].includes(category.toLowerCase())) ? category.toLowerCase() : 'domestic';

        const enquiry = await Enquiry.create({
            client: validatedClientId,
            vendor: validatedVendorId,
            fromLocation,
            toLocation,
            type: sanitizedType,
            category: sanitizedCategory,
            airline,
            weightRange,
            truckLoad,
            vehicleType,
            seaLoadType,
            fclStandard,
            fclUnit,
            cbmRange,
            warehouseRateType,
            warehouseStorageType,
            chaServiceType,
            chaCargoType,
            length,
            width,
            height,
            unit,
            quantity,
            handlingType,
            additionalServices,
            deliverySpeed,
            price,
            targetPrice: targetPrice || null,
            isDirect: isDirect || false,
            isBooking: finalIsBooking,
            excludedVendor: validatedExcludedVendorId,
            clientCreditRequired: clientCreditRequired || false,
            guestName: guestName || '',
            guestEmail: guestEmail || '',
            guestPhone: guestPhone || '',
            guestCompany: guestCompany || '',
            commodity: commodity || '',
            message: message || '',
            attachment: attachment || '',
            status: 'Pending'
        });

        // Notifications
        const { sendAdminNotification } = require('../utils/notificationService');
        await sendAdminNotification(`New ${isBooking ? 'Booking' : 'Enquiry'} received from ${fromLocation} to ${toLocation}`, 'info', '/admin/enquiry-management');

        let customerEmail = guestEmail;
        if (validatedClientId) {
            const User = require('../models/User');
            const clientUser = await User.findById(validatedClientId);
            if (clientUser) customerEmail = clientUser.email;
        }

        const { sendEnquiryToVendorAlert, sendEnquiryCustomerConfirmation } = require('../services/notificationService');

        if (customerEmail) {
            sendEnquiryCustomerConfirmation(customerEmail, {
                cargoType: sanitizedType,
                pickupCity: fromLocation,
                destinationCity: toLocation
            }).catch(err => console.error('Error sending customer confirmation email:', err));
        }

        if (validatedVendorId) {
            const { sendNotification } = require('../utils/notificationService');

            // Send In-App Notification to Vendor (Bell Notification)
            sendNotification(
                validatedVendorId,
                `New direct ${isBooking ? 'booking' : 'enquiry'} received for ${sanitizedType} freight from ${fromLocation} to ${toLocation}`,
                'info',
                isBooking ? '/vendor/my-bookings' : '/vendor/my-enquiries'
            ).catch(err => console.error('Error sending vendor bell notification:', err));

            const User = require('../models/User');
            User.findById(validatedVendorId).then(vendorUser => {
                if (vendorUser) {
                    sendEnquiryToVendorAlert(vendorUser.email, {
                        cargoType: sanitizedType,
                        pickupCity: fromLocation,
                        destinationCity: toLocation,
                        weight: weightRange || 'N/A',
                        volume: 'N/A'
                    }).catch(err => console.error('Error sending vendor email:', err));

                    if (vendorUser.phone) {
                        const { sendNewEnquiryVendorWhatsApp } = require('../services/whatsappService');
                        const vendorName = vendorUser.company || vendorUser.name || 'Vendor';
                        sendNewEnquiryVendorWhatsApp(vendorUser.phone, {
                            cargoType: sanitizedType,
                            pickupCity: fromLocation,
                            destinationCity: toLocation
                        }, vendorName, vendorUser.country || '')
                        .catch(err => console.error('Error sending vendor new enquiry WhatsApp:', err));
                    }
                }
            }).catch(err => console.error('Error looking up vendor user for email:', err));
        } else if (isDirect) {
            // This is a marketplace broadcast enquiry
            const { broadcastVendorNotification } = require('../utils/notificationService');
            broadcastVendorNotification(
                `New marketplace ${isBooking ? 'booking' : 'enquiry'} broadcasted for ${sanitizedType} freight from ${fromLocation} to ${toLocation}`,
                'info',
                isBooking ? '/vendor/direct-booking' : '/vendor/direct-enquiries',
                sanitizedType
            ).catch(err => console.error('Error broadcasting vendor bell notification:', err));

            // Also broadcast emails to eligible vendors
            const User = require('../models/User');
            const query = { role: 'vendor', verificationStatus: 'Approved' };

            User.find(query).populate('activePlan').then(vendors => {
                const { sendNewEnquiryVendorWhatsApp } = require('../services/whatsappService');
                vendors.forEach(vendorUser => {
                    // Check if vendor has an active paid plan
                    const hasActivePlan = vendorUser.activePlan && vendorUser.planEndDate && new Date(vendorUser.planEndDate) > new Date();
                    const isPaidPlan = hasActivePlan && vendorUser.activePlan.price > 0;

                    if (isPaidPlan) {
                        if (vendorUser.email) {
                            sendEnquiryToVendorAlert(vendorUser.email, {
                                cargoType: sanitizedType,
                                pickupCity: fromLocation,
                                destinationCity: toLocation,
                                weight: weightRange || 'N/A',
                                volume: 'N/A'
                            }).catch(err => console.error('Error sending broadcast email to paid vendor:', err));
                        }
                        
                        if (vendorUser.phone) {
                            const vendorName = vendorUser.company || vendorUser.name || 'Vendor';
                            sendNewEnquiryVendorWhatsApp(vendorUser.phone, {
                                cargoType: sanitizedType,
                                pickupCity: fromLocation,
                                destinationCity: toLocation
                            }, vendorName, vendorUser.country || '')
                            .catch(err => console.error('Error sending broadcast WhatsApp to paid vendor:', err));
                        }
                    }
                });
            }).catch(err => console.error('Error looking up vendors for broadcast email:', err));
        }

        res.status(201).json(enquiry);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get enquiries for the vendor
exports.getVendorEnquiries = async (req, res) => {
    try {
        const User = require('../models/User');
        const isAdmin = req.user.id === 'ad0000000000000000000000';
        let currentUser = null;
        let hasActivePlan = true;

        if (isAdmin) {
            currentUser = {
                verificationStatus: 'Approved',
                isVerified: true,
                role: 'admin'
            };
        } else {
            currentUser = await User.findById(req.user.id).populate('activePlan');
            if (!currentUser || (currentUser.verificationStatus !== 'Approved' && currentUser.verificationStatus !== 'Pre Approved' && currentUser.role === 'vendor')) {
                return res.json([]); // Return empty list of leads if vendor is not approved
            }
            hasActivePlan = currentUser.activePlan && currentUser.planEndDate && new Date(currentUser.planEndDate) > new Date();
        }

        const { type } = req.query; // 'my', 'direct', or 'b2b'
        if (type !== 'my' && type !== 'direct' && type !== 'b2b') {
            return res.status(400).json({ message: 'Valid enquiry type ("my", "direct" or "b2b") is required' });
        }

        const isPaidPlan = hasActivePlan && currentUser.activePlan && currentUser.activePlan.price > 0;

        if (type === 'b2b' && !isPaidPlan) {
            return res.status(403).json({ message: 'Your current plan is not access b2b enquiry please upgrade your plan to see b2b enquiry' });
        }

        const isBookingFilter = req.query.isBooking === 'true';
        let query = {};

        if (!isAdmin) {
            if (isBookingFilter) {
                // Bookings initiated by the current vendor (acting as client)
                query = {
                    client: req.user.id
                };
                if (type === 'direct' || type === 'b2b') {
                    query.isDirect = true;
                } else if (type === 'my') {
                    query.isDirect = false;
                }
            } else {
                // Enquiries received by the current vendor (acting as provider)
                if (type === 'my') {
                    query = {
                        vendor: req.user.id,
                        isDirect: false
                    };
                } else if (type === 'direct') {
                    const customerIds = await User.find({ role: 'customer' }).distinct('_id');
                    query = {
                        isDirect: true,
                        $or: [
                            { client: { $in: customerIds } },
                            { type: 'land', client: { $ne: req.user.id } } // Includes 'land' enquiries created by vendors
                        ]
                    };
                } else if (type === 'b2b') {
                    const vendorIds = await User.find({ role: 'vendor' }).distinct('_id');
                    query = {
                        isDirect: true,
                        client: { $in: vendorIds, $ne: req.user.id }
                    };
                }
            }
        } else {
            // Admin queries
            if (type === 'my') {
                query = { isDirect: false, isBooking: isBookingFilter };
            } else if (type === 'direct' || type === 'b2b') {
                query = { isDirect: true, isBooking: isBookingFilter };
            }
        }

        // Apply vendor filter date/service logic for direct incoming enquiries
        if (!isAdmin && (type === 'direct' || type === 'b2b') && !isBookingFilter && currentUser) {
            // Filter by creation date relative to user approval/creation
            if (currentUser.approvedAt) {
                query.createdAt = { $gte: currentUser.approvedAt };
            } else if (currentUser.createdAt) {
                query.createdAt = { $gte: currentUser.createdAt };
            }

            // Filter by service types if specified
            if (currentUser.services && currentUser.services.length > 0) {
                const mappedServices = currentUser.services.map(s => s.toLowerCase().trim());
                query.type = { $in: mappedServices };
            }
        }

        // Apply Search Filter
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { fromLocation: searchRegex },
                { toLocation: searchRegex },
                { commodity: searchRegex },
                { type: searchRegex },
                { guestName: searchRegex },
                { guestCompany: searchRegex }
            ];
        }

        // Apply Mode Filter
        if (req.query.mode && req.query.mode !== 'all') {
            const requestedMode = req.query.mode.toLowerCase().trim();
            if (query.type && query.type.$in) {
                if (query.type.$in.includes(requestedMode)) {
                    query.type = requestedMode;
                } else {
                    query.type = 'invalid_mode_no_results';
                }
            } else {
                query.type = requestedMode;
            }
        }

        // Apply Date Filter
        if (req.query.filter && req.query.filter !== 'all') {
            const filter = req.query.filter;
            const today = new Date();

            if (filter === '7days') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);

                if (query.createdAt && query.createdAt.$gte) {
                    query.createdAt.$gte = new Date(Math.max(sevenDaysAgo, query.createdAt.$gte));
                } else {
                    query.createdAt = { ...query.createdAt, $gte: sevenDaysAgo };
                }
            } else if (filter === '15days') {
                const fifteenDaysAgo = new Date(today);
                fifteenDaysAgo.setDate(today.getDate() - 15);

                if (query.createdAt && query.createdAt.$gte) {
                    query.createdAt.$gte = new Date(Math.max(fifteenDaysAgo, query.createdAt.$gte));
                } else {
                    query.createdAt = { ...query.createdAt, $gte: fifteenDaysAgo };
                }
            } else if (filter === 'thismonth') {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                if (query.createdAt && query.createdAt.$gte) {
                    query.createdAt.$gte = new Date(Math.max(startOfMonth, query.createdAt.$gte));
                } else {
                    query.createdAt = { ...query.createdAt, $gte: startOfMonth };
                }
            } else if (/^\d{4}-\d{2}$/.test(filter)) { // YYYY-MM
                const [year, month] = filter.split('-');
                const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

                if (query.createdAt && query.createdAt.$gte) {
                    query.createdAt.$gte = new Date(Math.max(startOfMonth, query.createdAt.$gte));
                    query.createdAt.$lte = endOfMonth;
                } else {
                    query.createdAt = { ...query.createdAt, $gte: startOfMonth, $lte: endOfMonth };
                }
            }
        }

        // Apply Status Filter
        if (req.query.status && req.query.status !== 'all') {
            const statusFilter = req.query.status;
            if (type === 'my' || isAdmin) {
                if (statusFilter === 'accepted') {
                    query.status = 'Accepted';
                } else if (statusFilter === 'not_accepted') {
                    query.status = { $ne: 'Accepted' };
                }
            } else if (type === 'direct' || type === 'b2b') {
                if (statusFilter === 'accepted') {
                    query.responses = { $elemMatch: { vendor: req.user.id, status: 'Accepted' } };
                } else if (statusFilter === 'not_accepted') {
                    query.responses = { $not: { $elemMatch: { vendor: req.user.id, status: 'Accepted' } } };
                }
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;



        const totalCount = await Enquiry.countDocuments(query);
        const enquiries = await Enquiry.find(query)
            .populate({
                path: 'client',
                select: 'name email phone company role activePlan planEndDate',
                populate: { path: 'activePlan' }
            })
            .populate({
                path: 'vendor',
                select: 'name email phone company role activePlan planEndDate',
                populate: { path: 'activePlan' }
            })
            .populate({
                path: 'responses.vendor',
                select: 'name email phone company role activePlan planEndDate',
                populate: { path: 'activePlan' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        let results = enquiries.map(enq => {
            const enqObj = enq;
            if ((type === 'direct' || type === 'b2b') && enq.responses && enq.responses.length > 0 && !isAdmin) {
                const myResponse = enq.responses.find(r => {
                    if (!r.vendor) return false;
                    const vId = r.vendor._id ? r.vendor._id.toString() : r.vendor.toString();
                    return vId.toString() === req.user.id.toString();
                });

                if (myResponse) {
                    enqObj.myResponse = myResponse;
                }
            }
            return enqObj;
        });

        let isLimitReached = false;
        if (!isAdmin && currentUser) {
            let inquiryLimit = 5;
            if (hasActivePlan && currentUser.activePlan && currentUser.activePlan.inquiryLimit) {
                inquiryLimit = currentUser.activePlan.inquiryLimit;
            }
            if (!currentUser.topupPlanEndDate || new Date(currentUser.topupPlanEndDate) > new Date()) {
                inquiryLimit += (currentUser.topupEnquiryLimit || 0);
            }

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const acceptedCount = await Enquiry.countDocuments({
                $or: [
                    { vendor: req.user.id, status: 'Accepted', createdAt: { $gte: startOfMonth } },
                    { 'responses': { $elemMatch: { vendor: req.user.id, status: 'Accepted' } }, createdAt: { $gte: startOfMonth } }
                ]
            });


            if (acceptedCount >= inquiryLimit) {
                isLimitReached = true;
                res.setHeader('X-Limit-Reached', 'true');
                res.setHeader('Access-Control-Expose-Headers', 'X-Limit-Reached');
            }
        }

        // Direct listings do not need vendor's own price enrichment
        if (type === 'direct') {
            return res.json({
                data: results,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount
            });
        }

        res.json({
            data: results,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        const fs = require('fs');
        fs.appendFileSync('error.log', `\n[${new Date().toISOString()}] getVendorEnquiries ERROR: ${error.stack}\n`);
        console.error('getVendorEnquiries ERROR:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update status of enquiry (Accept/Decline/Quote)
exports.updateEnquiryStatus = async (req, res) => {
    try {
        const { status, price, quoteDetails } = req.body;
        if (status && !['Accepted', 'Declined', 'Pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        let wasAlreadyAcceptedByThisVendor = false;
        if (enquiry.status === 'Accepted' && enquiry.vendor && enquiry.vendor.toString() === req.user.id) {
            wasAlreadyAcceptedByThisVendor = true;
        }
        const existingResponseForCheck = enquiry.responses.find(r => r.vendor && r.vendor.toString() === req.user.id);
        if (existingResponseForCheck && existingResponseForCheck.status === 'Accepted') {
            wasAlreadyAcceptedByThisVendor = true;
        }

        // --- Monthly Limit Check for Vendors ---
        if (['Accepted', 'Quoted'].includes(status) && (!enquiry.client || enquiry.client.toString() !== req.user.id)) {
            const User = require('../models/User');
            const vendorUser = await User.findById(req.user.id).populate('activePlan');
            const hasActivePlan = vendorUser && vendorUser.activePlan && vendorUser.planEndDate && new Date(vendorUser.planEndDate) > new Date();

            let inquiryLimit = 5;
            if (hasActivePlan && vendorUser.activePlan && vendorUser.activePlan.inquiryLimit) {
                inquiryLimit = vendorUser.activePlan.inquiryLimit;
            }

            // Add top-up limit if active (or if manually granted without an expiry date)
            if (!vendorUser.topupPlanEndDate || new Date(vendorUser.topupPlanEndDate) > new Date()) {
                inquiryLimit += (vendorUser.topupEnquiryLimit || 0);
            }

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            let alreadyRespondedThis = false;
            if (enquiry.vendor && enquiry.vendor.toString() === req.user.id && ['Accepted', 'Quoted'].includes(enquiry.status)) {
                alreadyRespondedThis = true;
            }
            const existing = enquiry.responses.find(r => r.vendor && r.vendor.toString() === req.user.id);
            if (existing) alreadyRespondedThis = true;

            if (!alreadyRespondedThis) {
                const vendorObjectId = new mongoose.Types.ObjectId(req.user.id);
                const acceptedCount = await Enquiry.countDocuments({
                    $or: [
                        { vendor: vendorObjectId, status: { $in: ['Accepted', 'Quoted'] }, updatedAt: { $gte: startOfMonth } },
                        { 'responses': { $elemMatch: { vendor: vendorObjectId, status: { $in: ['Accepted', 'Quoted'] }, createdAt: { $gte: startOfMonth } } } }
                    ]
                });

                if (acceptedCount >= inquiryLimit) {
                    return res.status(403).json({
                        message: `Monthly limit reached. You can only accept/quote ${inquiryLimit} enquiries per month on your current plan. Please upgrade your plan.`
                    });
                }
            }
        }
        // ----------------------------------------

        // If the logged-in user is the client (initiator) of the booking/enquiry
        if (enquiry.client && enquiry.client.toString() === req.user.id) {
            const { targetVendorId } = req.body;
            if (status === 'Accepted' && targetVendorId) {
                const response = enquiry.responses.find(r => r.vendor.toString() === targetVendorId);
                if (response) {
                    response.status = 'Accepted';
                    enquiry.status = 'Accepted';
                    enquiry.vendor = targetVendorId;
                    enquiry.price = response.price;
                    enquiry.quoteDetails = response.quoteDetails;

                    // Set other responses to Declined
                    enquiry.responses.forEach(r => {
                        if (r.vendor.toString() !== targetVendorId) {
                            r.status = 'Declined';
                        }
                    });
                } else {
                    return res.status(400).json({ message: 'Target vendor response not found' });
                }
            } else if (status) {
                enquiry.status = status;
            }
        } else if (enquiry.isDirect && status === 'Accepted') {
            // Push to responses instead of modifying global state
            const existingResponse = enquiry.responses.find(r => {
                if (!r.vendor) return false;
                const vId = r.vendor._id ? r.vendor._id.toString() : r.vendor.toString();
                return vId === req.user.id;
            });
            if (existingResponse) {
                existingResponse.status = status;
                if (price !== undefined && price !== null) existingResponse.price = price;
                if (quoteDetails !== undefined) existingResponse.quoteDetails = quoteDetails;
            } else {
                enquiry.responses.push({
                    vendor: req.user.id,
                    price: price !== undefined ? price : null,
                    quoteDetails: quoteDetails || null,
                    status: status
                });
            }
        } else if (!enquiry.isDirect) {
            if (enquiry.vendor && enquiry.vendor.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized status update' });
            }
            if (status) {
                enquiry.status = status;
            }
            if (price !== undefined && price !== null) {
                enquiry.price = price;
            }
            if (quoteDetails !== undefined) {
                enquiry.quoteDetails = quoteDetails;
            }
        }

        await enquiry.save();

        // Notification for Acceptance
        if (status === 'Accepted' && !wasAlreadyAcceptedByThisVendor) {
            const User = require('../models/User');
            const vendorUser = await User.findById(req.user.id);
            let customerEmail = enquiry.guestEmail;
            let customerPhone = enquiry.guestPhone;
            let customerCountry = '';
            let customerName = enquiry.guestName || 'Customer';

            if (enquiry.client) {
                const clientUser = await User.findById(enquiry.client);
                if (clientUser) {
                    customerEmail = clientUser.email;
                    customerPhone = clientUser.phone;
                    customerCountry = clientUser.country || '';
                    
                    let fullName = '';
                    if (clientUser.firstName || clientUser.lastName) {
                        fullName = `${clientUser.firstName || ''} ${clientUser.lastName || ''}`.trim();
                    }
                    customerName = clientUser.company || fullName || clientUser.name || 'Customer';
                }
            }

            const vendorName = vendorUser ? (vendorUser.company || vendorUser.name || 'a Vendor') : 'a Vendor';

            if (customerEmail && vendorUser) {
                const { sendEnquiryAcceptedCustomerAlert } = require('../services/notificationService');
                await sendEnquiryAcceptedCustomerAlert(customerEmail, vendorUser.name || vendorUser.company || 'Vendor', {
                    cargoType: enquiry.type,
                });
            }

            if (customerPhone) {
                const { sendEnquiryAcceptedWhatsApp } = require('../services/whatsappService');
                const enquiryDetails = {
                    cargoType: enquiry.type,
                    pickupCity: enquiry.fromLocation,
                    destinationCity: enquiry.toLocation
                };
                // Send WhatsApp asynchronously
                sendEnquiryAcceptedWhatsApp(customerPhone, enquiryDetails, vendorName, customerCountry, customerName)
                    .catch(err => console.error('Error sending WhatsApp on accept:', err));
            }
        }

        res.json(enquiry);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get enquiries for the client/customer
exports.getClientEnquiries = async (req, res) => {
    try {
        const isAdmin = req.user.id === 'ad0000000000000000000000';
        const { type, search, filter, page: pageQuery, limit: limitQuery } = req.query; // 'my' or 'direct'
        let query = {};

        if (!isAdmin) {
            query.client = req.user.id;
        }

        if (type === 'my') {
            query.isDirect = false;
        } else if (type === 'direct') {
            query.isDirect = true;
        }

        if (filter === '7days' || filter === '15days') {
            const days = filter === '7days' ? 7 : 15;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - days);
            query.createdAt = { $gte: pastDate };
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { fromLocation: searchRegex },
                { toLocation: searchRegex },
                { commodity: searchRegex },
                { type: searchRegex }
            ];
        }

        const page = parseInt(pageQuery) || 1;
        const limit = parseInt(limitQuery) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await Enquiry.countDocuments(query);
        const enquiries = await Enquiry.find(query)
            .populate({
                path: 'vendor',
                select: 'name email phone company role activePlan planEndDate',
                populate: { path: 'activePlan' }
            })
            .populate({
                path: 'responses.vendor',
                select: 'name email phone company role activePlan planEndDate',
                populate: { path: 'activePlan' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            data: enquiries,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get stats for Vendor Dashboard efficiently
// Get stats for Vendor Dashboard efficiently
exports.getVendorStats = async (req, res) => {
    try {
        const isAdmin = req.user.id === 'ad0000000000000000000000';
        let currentUser = null;

        if (isAdmin) {
            currentUser = { role: 'admin' };
        } else {
            const User = require('../models/User');
            currentUser = await User.findById(req.user.id);
            if (!currentUser || (currentUser.verificationStatus !== 'Approved' && currentUser.verificationStatus !== 'Pre Approved' && currentUser.role === 'vendor')) {
                return res.json({
                    myEnquiries: { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 },
                    directEnquiries: { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 },
                    myBookings: { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 },
                    directBookings: { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 }
                });
            }
        }

        const buildQuery = (type, isBookingFilter) => {
            let query = {};
            if (!isAdmin) {
                if (isBookingFilter) {
                    query = { client: new mongoose.Types.ObjectId(req.user.id), isBooking: true, isDirect: type === 'direct' };
                } else {
                    if (type === 'my') {
                        query = { vendor: new mongoose.Types.ObjectId(req.user.id), isDirect: false };
                    } else {
                        query = { isDirect: true, client: { $ne: new mongoose.Types.ObjectId(req.user.id) } };
                    }
                }
            } else {
                query = { isDirect: type === 'direct', isBooking: isBookingFilter };
            }

            if (!isAdmin && type === 'direct' && !isBookingFilter && currentUser) {
                if (currentUser.approvedAt) {
                    query.createdAt = { $gte: currentUser.approvedAt };
                } else if (currentUser.createdAt) {
                    query.createdAt = { $gte: currentUser.createdAt };
                }
                if (currentUser.services && currentUser.services.length > 0) {
                    const mappedServices = currentUser.services.map(s => s.toLowerCase().trim());
                    query.type = { $in: mappedServices };
                }
            }

            // Date filter moved to individual pipeline stages to separate 'Total' (createdAt) and 'Accepted' (action date).
            return query;
        };

        let startDate = null;
        let endDate = null;
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
            endDate.setHours(23, 59, 59, 999);
        }

        const enqPipeline = (query, type) => [
            { $match: query },
            {
                $project: {
                    isLocked: 1,
                    isDirect: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    myResponse: {
                        $cond: {
                            if: { $eq: [isAdmin, false] },
                            then: {
                                $first: {
                                    $filter: {
                                        input: { $ifNull: ["$responses", []] },
                                        as: "r",
                                        cond: { $eq: ["$$r.vendor", new mongoose.Types.ObjectId(req.user.id)] }
                                    }
                                }
                            },
                            else: null
                        }
                    }
                }
            },
            {
                $project: {
                    isLocked: 1,
                    isDirect: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    myResponse: 1,
                    isMyResponseAccepted: {
                        $cond: {
                            if: { $eq: [isAdmin, false] },
                            then: {
                                $cond: {
                                    if: { $eq: ["$isDirect", true] },
                                    then: { $eq: ["$myResponse.status", "Accepted"] },
                                    else: { $eq: ["$status", "Accepted"] }
                                }
                            },
                            else: { $eq: ["$status", "Accepted"] }
                        }
                    },
                    isMyResponseDeclined: {
                        $cond: {
                            if: { $eq: [isAdmin, false] },
                            then: {
                                $cond: {
                                    if: { $eq: ["$isDirect", true] },
                                    then: { $eq: ["$myResponse.status", "Declined"] },
                                    else: { $eq: ["$status", "Declined"] }
                                }
                            },
                            else: { $eq: ["$status", "Declined"] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    locked: { $sum: { $cond: ["$isLocked", 1, 0] } },
                    total: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $not: ["$isLocked"] },
                                        startDate ? { $gte: ["$createdAt", startDate] } : true,
                                        endDate ? { $lte: ["$createdAt", endDate] } : true
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    accepted: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $not: ["$isLocked"] },
                                        "$isMyResponseAccepted",
                                        startDate ? { $gte: [{ $ifNull: ["$updatedAt", { $ifNull: ["$myResponse.createdAt", "$createdAt"] }] }, startDate] } : true,
                                        endDate ? { $lte: [{ $ifNull: ["$updatedAt", { $ifNull: ["$myResponse.createdAt", "$createdAt"] }] }, endDate] } : true
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    declined: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $not: ["$isLocked"] },
                                        "$isMyResponseDeclined",
                                        startDate ? { $gte: [{ $ifNull: ["$updatedAt", { $ifNull: ["$myResponse.createdAt", "$createdAt"] }] }, startDate] } : true,
                                        endDate ? { $lte: [{ $ifNull: ["$updatedAt", { $ifNull: ["$myResponse.createdAt", "$createdAt"] }] }, endDate] } : true
                                    ]
                                },
                                1, 0
                            ]
                        }
                    },
                    rejected: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $not: ["$isLocked"] },
                                        { $not: ["$isMyResponseAccepted"] },
                                        { $not: ["$isMyResponseDeclined"] },
                                        startDate ? { $gte: ["$createdAt", startDate] } : true,
                                        endDate ? { $lte: ["$createdAt", endDate] } : true
                                    ]
                                },
                                1, 0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    locked: 1,
                    total: 1,
                    accepted: 1,
                    declined: 1,
                    // Mathematically force 'rejected' (Not Accepted) to be Total - Accepted as requested
                    rejected: { $max: [0, { $subtract: ["$total", "$accepted"] }] }
                }
            }
        ];

        const bkgPipeline = (query) => [
            { $match: query },
            { $match: { isLocked: { $ne: true } } },
            ...(startDate ? [{ $match: { createdAt: { $gte: startDate, $lte: endDate } } }] : []),
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $in: ["$status", ["Accepted", "Confirmed", "Delivered"]] }, 1, 0] } },
                    declined: { $sum: { $cond: [{ $eq: ["$status", "Declined"] }, 1, 0] } },
                    upcomingPaymentDue: { $sum: { $cond: [{ $in: ["$status", ["Accepted", "Confirmed", "Delivered"]] }, "$price", 0] } },
                    dueIn5Days: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, "$price", 0] } }
                }
            },
            {
                $project: {
                    total: 1,
                    accepted: 1,
                    declined: 1,
                    upcomingPaymentDue: 1,
                    dueIn5Days: 1,
                    rejected: { $max: [0, { $subtract: ["$total", "$accepted"] }] }
                }
            }
        ];

        const Enquiry = require('../models/Enquiry');

        const [myEnqsRes, directEnqsRes, myBkgsRes, directBkgsRes] = await Promise.all([
            Enquiry.aggregate(enqPipeline(buildQuery('my', false), 'my')),
            Enquiry.aggregate(enqPipeline(buildQuery('direct', false), 'direct')),
            Enquiry.aggregate(bkgPipeline(buildQuery('my', true))),
            Enquiry.aggregate(bkgPipeline(buildQuery('direct', true)))
        ]);

        const defaultEnqStats = { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 };
        const defaultBkgStats = { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 };

        res.json({
            myEnquiries: myEnqsRes.length > 0 ? { ...defaultEnqStats, ...myEnqsRes[0] } : defaultEnqStats,
            directEnquiries: directEnqsRes.length > 0 ? { ...defaultEnqStats, ...directEnqsRes[0] } : defaultEnqStats,
            myBookings: myBkgsRes.length > 0 ? { ...defaultBkgStats, ...myBkgsRes[0] } : defaultBkgStats,
            directBookings: directBkgsRes.length > 0 ? { ...defaultBkgStats, ...directBkgsRes[0] } : defaultBkgStats
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

