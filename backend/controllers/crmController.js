const CrmLead = require('../models/CrmLead');
const Enquiry = require('../models/Enquiry');
const User = require('../models/User');

exports.createLead = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { enquiryId } = req.body;

        // Verify enquiry exists and vendor has accepted it
        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found' });
        }

        // Check if vendor has accepted it (in responses)
        const vendorResponse = enquiry.responses.find(r => r.vendor.toString() === vendorId);
        if (!vendorResponse || vendorResponse.status !== 'Accepted') {
            return res.status(400).json({ success: false, message: 'You can only add accepted enquiries to CRM' });
        }

        // Check if lead already exists
        const existingLead = await CrmLead.findOne({ vendor: vendorId, enquiry: enquiryId });
        if (existingLead) {
            return res.status(400).json({ success: false, message: 'Lead already exists in CRM' });
        }

        const client = await User.findById(enquiry.client).select('name email phone company');

        const newLead = await CrmLead.create({
            vendor: vendorId,
            enquiry: enquiryId,
            enquiryRefId: enquiry._id.toString().slice(-8), // simple ref
            clientInfo: {
                name: enquiry.guestName || (client ? client.name : ''),
                company: enquiry.guestCompany || (client ? client.company : ''),
                email: enquiry.guestEmail || (client ? client.email : ''),
                phone: enquiry.guestPhone || (client ? client.phone : '')
            },
            logisticsDetails: {
                fromLocation: enquiry.fromLocation,
                toLocation: enquiry.toLocation,
                mode: enquiry.type,
                commodity: enquiry.commodity,
                weight: enquiry.weightRange || enquiry.quantity || '',
                dateOfShipment: enquiry.shipmentDate || ''
            },
            price: vendorResponse.price,
            status: 'New',
            timeline: [{
                title: 'Lead Created',
                description: 'Enquiry was added to CRM',
                type: 'system'
            }]
        });

        res.status(201).json({ success: true, lead: newLead });
    } catch (error) {
        console.error('Error creating CRM lead:', error);
        res.status(500).json({ success: false, message: 'Failed to create CRM lead' });
    }
};

exports.getVendorLeads = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const { search, status, mode, region, sort } = req.query;

        let query = { vendor: vendorId };

        if (status && status !== 'All Status') {
            query.status = status;
        }

        if (mode && mode !== 'All Transport Mode') {
            const mappedMode = mode.split(' ')[0];
            query['logisticsDetails.mode'] = { $regex: new RegExp(`^${mappedMode}`, 'i') };
        }

        if (region && region !== 'All Regions') {
            query.$or = [
                { 'logisticsDetails.fromLocation': { $regex: region, $options: 'i' } },
                { 'logisticsDetails.toLocation': { $regex: region, $options: 'i' } }
            ];
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            const searchOr = [
                { 'clientInfo.name': searchRegex },
                { 'clientInfo.company': searchRegex },
                { 'clientInfo.email': searchRegex },
                { 'clientInfo.phone': searchRegex },
                { 'logisticsDetails.fromLocation': searchRegex },
                { 'logisticsDetails.toLocation': searchRegex },
                { enquiryRefId: searchRegex }
            ];
            
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchOr }];
                delete query.$or;
            } else {
                query.$or = searchOr;
            }
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'Sort by: Oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'Sort by: Status') {
            sortOption = { status: 1, createdAt: -1 };
        }

        const leads = await CrmLead.find(query).sort(sortOption);
        res.status(200).json({ success: true, count: leads.length, leads });
    } catch (error) {
        console.error('Error fetching CRM leads:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch CRM leads' });
    }
};

exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const vendorId = req.user.id;

        const lead = await CrmLead.findOne({ _id: id, vendor: vendorId });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const oldStatus = lead.status;
        lead.status = status;
        
        lead.timeline.unshift({
            title: 'Status Updated',
            description: `Status changed from ${oldStatus} to ${status}`,
            type: 'status_change'
        });

        await lead.save();
        res.status(200).json({ success: true, lead });
    } catch (error) {
        console.error('Error updating lead status:', error);
        res.status(500).json({ success: false, message: 'Failed to update lead status' });
    }
};

exports.addTimelineNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const vendorId = req.user.id;

        if (!note || note.trim() === '') {
            return res.status(400).json({ success: false, message: 'Note content is required' });
        }

        const lead = await CrmLead.findOne({ _id: id, vendor: vendorId });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        lead.timeline.unshift({
            title: 'Note Added',
            description: note,
            type: 'note'
        });

        await lead.save();
        res.status(200).json({ success: true, lead });
    } catch (error) {
        console.error('Error adding timeline note:', error);
        res.status(500).json({ success: false, message: 'Failed to add timeline note' });
    }
};

exports.scheduleFollowUp = async (req, res) => {
    try {
        const { id } = req.params;
        const { followUpDate } = req.body;
        const vendorId = req.user.id;

        if (!followUpDate) {
            return res.status(400).json({ success: false, message: 'Follow up date is required' });
        }

        const lead = await CrmLead.findOne({ _id: id, vendor: vendorId });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        lead.followUpDate = new Date(followUpDate);
        lead.status = 'Follow-up'; // Automatically update status
        
        lead.timeline.unshift({
            title: 'Follow-up Scheduled',
            description: `Follow-up scheduled for ${new Date(followUpDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
            type: 'followup'
        });

        await lead.save();
        res.status(200).json({ success: true, lead });
    } catch (error) {
        console.error('Error scheduling follow-up:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule follow-up' });
    }
};

exports.getFollowUps = async (req, res) => {
    try {
        const vendorId = req.user.id;
        
        // Find all leads with a followUpDate for this vendor
        const followUpLeads = await CrmLead.find({ 
            vendor: vendorId, 
            followUpDate: { $ne: null } 
        }).sort({ followUpDate: 1 });

        const now = new Date();
        const todaysFollowUps = [];
        const missedFollowUps = [];

        for (const lead of followUpLeads) {
            const fDate = new Date(lead.followUpDate);
            const timeDiffMinutes = (now.getTime() - fDate.getTime()) / (1000 * 60);

            // If the follow-up is in the past by more than 30 mins
            if (timeDiffMinutes > 30) {
                // Check if any timeline event (note, status change) happened AFTER the followUpDate
                const actionTaken = lead.timeline.some(event => {
                    const eventDate = new Date(event.date || event.createdAt || now);
                    return event.type !== 'followup' && eventDate.getTime() > fDate.getTime();
                });

                if (!actionTaken && !['Closed-Won', 'Closed-Lost'].includes(lead.status)) {
                    // Update status in DB dynamically if not already set
                    if (lead.status !== 'Missed Follow-up') {
                        lead.status = 'Missed Follow-up';
                        await lead.save();
                    }
                    missedFollowUps.push(lead);
                }
            } 
            // If the follow-up is today or in the future
            else {
                // Ignore if it's already closed
                if (!['Closed-Won', 'Closed-Lost'].includes(lead.status)) {
                    todaysFollowUps.push(lead);
                }
            }
        }

        res.status(200).json({ success: true, todaysFollowUps, missedFollowUps });
    } catch (error) {
        console.error('Error fetching follow-ups:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch follow-ups' });
    }
};
