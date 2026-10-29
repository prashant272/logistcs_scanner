const Ad = require('../models/Ad');

// Create a new Ad (Admin only)
exports.createAd = async (req, res) => {
    try {
        const { title, sponsorName, headline, description, imageUrl, features, buttonText, linkUrl, placement, targetSection, targetUrl, openInNewTab, isActive } = req.body;
        
        const newAd = new Ad({
            title,
            sponsorName,
            headline,
            description,
            imageUrl,
            features,
            buttonText,
            linkUrl,
            placement,
            targetSection: targetSection || 'both',
            targetUrl: targetUrl ? targetUrl.trim() : '',
            openInNewTab: openInNewTab !== false,
            isActive
        });
        
        await newAd.save();
        res.status(201).json({ message: 'Ad created successfully', ad: newAd });
    } catch (error) {
        console.error('Error creating Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all Ads (Admin only)
exports.getAllAds = async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        console.error('Error fetching Ads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an Ad (Admin only)
exports.updateAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json({ message: 'Ad updated successfully', ad });
    } catch (error) {
        console.error('Error updating Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an Ad (Admin only)
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ message: 'Ad not found' });
        }
        res.status(200).json({ message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Error deleting Ad:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get active Ads by section or pageUrl (Public / Vendors / Customers)
exports.getActiveAds = async (req, res) => {
    try {
        const { section, pageUrl } = req.query;
        
        let query = { isActive: true };
        
        if (section || pageUrl) {
            const orConditions = [];

            // Match by targetSection or mapped URLs if section is provided
            if (section) {
                if (section === 'direct_enquiry') {
                    orConditions.push({ targetSection: { $in: ['direct_enquiry', 'both', 'both_panels'] } });
                    orConditions.push({ targetUrl: { $regex: /(^|[,;\s])\/?vendor\/direct-enquiri?e?s?([,;\s]|$)/i } });
                } else if (section === 'b2b_enquiry') {
                    orConditions.push({ targetSection: { $in: ['b2b_enquiry', 'both', 'both_panels'] } });
                    orConditions.push({ targetUrl: { $regex: /(^|[,;\s])\/?vendor\/b2b-enquiri?e?s?([,;\s]|$)/i } });
                } else if (section.startsWith('customer')) {
                    orConditions.push({ targetSection: { $in: [section, 'customer_all', 'both_panels', 'both'] } });
                    if (section === 'customer_direct') {
                        orConditions.push({ targetUrl: { $regex: /(^|[,;\s])\/?customer\/direct-enquiri?e?s?([,;\s]|$)/i } });
                    } else if (section === 'customer_my') {
                        orConditions.push({ targetUrl: { $regex: /(^|[,;\s])\/?customer\/my-enquiri?e?s?([,;\s]|$)/i } });
                    } else if (section === 'customer_dashboard') {
                        orConditions.push({ targetUrl: { $regex: /(^|[,;\s])\/?customer\/dashboard([,;\s]|$)/i } });
                    }
                } else {
                    orConditions.push({ targetSection: { $in: [section, 'both', 'both_panels'] } });
                }
            }

            // Match by pageUrl if pageUrl provided
            if (pageUrl) {
                const cleanUrl = pageUrl.split('?')[0].trim();
                const urlWithoutSlash = cleanUrl.replace(/^\/+/, '').replace(/\/+$/, '');
                const escaped = urlWithoutSlash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // 1. Exact string matches
                orConditions.push({ targetUrl: cleanUrl });
                orConditions.push({ targetUrl: pageUrl.trim() });
                if (cleanUrl.startsWith('/')) {
                    orConditions.push({ targetUrl: cleanUrl.substring(1) });
                } else {
                    orConditions.push({ targetUrl: '/' + cleanUrl });
                }

                // 2. Universal token match: only if slug has meaningful characters (prevents '/' from matching all ads)
                if (urlWithoutSlash && urlWithoutSlash.trim().length > 1) {
                    const variations = [escaped];
                    if (urlWithoutSlash.endsWith('ies')) {
                        variations.push(urlWithoutSlash.slice(0, -3) + 'y');
                    } else if (urlWithoutSlash.endsWith('y')) {
                        variations.push(urlWithoutSlash.slice(0, -1) + 'ies');
                    } else if (urlWithoutSlash.endsWith('s')) {
                        variations.push(urlWithoutSlash.slice(0, -1));
                    } else {
                        variations.push(urlWithoutSlash + 's');
                    }

                    variations.forEach(token => {
                        if (token && token.trim().length > 1) {
                            const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            orConditions.push({ targetUrl: { $regex: new RegExp(`(^|[,;\\s\\/])${esc}([,;\\s\\/?]|$)`, 'i') } });
                        }
                    });
                }

                // 3. Customer page URL aliases
                if (cleanUrl.includes('/customer')) {
                    orConditions.push({ targetSection: 'customer_all' });
                    orConditions.push({ targetSection: 'both_panels' });
                    orConditions.push({ targetSection: 'both' });
                    
                    if (cleanUrl.includes('my-enquiry') || cleanUrl.includes('my-enquiries')) {
                        orConditions.push({ targetSection: 'customer_my' });
                    } else if (cleanUrl.includes('direct-enquiry') || cleanUrl.includes('direct-enquiries')) {
                        orConditions.push({ targetSection: 'customer_direct' });
                    } else if (cleanUrl.includes('dashboard')) {
                        orConditions.push({ targetSection: 'customer_dashboard' });
                    }
                }

                // 4. Vendor page URL aliases
                if (cleanUrl.includes('/vendor')) {
                    orConditions.push({ targetSection: 'both_panels' });
                    orConditions.push({ targetSection: 'both' });

                    if (cleanUrl.includes('direct-enquiries') || cleanUrl.includes('direct-enquiry')) {
                        orConditions.push({ targetSection: 'direct_enquiry' });
                    } else if (cleanUrl.includes('b2b-enquiries') || cleanUrl.includes('b2b-enquiry')) {
                        orConditions.push({ targetSection: 'b2b_enquiry' });
                    }
                }

                // 5. Search results page URL aliases
                if (cleanUrl.includes('search-results')) {
                    orConditions.push({ targetSection: 'both' });
                    orConditions.push({ targetSection: 'both_panels' });
                }
            }
            
            if (orConditions.length > 0) {
                query.$or = orConditions;
            }
        }
        
        const ads = await Ad.find(query).sort({ createdAt: -1 });
        res.status(200).json(ads);
    } catch (error) {
        console.error('Error fetching active Ads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
