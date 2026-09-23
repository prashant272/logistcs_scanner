const SmtpConfig = require('../models/SmtpConfig');
const EmailTemplate = require('../models/EmailTemplate');
const EmailCampaign = require('../models/EmailCampaign');
const CampaignRecipient = require('../models/CampaignRecipient');
const nodemailer = require('nodemailer');
const { getIo } = require('../utils/socketSetup');

const wrapEmailHtml = (htmlContent) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif;">
    ${htmlContent}
</body>
</html>
`;

// @desc    Get SMTP Configuration
// @route   GET /api/email/smtp-config
// @access  Private (Admin)
exports.getSmtpConfig = async (req, res) => {
    try {
        const configs = await SmtpConfig.find().sort('-createdAt');
        const safeConfigs = configs.map(config => ({
            _id: config._id,
            accountName: config.accountName,
            host: config.host,
            port: config.port,
            user: config.user,
            fromName: config.fromName,
            fromEmail: config.fromEmail,
            hasPassword: !!config.password
        }));
        res.json(safeConfigs);
    } catch (error) {
        console.error('Error fetching SMTP config:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save SMTP Configuration
// @route   POST /api/email/smtp-config
// @access  Private (Admin)
exports.saveSmtpConfig = async (req, res) => {
    try {
        const { id, accountName, host, port, user, password, fromName, fromEmail } = req.body;

        if (id) {
            const config = await SmtpConfig.findById(id);
            if (!config) return res.status(404).json({ message: 'SMTP Config not found' });
            
            config.accountName = accountName;
            config.host = host;
            config.port = port;
            config.user = user;
            if (password) {
                config.password = password;
            }
            config.fromName = fromName;
            config.fromEmail = fromEmail;
            await config.save();
        } else {
            const config = new SmtpConfig({
                accountName, host, port, user, password, fromName, fromEmail
            });
            await config.save();
        }

        res.json({ message: 'SMTP Configuration saved successfully' });
    } catch (error) {
        console.error('Error saving SMTP config:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete SMTP Configuration
// @route   DELETE /api/email/smtp-config/:id
// @access  Private (Admin)
exports.deleteSmtpConfig = async (req, res) => {
    try {
        await SmtpConfig.findByIdAndDelete(req.params.id);
        res.json({ message: 'SMTP Configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting SMTP config:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Background worker to process campaigns
const processCampaigns = async () => {
    try {
        const runningCampaigns = await EmailCampaign.find({ status: 'running' });
        
        for (const campaign of runningCampaigns) {
            // Find one pending recipient for this campaign
            const recipient = await CampaignRecipient.findOne({ campaignId: campaign._id, status: 'pending' });
            
            if (!recipient) {
                // No more pending recipients, mark campaign as completed
                campaign.status = 'completed';
                await campaign.save();
                
                const io = getIo();
                if (io) io.to('adminRoom').emit('campaignUpdate', campaign);
                continue;
            }

            const config = await SmtpConfig.findById(campaign.smtpId);
            if (!config) {
                campaign.status = 'failed';
                await campaign.save();
                
                const io = getIo();
                if (io) io.to('adminRoom').emit('campaignUpdate', campaign);
                continue;
            }

            const transporter = nodemailer.createTransport({
                host: config.host,
                port: config.port,
                secure: config.port === 465,
                auth: { user: config.user, pass: config.password }
            });

            let currentSubject = campaign.subject;
            let currentMessage = campaign.htmlContent;
            
            if (recipient.variables) {
                recipient.variables.forEach((val, key) => {
                    if (key === 'email') return;
                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                    currentSubject = currentSubject.replace(regex, val || '');
                    currentMessage = currentMessage.replace(regex, val || '');
                });
            }

            // Inject tracking pixel
            const trackingUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/email/track/${recipient._id}`;
            const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
            if (currentMessage.includes('</body>')) {
                currentMessage = currentMessage.replace('</body>', `${trackingPixel}</body>`);
            } else {
                currentMessage += trackingPixel;
            }

            try {
                await transporter.sendMail({
                    from: `"${config.fromName}" <${config.fromEmail}>`,
                    to: recipient.email,
                    replyTo: config.fromEmail,
                    subject: currentSubject,
                    text: currentMessage,
                    html: wrapEmailHtml(currentMessage),
                    headers: { 'X-Priority': '3', 'X-Mailer': 'Nodemailer' }
                });

                recipient.status = 'sent';
                recipient.sentAt = new Date();
                await recipient.save();

                campaign.sentCount++;
                await campaign.save();
                
                const io = getIo();
                if (io) io.to('adminRoom').emit('campaignUpdate', campaign);
            } catch (err) {
                console.error(`Failed to send email to ${recipient.email}:`, err);
                recipient.status = 'failed';
                recipient.errorMsg = err.message;
                await recipient.save();

                campaign.failedCount++;
                await campaign.save();
                
                const io = getIo();
                if (io) io.to('adminRoom').emit('campaignUpdate', campaign);
            }
        }
    } catch (error) {
        console.error('Error processing campaigns:', error);
    }
};

