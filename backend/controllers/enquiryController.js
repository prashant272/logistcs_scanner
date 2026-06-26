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
            isBooking: isBooking || false,
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
            const User = require('../models/User');
            User.findById(validatedVendorId).then(vendorUser => {
                if (vendorUser) {
                    sendEnquiryToVendorAlert(vendorUser.email, {
                        cargoType: sanitizedType,
                        pickupCity: fromLocation,
                        pickupCountry: 'India', // Optional
                        destinationCity: toLocation,
                        destinationCountry: 'Any', // Optional
                        weight: weightRange || 'N/A',
                        volume: 'N/A'
                    }).catch(err => console.error('Error sending vendor email:', err));
                }
            }).catch(err => console.error('Error looking up vendor user for email:', err));
        }

        res.status(201).json(enquiry);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get enquiries for the vendor
exports.getVendorEnquiries = async (req, res) => {
    try {
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
            const User = require('../models/User');
            currentUser = await User.findById(req.user.id);
            if (!currentUser || (currentUser.verificationStatus !== 'Approved' && currentUser.role === 'vendor')) {
                return res.json([]); // Return empty list of leads if vendor is not approved
            }
            hasActivePlan = currentUser.activePlan && currentUser.planEndDate && new Date(currentUser.planEndDate) > new Date();
        }

        const { type } = req.query; // 'my' or 'direct'
        if (type !== 'my' && type !== 'direct') {
            return res.status(400).json({ message: 'Valid enquiry type ("my" or "direct") is required' });
        }

        const isBookingFilter = req.query.isBooking === 'true';
        let query = {};

        if (!isAdmin) {
            if (isBookingFilter) {
                // Bookings initiated by the current vendor (acting as client)
                query = {
                    client: req.user.id,
                    isBooking: true,
                    isDirect: type === 'direct'
                };
            } else {
                // Enquiries received by the current vendor (acting as provider)
                if (type === 'my') {
                    query = {
                        vendor: req.user.id,
                        isDirect: false
                    };
                } else if (type === 'direct') {
                    query = {
                        isDirect: true,
                        client: { $ne: req.user.id }
                    };
                }
            }
        } else {
            // Admin queries
            if (type === 'my') {
                query = { isDirect: false, isBooking: isBookingFilter };
            } else if (type === 'direct') {
                query = { isDirect: true, isBooking: isBookingFilter };
            }
        }

        // Apply vendor filter date/service logic for direct incoming enquiries
        if (!isAdmin && type === 'direct' && !isBookingFilter && currentUser) {
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log(`[getVendorEnquiries] user=${req.user.id} type=${type} page=${page} limit=${limit} skip=${skip}`);

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
            .limit(limit);

        let results = enquiries.map(enq => {
            const enqObj = enq.toObject ? enq.toObject() : enq;
            // Inject myResponse if any
            if (type === 'direct' && enq.responses && enq.responses.length > 0 && !isAdmin) {
                const myResponse = enq.responses.find(r => {
                    if (!r.vendor) return false;
                    const vId = r.vendor._id ? r.vendor._id.toString() : r.vendor.toString();
                    return vId === req.user.id;
                });
                if (myResponse) {
                    enqObj.myResponse = myResponse;
                }
            }
            return enqObj;
        });

        if (!hasActivePlan) {
            const absoluteSkip = skip;
            if (totalCount > 5) {
                res.setHeader('X-Limit-Reached', 'true');
                res.setHeader('Access-Control-Expose-Headers', 'X-Limit-Reached');
            }
            results = results.map((enq, index) => {
                const absoluteIndex = absoluteSkip + index;
                if (absoluteIndex >= 5) {
                    return { 
                        _id: enq._id, 
                        isLocked: true, 
                        type: enq.type, 
                        createdAt: enq.createdAt,
                        status: enq.status,
                        myResponse: enq.myResponse
                    };
                }
                return enq;
            });
        }

        // For direct listings, enrich with the vendor's own price for the same route and cargo type
        if (type === 'direct') {
            const Pricing = require('../models/Pricing');
            const vendorRates = isAdmin ? [] : await Pricing.find({ vendor: req.user.id, status: 'active' });

            const enrichedEnquiries = results.map(enqObj => {
                if (enqObj.isLocked) return enqObj; // Skip enriched for locked
                // Find matching rate for same route and type
                const match = vendorRates.find(rate => {
                    const fromMatch = rate.fromLocation.toLowerCase() === enqObj.fromLocation.toLowerCase();
                    const toMatch = rate.toLocation.toLowerCase() === enqObj.toLocation.toLowerCase();
                    const typeMatch = rate.type.toLowerCase() === enqObj.type.toLowerCase();
                    return fromMatch && toMatch && typeMatch;
                });
                enqObj.vendorOwnPrice = match ? match.price : null;
                return enqObj;
            });
            return res.json({
                data: enrichedEnquiries,
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

        // --- Monthly Limit Check for Vendors ---
        if (status === 'Accepted' && (!enquiry.client || enquiry.client.toString() !== req.user.id)) {
            const User = require('../models/User');
            const vendorUser = await User.findById(req.user.id).populate('activePlan');
            const hasActivePlan = vendorUser && vendorUser.activePlan && vendorUser.planEndDate && new Date(vendorUser.planEndDate) > new Date();
            
            let inquiryLimit = 5;
            if (hasActivePlan && vendorUser.activePlan.inquiryLimit) {
                inquiryLimit = vendorUser.activePlan.inquiryLimit;
            }

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0,0,0,0);

            let alreadyAcceptedThis = false;
            if (enquiry.isDirect) {
                const existing = enquiry.responses.find(r => r.vendor && r.vendor.toString() === req.user.id && r.status === 'Accepted');
                if (existing) alreadyAcceptedThis = true;
            } else {
                if (enquiry.vendor && enquiry.vendor.toString() === req.user.id && enquiry.status === 'Accepted') {
                    alreadyAcceptedThis = true;
                }
            }

            if (!alreadyAcceptedThis) {
                const acceptedCount = await Enquiry.countDocuments({
                    $or: [
                        { vendor: req.user.id, status: 'Accepted', createdAt: { $gte: startOfMonth } },
                        { 'responses': { $elemMatch: { vendor: req.user.id, status: 'Accepted' } }, createdAt: { $gte: startOfMonth } }
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
        if (status === 'Accepted') {
            const User = require('../models/User');
            const vendorUser = await User.findById(req.user.id);
            let customerEmail = enquiry.guestEmail;
            
            if (enquiry.client) {
                const clientUser = await User.findById(enquiry.client);
                if (clientUser) customerEmail = clientUser.email;
            }

            if (customerEmail && vendorUser) {
                const { sendEnquiryAcceptedCustomerAlert } = require('../services/notificationService');
                await sendEnquiryAcceptedCustomerAlert(customerEmail, vendorUser.name || vendorUser.company || 'Vendor', {
                    cargoType: enquiry.type,
                });
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
        const { type } = req.query; // 'my' or 'direct'
        let query = {};

        if (!isAdmin) {
            query.client = req.user.id;
        }

        if (type === 'my') {
            query.isDirect = false;
        } else if (type === 'direct') {
            query.isDirect = true;
        }

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
            .sort({ createdAt: -1 });

        res.json(enquiries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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
            if (!currentUser || (currentUser.verificationStatus !== 'Approved' && currentUser.role === 'vendor')) {
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
                    query = { client: req.user.id, isBooking: true, isDirect: type === 'direct' };
                } else {
                    if (type === 'my') {
                        query = { vendor: req.user.id, isDirect: false };
                    } else {
                        query = { isDirect: true, client: { $ne: req.user.id } };
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

            if (req.query.startDate && req.query.endDate) {
                const startDate = new Date(req.query.startDate);
                const endDate = new Date(req.query.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (query.createdAt && query.createdAt.$gte) {
                     query.createdAt = {
                        $gte: new Date(Math.max(startDate, query.createdAt.$gte)),
                        $lte: endDate
                     };
                } else {
                     query.createdAt = { $gte: startDate, $lte: endDate };
                }
            }
            return query;
        };

        const Enquiry = require('../models/Enquiry');
        const [myEnqs, directEnqs, myBkgs, directBkgs] = await Promise.all([
            Enquiry.find(buildQuery('my', false)).select('status isLocked responses price createdAt').lean(),
            Enquiry.find(buildQuery('direct', false)).select('status isLocked responses price createdAt').lean(),
            Enquiry.find(buildQuery('my', true)).select('status isLocked price createdAt').lean(),
            Enquiry.find(buildQuery('direct', true)).select('status isLocked price createdAt').lean()
        ]);

        const calcEnqStats = (enqs, type) => {
            const stats = { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 };
            enqs.forEach(enq => {
                if (enq.isLocked) {
                    stats.locked++;
                } else {
                    stats.total++;
                    let isAccepted = false;
                    if (type === 'direct' && enq.responses && !isAdmin) {
                        const myRes = enq.responses.find(r => {
                            const vId = r.vendor?._id ? r.vendor._id.toString() : r.vendor?.toString();
                            return vId === req.user.id;
                        });
                        if (myRes && myRes.status === 'Accepted') isAccepted = true;
                    } else if (enq.status === 'Accepted') {
                        isAccepted = true;
                    }
                    
                    if (isAccepted) stats.accepted++;
                    else {
                        stats.rejected++;
                        if (enq.status === 'Declined') stats.declined++;
                    }
                }
            });
            return stats;
        };

        const calcBkgStats = (bkgs) => {
            const stats = { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 };
            bkgs.forEach(bkg => {
                if (!bkg.isLocked) {
                    stats.total++;
                    if (bkg.status === 'Accepted' || bkg.status === 'Confirmed' || bkg.status === 'Delivered') {
                        stats.accepted++;
                        stats.upcomingPaymentDue += (Number(bkg.price) || 0);
                    } else if (bkg.status === 'Declined') {
                        stats.declined++;
                    } else if (bkg.status === 'Pending') {
                        stats.dueIn5Days += (Number(bkg.price) || 0);
                    }
                }
            });
            return stats;
        };

        res.json({
            myEnquiries: calcEnqStats(myEnqs, 'my'),
            directEnquiries: calcEnqStats(directEnqs, 'direct'),
            myBookings: calcBkgStats(myBkgs),
            directBookings: calcBkgStats(directBkgs)
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