// Start background worker loop (runs every 2 seconds roughly)
setInterval(processCampaigns, 2000);

// @desc    Create and Start Bulk Email Campaign
// @route   POST /api/email/send-bulk
// @access  Private (Admin)
exports.createCampaign = async (req, res) => {
    try {
        const { emails, subject, message, smtpId, delaySeconds, campaignName } = req.body;

        if (!emails || emails.length === 0) return res.status(400).json({ message: 'No recipients provided' });
        if (!smtpId) return res.status(400).json({ message: 'Please select an SMTP Sender Email.' });

        const config = await SmtpConfig.findById(smtpId);
        if (!config || !config.host || !config.user || !config.password) {
            return res.status(400).json({ message: 'SMTP configuration is incomplete or not found.' });
        }

        // Create Campaign
        const campaign = new EmailCampaign({
            name: campaignName || subject,
            subject,
            htmlContent: message,
            smtpId,
            totalEmails: emails.length,
            delaySeconds: delaySeconds || 2,
            status: 'running'
        });
        await campaign.save();

        // Create Recipients
        const recipientsToInsert = emails.map(recipient => {
            const emailAddr = typeof recipient === 'object' && recipient !== null ? recipient.email : recipient;
            let variables = {};
            if (typeof recipient === 'object' && recipient !== null) {
                Object.keys(recipient).forEach(k => { if(k !== 'email') variables[k] = recipient[k]; });
            }
            return {
                campaignId: campaign._id,
                email: emailAddr,
                variables
            };
        });

        await CampaignRecipient.insertMany(recipientsToInsert);

        res.json({ message: `Campaign started! ${emails.length} emails queued for sending.`, campaign });
    } catch (error) {
        console.error('Error starting campaign:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all campaigns
// @route   GET /api/email/campaigns
// @access  Private (Admin)
exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await EmailCampaign.find().sort('-createdAt').populate('smtpId', 'accountName fromEmail');
        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a campaign
// @route   DELETE /api/email/campaigns/:id
// @access  Private (Admin)
exports.deleteCampaign = async (req, res) => {
    try {
        await EmailCampaign.findByIdAndDelete(req.params.id);
        await CampaignRecipient.deleteMany({ campaignId: req.params.id });
        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Track Email Open (Public 1x1 Pixel)
// @route   GET /api/email/track/:id
// @access  Public
exports.trackEmailOpen = async (req, res) => {
    try {
        const recipientId = req.params.id;
        const recipient = await CampaignRecipient.findById(recipientId);
        
        if (recipient && !recipient.opened) {
            recipient.opened = true;
            await recipient.save();
            
            // Increment openedCount in Campaign
            const updatedCampaign = await EmailCampaign.findByIdAndUpdate(recipient.campaignId, { $inc: { openedCount: 1 } }, { new: true });
            
            const io = getIo();
            if (io && updatedCampaign) io.to('adminRoom').emit('campaignUpdate', updatedCampaign);
        }
    } catch (error) {
        console.error('Error tracking pixel:', error);
    }
    
    // Always return a 1x1 transparent GIF
    const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': img.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.end(img);
};

// @desc    Get all email templates
// @route   GET /api/email/templates
// @access  Private (Admin)
exports.getTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save an email template
// @route   POST /api/email/templates
// @access  Private (Admin)
exports.saveTemplate = async (req, res) => {
    try {
        const { name, description, htmlContent, designJson, type, subject } = req.body;
        
        let template = await EmailTemplate.findOne({ name });
        if (template) {
            template.description = description;
            template.htmlContent = htmlContent;
            template.designJson = designJson;
            template.type = type;
            template.subject = subject || '';
            await template.save();
        } else {
            template = await EmailTemplate.create({
                name,
                description,
                htmlContent,
                designJson,
                type,
                subject: subject || '',
                createdBy: req.user ? req.user.id : null
            });
        }
        res.json(template);
    } catch (error) {
        console.error('Error saving template:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete an email template
// @route   DELETE /api/email/templates/:id
// @access  Private (Admin)
exports.deleteTemplate = async (req, res) => {
    try {
        await EmailTemplate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Template deleted' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

