const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pricing = require('../models/Pricing');
const Plan = require('../models/Plan');
const Location = require('../models/Location');
const Enquiry = require('../models/Enquiry');
const { triggerVendorBroadcast } = require('./enquiryController');

// Check if query is explicitly in Devanagari Hindi or user asked for Hindi
const isExplicitHindi = (text) => {
    const devanagariRegex = /[\u0900-\u097F]/;
    if (devanagariRegex.test(text)) return true;
    const lower = (text || '').toLowerCase();
    if (lower.includes('hindi me') || lower.includes('in hindi') || lower.includes('hindi mein')) return true;
    return false;
};

// Query OpenRouter AI using openai/gpt-4o-mini with full conversation history
const queryOpenRouter = async (userPrompt, forceHindi = false, conversationHistory = [], customSystem = null) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_KEY_HERE')) {
        return null;
    }

    const languageInstruction = forceHindi
        ? "Respond in natural, polite Hindi (Devanagari script)."
        : "Respond strictly in clear, professional ENGLISH by default, unless the user explicitly requests Hindi in Devanagari.";

    const defaultSystem = `You are the Principal International Freight & Shipping Strategist for **Logistics Scanner** (India's leading digital freight forwarder & customs network).
CRITICAL INTELLIGENCE & ACCURACY RULES:
1. ${languageInstruction}
2. Provide DEEP, DATA-RICH, PRACTICAL FREIGHT ADVICE.
3. NEVER fabricate dummy or fake forwarder names or fake prices. Portal forwarders and rates come exclusively from verified database records.
4. Format responses cleanly with bold keywords and concise bullet points.`;

    const systemContent = customSystem ? `${customSystem}\n${languageInstruction}` : defaultSystem;

    const formattedHistory = (conversationHistory || [])
        .slice(-8)
        .map(item => ({
            role: item.sender === 'user' ? 'user' : 'assistant',
            content: (item.text || '').substring(0, 800)
        }));

    const messages = [
        { role: 'system', content: systemContent },
        ...formattedHistory,
        { role: 'user', content: userPrompt }
    ];

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
                messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://logisticsscanner.com',
                    'X-Title': 'Logistics Scanner AI Chatbot',
                    'Content-Type': 'application/json'
                },
                timeout: 25000
            }
        );

        return response.data?.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error("OpenRouter API error:", error?.response?.data || error.message);
        return null;
    }
};

// AI Entity & Intent Extractor for normalizing natural user input
const extractEnquiryEntitiesWithAI = async (userInput, currentEnquiry = {}) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_KEY_HERE')) return null;

    const systemPrompt = `You are a strict data extraction parser for a logistics and shipping assistant.
Analyze the user's latest input along with current known enquiry context.
Extract any of the following fields if present or implied:
- commodity: string (e.g. "Textiles", "Machinery", "Auto parts", "Chemicals")
- weight: string (e.g. "500 kg", "2 tons", "1x20ft Container", "4 CBM")
- originCountry: string (e.g. "India", "China", "United Arab Emirates", "USA", "Germany")
- destinationCountry: string (e.g. "China", "India", "USA", "United Arab Emirates", "Germany")
- originPort: string (e.g. "Nhava Sheva", "Mundra", "Chennai", "Shanghai")
- destinationPort: string (e.g. "Shanghai", "Ningbo", "Jebel Ali", "Los Angeles")
- mode: "sea" | "air" | "land" | "warehouse" | "cha"

Current known context: ${JSON.stringify(currentEnquiry)}

Return ONLY a valid JSON object with the extracted fields (do not include markdown backticks or explanation). If a field was not mentioned, omit it.`;

    try {
        const res = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userInput }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://logisticsscanner.com',
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        const content = res.data?.choices?.[0]?.message?.content?.trim();
        if (!content) return null;
        const clean = content.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        return null;
    }
};

// Fetch real ports from Database for a given country with major hub prioritization
const getPortsByCountryFromDb = async (countryName, mode = 'sea') => {
    if (!countryName) return [];
    try {
        const locType = (mode && mode.toLowerCase() === 'air') ? 'Airport' : 'Seaport';
        const cleanCountry = countryName.trim();

        // 1. Fetch matching locations from DB
        let allPorts = await Location.find({
            country: new RegExp(cleanCountry, 'i'),
            type: locType
        }).select('name code city').lean();

        if (!allPorts || allPorts.length === 0) {
            return [];
        }

        // Deduplicate ports by name
        const uniqueMap = new Map();
        allPorts.forEach(p => {
            if (!uniqueMap.has(p.name)) {
                uniqueMap.set(p.name, p);
            }
        });
        const uniquePorts = Array.from(uniqueMap.values());

        // Major hubs prioritization list for premier trade lanes
        const majorHubKeywords = locType === 'Airport'
            ? ['delhi', 'mumbai', 'pvg', 'shanghai', 'bengaluru', 'chennai', 'hyderabad', 'dubai', 'dxb', 'guangzhou', 'beijing', 'frankfurt', 'chicago', 'los angeles', 'jfk', 'singapore']
            : ['nhava sheva', 'jnpt', 'mundra', 'shanghai', 'ningbo', 'chennai', 'shenzhen', 'jebel ali', 'hazira', 'pipavav', 'qingdao', 'guangzhou', 'tianjin', 'cochin', 'kolkata', 'calcutta', 'rotterdam', 'hamburg'];

        const prioritized = [];
        for (const kw of majorHubKeywords) {
            const match = uniquePorts.find(p =>
                (p.name && p.name.toLowerCase().includes(kw)) ||
                (p.city && p.city.toLowerCase().includes(kw)) ||
                (p.code && p.code.toLowerCase().includes(kw))
            );
            if (match && !prioritized.some(x => x.name === match.name)) {
                prioritized.push({ name: match.name, code: match.code, city: match.city });
            }
        }

        // Add other ports up to limit of 8
        for (const p of uniquePorts) {
            if (prioritized.length >= 8) break;
            if (!prioritized.some(x => x.name === p.name)) {
                prioritized.push({ name: p.name, code: p.code, city: p.city });
            }
        }

        return prioritized.slice(0, 8);
    } catch (err) {
        console.error("Error fetching ports from DB:", err);
        return [];
    }
};

// Helper to fetch ranked verified vendors matching route and services
const fetchRankedVendorsForRoute = async (filterQuery = {}, limit = 12, skip = 0) => {
    try {
        const paidPlans = await Plan.find({ price: { $gt: 5 } }).select('_id price name').lean();
        const paidPlanMap = new Map();
        paidPlans.forEach(p => paidPlanMap.set(p._id.toString(), p.price || 0));
        const paidPlanIds = paidPlans.map(p => p._id);

        // 1. Recommended: Paid plan > 5 AND verified
        const paidQuery = {
            role: 'vendor',
            ...filterQuery,
            isVerified: true,
            activePlan: { $in: paidPlanIds }
        };

        let paidVendors = await User.find(paidQuery)
            .select('name company city country services vendorTypes profilePhoto isVerified verificationStatus activePlan rating lastYearTurnover portsCovered countriesServed')
            .lean()
            .maxTimeMS(3000);

        paidVendors.sort((a, b) => {
            const priceA = paidPlanMap.get(a.activePlan?.toString()) || 0;
            const priceB = paidPlanMap.get(b.activePlan?.toString()) || 0;
            return priceB - priceA;
        });

        paidVendors = paidVendors.map(v => ({
            ...v,
            isRecommended: true
        }));

        const paidIds = paidVendors.map(v => v._id.toString());

        // 2. Verified Vendors: isVerified true, not in paid list
        const verifiedQuery = {
            role: 'vendor',
            ...filterQuery,
            isVerified: true,
            _id: { $nin: paidIds }
        };

        let verifiedVendors = await User.find(verifiedQuery)
            .select('name company city country services vendorTypes profilePhoto isVerified verificationStatus activePlan rating lastYearTurnover portsCovered countriesServed')
            .lean()
            .maxTimeMS(3000);

        verifiedVendors = verifiedVendors.map(v => ({
            ...v,
            isRecommended: false,
            isVerifiedVendor: true
        }));

        const allVendors = [...paidVendors, ...verifiedVendors];
        return allVendors.slice(skip, skip + limit);
    } catch (err) {
        console.error("Error fetching ranked vendors:", err);
        return [];
    }
};

// Helper to find genuine published rates from Pricing collection with comprehensive regex matching
const findAvailableRatesForRoute = async (fromLocation, toLocation, mode = 'sea', loadType = '') => {
    try {
        const query = {
            status: 'active'
        };
        if (mode) {
            query.type = mode.toLowerCase();
        }

        // Helper to extract terms (e.g. "Jawaharlal Nehru Port (Nhava Sheva)" -> ["jawaharlal", "nehru", "nhava sheva", "innsa"])
        const extractKeywords = (locStr) => {
            if (!locStr) return [];
            const cleaned = locStr.replace(/,/g, ' ');
            const terms = [cleaned.trim()];
            // Extract inside parentheses
            const match = locStr.match(/\((.*?)\)/);
            if (match && match[1]) {
                terms.push(match[1].trim());
            }
            // Extract before parentheses
            const before = locStr.replace(/\(.*?\)/g, '').trim();
            if (before) {
                terms.push(before);
            }
            // Add prominent port aliases
            const lower = locStr.toLowerCase();
            if (lower.includes('nhava') || lower.includes('jawaharlal') || lower.includes('jnpt')) {
                terms.push('Nhava', 'JNPT', 'Jawaharlal', 'INNSA');
            }
            if (lower.includes('mundra')) terms.push('Mundra', 'INMUN');
            if (lower.includes('chennai')) terms.push('Chennai', 'INMAA');
            if (lower.includes('shanghai')) terms.push('Shanghai', 'CNSHG');
            if (lower.includes('ningbo')) terms.push('Ningbo', 'CNNGB');
            if (lower.includes('shekou') || lower.includes('shenzhen')) terms.push('Shekou', 'Shenzhen', 'CNSHK');
            if (lower.includes('singapore')) terms.push('Singapore', 'SGSIN');
            if (lower.includes('jebel ali') || lower.includes('dubai')) terms.push('Jebel Ali', 'Dubai', 'AEJEA');

            return [...new Set(terms.filter(Boolean))];
        };

        const fromKeywords = extractKeywords(fromLocation);
        const toKeywords = extractKeywords(toLocation);

        const conditions = [];

        if (fromKeywords.length > 0) {
            conditions.push({
                $or: fromKeywords.map(kw => ({ fromLocation: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }))
            });
        }

        if (toKeywords.length > 0) {
            conditions.push({
                $or: toKeywords.map(kw => ({ toLocation: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }))
            });
        }

        if (conditions.length > 0) {
            query.$and = conditions;
        }

        // Must have both fromLocation and toLocation matching
        if (!fromLocation || !toLocation) {
            return [];
        }

        const rates = await Pricing.find(query)
            .populate('vendor', 'name company city country profilePhoto isVerified activePlan')
            .sort({ price: 1 })
            .limit(10)
            .lean();

        // Filter out dummy/test prices (e.g. <= 100 for ocean container freight)
        return rates.filter(r => {
            if (!r.price || r.price <= 0) return false;
            // For international sea container freight, rate of ₹100 is clearly a test/dummy entry
            if (r.type === 'sea' && r.price < 1000) return false;
            return true;
        });
    } catch (err) {
        console.error("Error finding rates for route:", err);
        return [];
    }
};

// Main Chatbot Query Controller with Stateful Conversational Workflow
exports.handleChatbotQuery = async (req, res) => {
    try {
        const { message, intent, locationSearch, history, lastContext, user: clientUserData } = req.body;
        if (!message && !intent && !locationSearch) {
            return res.status(400).json({ success: false, message: 'Message or intent is required.' });
        }

        // Identify logged in user if available via token or body
        let loggedInUserId = null;
        let loggedInUserDoc = null;
        const authHeader = req.header("Authorization");
        if (authHeader) {
            try {
                const tokenString = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
                if (tokenString && tokenString !== "null") {
                    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
                    loggedInUserId = decoded.id === 'admin_master_id' ? 'ad0000000000000000000000' : decoded.id;
                }
            } catch (err) {
                // Token parse error ignored
            }
        }
        if (!loggedInUserId && clientUserData?._id) {
            loggedInUserId = clientUserData._id;
        }
        if (loggedInUserId && mongoose.Types.ObjectId.isValid(loggedInUserId)) {
            try {
                loggedInUserDoc = await User.findById(loggedInUserId).lean();
            } catch (uErr) {
                console.error("Error fetching loggedInUser in chatbot:", uErr);
            }
        }

        const raw = (message || '').trim();
        const q = raw.toLowerCase();
        const userWantsHindi = isExplicitHindi(raw);

        // Dynamic Location Helpers: Query distinct countries & cities from DB if available, plus standard global list
        const commonCountries = [
            'india', 'china', 'united states', 'usa', 'united arab emirates', 'uae', 'dubai', 
            'united kingdom', 'uk', 'germany', 'singapore', 'vietnam', 'malaysia', 'thailand', 
            'saudi arabia', 'turkey', 'japan', 'south korea', 'australia', 'canada', 'netherlands', 
            'italy', 'france', 'spain', 'egypt', 'brazil', 'russia', 'south africa', 'indonesia'
        ];
        const commonCities = [
            'delhi', 'new delhi', 'mumbai', 'kolkata', 'chennai', 'mundra', 'bangalore', 'bengaluru', 
            'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'surat', 'patna', 'cochin', 'kochi', 
            'nhava sheva', 'jnpt', 'visakhapatnam', 'tuticorin', 'hazira', 'pipavav', 'shanghai', 
            'ningbo', 'shenzhen', 'guangzhou', 'qingdao', 'tianjin', 'xiamen', 'dalian', 'jebel ali', 
            'singapore', 'rotterdam', 'hamburg', 'los angeles', 'long beach', 'new york', 'houston'
        ];

        let matchedCity = commonCities.find(c => new RegExp(`\\b${c}\\b`, 'i').test(raw)) || '';
        let matchedCountry = commonCountries.find(c => new RegExp(`\\b${c}\\b`, 'i').test(raw)) || '';

        // Handle country aliases
        if (matchedCountry === 'usa' || matchedCountry === 'united states') matchedCountry = 'United States';
        else if (matchedCountry === 'uae' || matchedCountry === 'dubai' || matchedCountry === 'united arab emirates') matchedCountry = 'United Arab Emirates';
        else if (matchedCountry === 'uk' || matchedCountry === 'united kingdom') matchedCountry = 'United Kingdom';
        else if (matchedCountry === 'india') matchedCountry = 'India';
        else if (matchedCountry === 'china') matchedCountry = 'China';
        else if (matchedCountry) matchedCountry = matchedCountry.charAt(0).toUpperCase() + matchedCountry.slice(1);

        if (matchedCity) {
            matchedCity = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
        }

        // Retrieve existing enquiry conversation state
        let enquiryState = lastContext?.enquiryState || {
            active: false,
            step: 'IDLE', // 'COLLECTING' | 'SELECTING_MODE' | 'SELECTING_ORIGIN_PORT' | 'SELECTING_DEST_PORT' | 'MATCHING_DISPLAYED' | 'BROADCAST_CONFIRMATION' | 'DONE'
            data: {
                commodity: '',
                weight: '',
                mode: '', // 'sea' | 'air' | 'land'
                originCountry: '',
                originPort: '',
                destinationCountry: '',
                destinationPort: ''
            },
            portOptions: [],
            matchingVendors: [],
            availableRates: [],
            selectedVendor: null,
            broadcastConfirmed: false
        };

        // Action 03: Shipping Routes & Port Guide State Tracking
        let guideState = lastContext?.guideState || {
            active: false,
            subType: '', // 'PORTS' | 'ROUTES'
            step: 'IDLE', // 'SELECTING_TYPE' | 'ASK_PORT_COUNTRY' | 'DISPLAY_PORTS' | 'ASK_ROUTE_ORIGIN' | 'ASK_ROUTE_DEST' | 'DONE'
            country: '',
            portsList: [],
            routeOriginCountry: '',
            routeDestCountry: ''
        };

        let newContext = { ...(lastContext || {}), enquiryState, guideState };
        let botReply = '';
        let vendors = [];
        let rates = [];
        let options = [];
        let enquirySummary = null;

        // =========================================================================
        // CHECK IF USER WANTS TO START OR IS IN A CONVERSATIONAL ENQUIRY FLOW
        // =========================================================================
        const isSearchBestQuote =
            q.includes('search best quote') ||
            q.includes('search best freight quote') ||
            q.includes('best quote') ||
            q.includes('search quote') ||
            q.includes('compare freight') ||
            q.includes('live price') ||
            q.includes('find best rate') ||
            q.includes('check rate');

        const isRouteInquiry =
            q.includes('shipping routes & port guide') ||
            q.includes('shipping route') ||
            q.includes('port guide') ||
            /ship.*from.*to/i.test(q) ||
            /send.*from.*to/i.test(q) ||
            (q.includes('route') && (q.includes('india') || q.includes('china') || q.includes('dubai') || q.includes('sea') || q.includes('air')));

        const isDirectQuoteRequest =
            isSearchBestQuote ||
            q.includes('freight quote') ||
            q.includes('request quote') ||
            q.includes('rate quote') ||
            q.includes('need quote') ||
            q.includes('book shipment') ||
            q.includes('book cargo') ||
            q.includes('quote for');

        const isEnquiryInitiator = isDirectQuoteRequest || isRouteInquiry;

        // Check if user is answering a numbered option (e.g. "1", "2", "3", "option 1")
        const numberMatch = q.match(/^(?:option\s*)?([1-9]|10)$/i);
        const selectedNumber = numberMatch ? parseInt(numberMatch[1], 10) : null;

        // -------------------------------------------------------------------------
        // STATE 0: SELECTING TRANSPORT MODE (Sea, Air, Land, CHA / Customs)
        // -------------------------------------------------------------------------
        if (enquiryState.active && enquiryState.step === 'SELECTING_MODE') {
            if (selectedNumber === 1 || q.includes('sea') || q.includes('ocean')) {
                enquiryState.data.mode = 'sea';
            } else if (selectedNumber === 2 || q.includes('air') || q.includes('flight')) {
                enquiryState.data.mode = 'air';
            } else if (selectedNumber === 3 || q.includes('land') || q.includes('road') || q.includes('truck')) {
                enquiryState.data.mode = 'land';
            } else if (selectedNumber === 4 || q.includes('cha') || q.includes('custom')) {
                enquiryState.data.mode = 'cha';
            } else {
                enquiryState.data.mode = 'sea'; // default fallback
            }

            enquiryState.step = 'COLLECTING';
        }

        // -------------------------------------------------------------------------
        // STATE 1: SELECTING ORIGIN PORT (From dynamic DB list)
        // -------------------------------------------------------------------------
        if (enquiryState.active && enquiryState.step === 'SELECTING_ORIGIN_PORT') {
            let chosenPort = null;
            if (selectedNumber && enquiryState.portOptions && enquiryState.portOptions[selectedNumber - 1]) {
                chosenPort = enquiryState.portOptions[selectedNumber - 1].name;
            } else {
                // Match text input against available options
                const found = enquiryState.portOptions.find(p =>
                    p.name.toLowerCase().includes(q) ||
                    (p.code && p.code.toLowerCase() === q) ||
                    (p.city && p.city.toLowerCase().includes(q))
                );
                if (found) {
                    chosenPort = found.name;
                } else {
                    // Normalize with raw text
                    chosenPort = raw;
                }
            }

            enquiryState.data.originPort = chosenPort;
            enquiryState.portOptions = []; // Clear current options

            // Next step: Check if Destination Country is present
            if (!enquiryState.data.destinationCountry) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? `⚓ **Origin Port set to: ${chosenPort}**\n\nAb kripya **Destination Country** batayein (Jaise: *China*, *USA*, *UAE*, *Germany*):`
                    : `⚓ **Origin Port confirmed:** **${chosenPort}**\n\nPlease specify the **Destination Country** (e.g., *China*, *USA*, *UAE*, *Germany*):`;
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            } else {
                // Fetch destination ports
                const destPorts = await getPortsByCountryFromDb(enquiryState.data.destinationCountry, enquiryState.data.mode);
                if (destPorts.length > 0) {
                    enquiryState.step = 'SELECTING_DEST_PORT';
                    enquiryState.portOptions = destPorts;
                    options = destPorts.map((p, idx) => ({ number: idx + 1, label: p.name, code: p.code, city: p.city }));

                    let portListText = destPorts.map((p, idx) => `${idx + 1}. **${p.name}** ${p.code ? `(${p.code})` : ''} - *${p.city || ''}*`).join('\n');
                    botReply = userWantsHindi
                        ? `⚓ **Origin Port confirmed:** **${chosenPort}**\n\nKripya **${enquiryState.data.destinationCountry}** me destination port select karein (Number type karein ya port ka naam):\n\n${portListText}`
                        : `⚓ **Origin Port confirmed:** **${chosenPort}**\n\nPlease select your **Destination Port** in **${enquiryState.data.destinationCountry}** (Type option number or port name):\n\n${portListText}`;

                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    enquiryState.step = 'COLLECTING';
                    botReply = userWantsHindi
                        ? `⚓ **Origin Port:** **${chosenPort}**\n\nKripya **Destination Port / City** ka naam likhein (${enquiryState.data.destinationCountry}):`
                        : `⚓ **Origin Port:** **${chosenPort}**\n\nPlease enter the **Destination Port or Terminal Name** in **${enquiryState.data.destinationCountry}**:`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }
        }

        // -------------------------------------------------------------------------
        // STATE 2: SELECTING DESTINATION PORT (From dynamic DB list)
        // -------------------------------------------------------------------------
        if (enquiryState.active && enquiryState.step === 'SELECTING_DEST_PORT') {
            let chosenPort = null;
            if (selectedNumber && enquiryState.portOptions && enquiryState.portOptions[selectedNumber - 1]) {
                chosenPort = enquiryState.portOptions[selectedNumber - 1].name;
            } else {
                const found = enquiryState.portOptions.find(p =>
                    p.name.toLowerCase().includes(q) ||
                    (p.code && p.code.toLowerCase() === q) ||
                    (p.city && p.city.toLowerCase().includes(q))
                );
                if (found) {
                    chosenPort = found.name;
                } else {
                    chosenPort = raw;
                }
            }

            enquiryState.data.destinationPort = chosenPort;
            enquiryState.portOptions = [];

            // Next: Check Cargo Load Type / Weight
            if (!enquiryState.data.weight) {
                enquiryState.step = 'COLLECTING';
                if (enquiryState.data.mode === 'sea') {
                    options = [
                        { number: 1, label: '20ft Standard Container (FCL)' },
                        { number: 2, label: '40ft Standard Container (FCL)' },
                        { number: 3, label: '40ft High Cube HC (FCL)' },
                        { number: 4, label: 'Less than Container Load (LCL / CBM)' }
                    ];
                    botReply = userWantsHindi
                        ? `🏁 **Destination Port confirmed:** **${chosenPort}**\n\nAb kripya **Cargo / Load Type** select karein (Option click karein ya load type likhein):\n\n1. **20ft Standard Container (FCL)**\n2. **40ft Standard Container (FCL)**\n3. **40ft High Cube HC (FCL)**\n4. **Less than Container Load (LCL / CBM)**`
                        : `🏁 **Destination Port confirmed:** **${chosenPort}**\n\nPlease select your **Cargo / Load Type** (Click an option or type your load):\n\n1. **20ft Standard Container (FCL)**\n2. **40ft Standard Container (FCL)**\n3. **40ft High Cube HC (FCL)**\n4. **Less than Container Load (LCL / CBM)**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else if (enquiryState.data.mode === 'air') {
                    options = [
                        { number: 1, label: '0 - 50 kg' },
                        { number: 2, label: '50 - 100 kg' },
                        { number: 3, label: '100 - 500 kg' },
                        { number: 4, label: '500+ kg' }
                    ];
                    botReply = userWantsHindi
                        ? `🏁 **Destination Airport confirmed:** **${chosenPort}**\n\nAb kripya **Air Cargo Weight Class** select karein:\n\n1. **0 - 50 kg**\n2. **50 - 100 kg**\n3. **100 - 500 kg**\n4. **500+ kg**`
                        : `🏁 **Destination Airport confirmed:** **${chosenPort}**\n\nPlease select the **Air Cargo Weight Class**:\n\n1. **0 - 50 kg**\n2. **50 - 100 kg**\n3. **100 - 500 kg**\n4. **500+ kg**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    botReply = userWantsHindi
                        ? `🏁 **Destination set to: ${chosenPort}**\n\nIs shipment ka **approximate weight ya load type** kya hai? (Jaise: *500 kg*, *10 Ton*, *FTL Truck*):`
                        : `🏁 **Destination confirmed:** **${chosenPort}**\n\nWhat is the approximate **cargo weight or load type**? (e.g., *500 kg*, *10 Ton*, *FTL Truck*):`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }

            // Next: Check Commodity
            if (!enquiryState.data.commodity) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? `🏁 **Destination Port set to: ${chosenPort}**\n\nAap kaunsa **saman / commodity** bhejna chahte hain? (Jaise: *Textiles*, *Auto Parts*, *Machinery*, *Chemicals*):`
                    : `🏁 **Destination Port confirmed:** **${chosenPort}**\n\nWhat **commodity (goods)** are you shipping? (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):`;
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            enquiryState.step = 'MATCHING_DISPLAYED';
        }

        // -------------------------------------------------------------------------
        // STATE 3: BROADCAST CONFIRMATION / SPECIFIC VENDOR SELECTION
        // -------------------------------------------------------------------------
        if (enquiryState.active && enquiryState.step === 'BROADCAST_CONFIRMATION') {
            const isAffirmative = /^(yes|haan|ha|broadcast|all|bhejo|send|proceed|confirm|1|2)/i.test(q);
            const isNegative = /^(no|nahi|na|cancel|don't|stop)/i.test(q);

            if (isNegative) {
                enquiryState.active = false;
                enquiryState.step = 'IDLE';
                newContext.enquiryState = enquiryState;
                botReply = userWantsHindi
                    ? "Inquiry broadcast cancel kar diya gaya hai. Agar aapko koi aur route check karna ho ya information chahiye ho, to batayein!"
                    : "Enquiry broadcast has been cancelled. Let me know if you would like to explore any other shipping route or requirement!";
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (isAffirmative || selectedNumber) {
                // If user selected "1" or typed broadcast / yes -> Broadcast to ALL matching forwarders (targetVendorId = null)
                // If user selected option 2 or higher -> send to specific numbered vendor
                let targetVendorId = null;
                let targetVendorName = null;

                const isBroadcastChoice = selectedNumber === 1 || q.includes('broadcast') || q.includes('all');

                if (!isBroadcastChoice && selectedNumber && selectedNumber > 1 && selectedNumber <= (enquiryState.matchingVendors.length + 1)) {
                    // Specific vendor selected (e.g. 2, 3, 4...)
                    const vIndex = selectedNumber - 2;
                    if (enquiryState.matchingVendors[vIndex]) {
                        targetVendorId = enquiryState.matchingVendors[vIndex]._id;
                        targetVendorName = enquiryState.matchingVendors[vIndex].company || enquiryState.matchingVendors[vIndex].name;
                    }
                }

                // Create Enquiry in Database
                try {
                    const isBroadcast = !targetVendorId;
                    const enquiryPayload = {
                        client: loggedInUserDoc ? loggedInUserDoc._id : null,
                        guestName: loggedInUserDoc ? (loggedInUserDoc.name || loggedInUserDoc.company || '') : (clientUserData?.name || ''),
                        guestEmail: loggedInUserDoc ? (loggedInUserDoc.email || '') : (clientUserData?.email || ''),
                        guestPhone: loggedInUserDoc ? (loggedInUserDoc.phone || '') : (clientUserData?.phone || ''),
                        guestCompany: loggedInUserDoc ? (loggedInUserDoc.company || '') : (clientUserData?.company || ''),
                        fromLocation: `${enquiryState.data.originPort || enquiryState.data.originCountry}`,
                        toLocation: `${enquiryState.data.destinationPort || enquiryState.data.destinationCountry}`,
                        type: enquiryState.data.mode || 'sea',
                        category: 'international',
                        commodity: enquiryState.data.commodity || 'General Goods',
                        weightRange: enquiryState.data.weight || 'As discussed',
                        message: `Conversational AI Enquiry | Route: ${enquiryState.data.originPort || enquiryState.data.originCountry} → ${enquiryState.data.destinationPort || enquiryState.data.destinationCountry} | Load: ${enquiryState.data.weight || 'Standard'}`,
                        vendor: targetVendorId || null,
                        isDirect: Boolean(targetVendorId),
                        broadcastNow: isBroadcast,
                        status: 'Pending',
                        source: 'web'
                    };

                    const newEnquiry = await Enquiry.create(enquiryPayload);

                    if (targetVendorId) {
                        // Direct enquiry to specific vendor
                        botReply = `🎉 **Enquiry Successfully Submitted!**\n\n• **Vendor:** **${targetVendorName}**\n• **Route:** ${enquiryState.data.originPort || enquiryState.data.originCountry} → ${enquiryState.data.destinationPort || enquiryState.data.destinationCountry}\n• **Cargo Load:** ${enquiryState.data.weight || 'Standard'}\n\nThe vendor has been notified and will review your cargo specs to provide customized rates shortly.`;
                    } else {
                        // Broadcast enquiry to all matching vendors
                        await triggerVendorBroadcast(newEnquiry._id);
                        botReply = `📢 **Enquiry Successfully Broadcasted to All Forwarders!**\n\n• **Route:** ${enquiryState.data.originPort || enquiryState.data.originCountry} → ${enquiryState.data.destinationPort || enquiryState.data.destinationCountry}\n• **Cargo Mode:** ${(enquiryState.data.mode || 'sea').toUpperCase()} Freight\n• **Cargo Load:** ${enquiryState.data.weight || 'Standard'}\n\nYour enquiry has been delivered to all matching verified logistics forwarders on this route. They will submit competitive spot rate quotations directly!`;
                    }

                    enquiryState.active = false;
                    enquiryState.step = 'DONE';
                    newContext.enquiryState = enquiryState;

                    return res.json({
                        success: true,
                        reply: botReply,
                        enquiryCreated: true,
                        enquiryId: newEnquiry._id,
                        context: newContext
                    });
                } catch (createErr) {
                    console.error("Enquiry creation error:", createErr);
                    botReply = "There was an issue registering your enquiry. Please try again.";
                    return res.json({ success: false, reply: botReply, context: newContext });
                }
            }
        }

        // -------------------------------------------------------------------------
        // ACTION 03: SHIPPING ROUTES & PORT GUIDE CONVERSATIONAL FLOW
        // -------------------------------------------------------------------------
        // 1. Initial trigger of Action 03 (e.g. "Shipping Routes & Port Guide")
        if (q.includes('shipping routes & port guide') || q.includes('port guide') || q.includes('route guide') || (!guideState.active && q === 'shipping routes')) {
            guideState.active = true;
            guideState.step = 'SELECTING_TYPE';
            guideState.subType = '';
            newContext.guideState = guideState;

            options = [
                { number: 1, label: '⚓ Port Guide & Terminal Directory' },
                { number: 2, label: '🚢 Shipping Routes & Freight Analysis' }
            ];

            botReply = `🧭 **Shipping Routes & Port Guide Explorer:**\n\nWhat would you like to explore today? (Please select an option below):\n\n1. ⚓ **Port Guide & Terminal Directory** (Explore seaports by country & get comprehensive terminal intelligence)\n2. 🚢 **Shipping Routes & Freight Analysis** (Analyze end-to-end trade routes, transit schedules & port pairs)`;

            return res.json({ success: true, reply: botReply, options, context: newContext });
        }

        // 2. Active in Guide State
        if (guideState.active) {
            // STEP 1: User picks Ports (Option 1) vs Routes (Option 2)
            if (guideState.step === 'SELECTING_TYPE') {
                if (selectedNumber === 1 || q.includes('port')) {
                    guideState.subType = 'PORTS';
                    guideState.step = 'ASK_PORT_COUNTRY';
                    newContext.guideState = guideState;

                    options = [
                        { number: 1, label: 'India' },
                        { number: 2, label: 'China' },
                        { number: 3, label: 'United Arab Emirates' },
                        { number: 4, label: 'United States' }
                    ];

                    botReply = `⚓ **Port Guide & Terminal Directory:**\n\nWhich **Country's** ports would you like to explore? (Click an option below or type any country name, e.g., *India*, *China*, *UAE*, *USA*, *Germany*):`;

                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else if (selectedNumber === 2 || q.includes('route') || q.includes('shipping')) {
                    guideState.subType = 'ROUTES';
                    guideState.step = 'ASK_ROUTE_ORIGIN';
                    newContext.guideState = guideState;

                    options = [
                        { number: 1, label: 'India' },
                        { number: 2, label: 'China' },
                        { number: 3, label: 'United Arab Emirates' },
                        { number: 4, label: 'United States' }
                    ];

                    botReply = `🚢 **Shipping Routes & Freight Analysis:**\n\nPlease select or type your **Origin Country** (e.g., *India*, *China*, *UAE*, *USA*):`;

                    return res.json({ success: true, reply: botReply, options, context: newContext });
                }
            }

            // --- BRANCH A: PORT DIRECTORY ---
            // STEP A2: User provides country for Port Directory
            if (guideState.subType === 'PORTS' && guideState.step === 'ASK_PORT_COUNTRY') {
                let countryName = matchedCountry;
                if (!countryName) {
                    if (selectedNumber === 1) countryName = 'India';
                    else if (selectedNumber === 2) countryName = 'China';
                    else if (selectedNumber === 3) countryName = 'United Arab Emirates';
                    else if (selectedNumber === 4) countryName = 'United States';
                    else countryName = raw.trim();
                }

                guideState.country = countryName;

                // Query DB for seaports in this country
                const dbPorts = await Location.find({
                    country: new RegExp(countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                    type: { $in: ['Seaport', 'Airport'] }
                }).select('name code city type').limit(15).lean();

                if (dbPorts && dbPorts.length > 0) {
                    guideState.portsList = dbPorts;
                    guideState.step = 'SELECT_PORT_DETAILS';
                    newContext.guideState = guideState;

                    const portListDisplay = dbPorts.slice(0, 8).map((p, idx) => 
                        `${idx + 1}. **${p.name}** (${p.code || p.city}) - *${p.type}*`
                    ).join('\n');

                    options = dbPorts.slice(0, 8).map((p, idx) => ({
                        number: idx + 1,
                        label: `${p.name} (${p.code || p.city})`,
                        code: p.code
                    }));

                    botReply = `⚓ **Major Commercial Ports in ${countryName} (from Portal Database):**\n\n${portListDisplay}\n\nType a port number or port name to get comprehensive operational intelligence, terminal handling specifications, and active forwarders:`;

                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    // Fallback LLM if country not yet populated in Location master
                    const llmPortPrompt = `List the top 6 commercial cargo ports in ${countryName} with UN/LOCODE and key logistics features. Format clearly with bullet points.`;
                    const aiPortList = await queryOpenRouter(llmPortPrompt, false, history);
                    guideState.step = 'SELECT_PORT_DETAILS';
                    newContext.guideState = guideState;

                    botReply = aiPortList || `Found major ports for ${countryName}. Please specify which port you would like an operational brief for:`;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }

            // STEP A3: User specifies a port name to get AI brief & matching forwarders
            if (guideState.subType === 'PORTS' && guideState.step === 'SELECT_PORT_DETAILS') {
                let chosenPort = raw.trim();
                if (selectedNumber && guideState.portsList && guideState.portsList[selectedNumber - 1]) {
                    chosenPort = guideState.portsList[selectedNumber - 1].name;
                }

                // AI Brief about this port
                const portBriefPrompt = `Provide a concise, professional operational logistics brief for the port "${chosenPort}" in ${guideState.country || 'Global'}:
1. **Key Capabilities & Terminal Infrastructure**: Container handling (TEUs), depth draft, and berthing.
2. **Connectivity & Hinterland Rail/Road Access**: Dedicated freight corridors, CFS networks.
3. **Major Trade Lanes & Carriers**: Key shipping lines and international sectors serviced.
4. **Customs & Terminal Highlights**: 24/7 scanning, gate-in cutoff windows, and efficiency tips for shippers.`;

                const aiPortBrief = await queryOpenRouter(portBriefPrompt, false, history);

                // Fetch portal forwarders covering this port or country
                vendors = await fetchRankedVendorsForRoute(
                    {
                        $or: [
                            { portsCovered: new RegExp(chosenPort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                            { serviceLocations: new RegExp(guideState.country || '', 'i') },
                            { countriesServed: new RegExp(guideState.country || '', 'i') }
                        ]
                    },
                    12
                );

                botReply = (aiPortBrief || `Here is the operational overview for **${chosenPort}**: Major commercial hub handling international containerized and bulk cargo.`) +
                    `\n\n📍 **Verified Logistics Forwarders Covering ${chosenPort}:**\nBelow are active forwarders available to handle shipments at this port:`;

                guideState.active = false;
                guideState.step = 'DONE';
                newContext.guideState = guideState;

                return res.json({ success: true, reply: botReply, vendors, context: newContext });
            }

            // --- BRANCH B: SHIPPING ROUTES ANALYSIS ---
            // STEP B1: User provides Origin Country
            if (guideState.subType === 'ROUTES' && guideState.step === 'ASK_ROUTE_ORIGIN') {
                let origin = matchedCountry;
                if (!origin) {
                    if (selectedNumber === 1) origin = 'India';
                    else if (selectedNumber === 2) origin = 'China';
                    else if (selectedNumber === 3) origin = 'United Arab Emirates';
                    else if (selectedNumber === 4) origin = 'United States';
                    else origin = raw.trim();
                }

                guideState.routeOriginCountry = origin;
                guideState.step = 'ASK_ROUTE_DEST';
                newContext.guideState = guideState;

                options = [
                    { number: 1, label: 'China' },
                    { number: 2, label: 'United States' },
                    { number: 3, label: 'United Arab Emirates' },
                    { number: 4, label: 'Germany' }
                ];

                botReply = `🏁 **Origin Country set to:** **${origin}**\n\nNow, please select or type your **Destination Country** (e.g., *China*, *USA*, *UAE*, *Germany*):`;

                return res.json({ success: true, reply: botReply, options, context: newContext });
            }

            // STEP B2: User provides Destination Country -> Get ports of both countries & AI Route Analysis
            if (guideState.subType === 'ROUTES' && guideState.step === 'ASK_ROUTE_DEST') {
                let dest = matchedCountry;
                if (!dest) {
                    if (selectedNumber === 1) dest = 'China';
                    else if (selectedNumber === 2) dest = 'United States';
                    else if (selectedNumber === 3) dest = 'United Arab Emirates';
                    else if (selectedNumber === 4) dest = 'Germany';
                    else dest = raw.trim();
                }

                guideState.routeDestCountry = dest;
                const originCountry = guideState.routeOriginCountry || 'India';
                const destCountry = dest;

                // Fetch ports of origin country from DB
                const originPorts = await Location.find({
                    country: new RegExp(originCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                    type: 'Seaport'
                }).select('name code').limit(5).lean();

                // Fetch ports of destination country from DB
                const destPorts = await Location.find({
                    country: new RegExp(destCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                    type: 'Seaport'
                }).select('name code').limit(5).lean();

                const originPortsListStr = originPorts.length > 0 
                    ? originPorts.map(p => `${p.name} (${p.code || 'Seaport'})`).join(', ') 
                    : 'Major national gateway ports';

                const destPortsListStr = destPorts.length > 0 
                    ? destPorts.map(p => `${p.name} (${p.code || 'Seaport'})`).join(', ') 
                    : 'Major international gateway ports';

                // Query AI for complete Shipping Route intelligence
                const routeAnalysisPrompt = `You are a Senior Maritime Logistics & Freight Routing Expert on Logistics Scanner.
Provide an in-depth shipping route and port analysis for:
Route: ${originCountry} -> ${destCountry}
Database Loading Ports in ${originCountry}: ${originPortsListStr}
Database Discharge Ports in ${destCountry}: ${destPortsListStr}

Please structure your report into clear, professional sections:
1. **Primary Port-to-Port Pairings**: (Optimal maritime pairings between loading and discharge ports).
2. **Transit Times & Shipping Lines**: (Average ocean transit in days, direct sailings vs transshipment hubs like Singapore/Colombo/Jebel Ali, major ocean carriers operating on this trade lane).
3. **Freight Rate Benchmarks & Cost Structure**: (Typical indicative rate bands for 20ft & 40ft FCL and LCL per CBM, bunker surcharges, peak season factors).
4. **Key Customs & Compliance Documents**: (Export shipping bill, commercial invoice, packing list, certificate of origin, HS code guidelines).
5. **Operational Pro-Tips for Shippers**: (Cutoff windows, container detention/demurrage precautions).

Keep formatting clean with clear markdown bold headers.`;

                const aiRouteReport = await queryOpenRouter(routeAnalysisPrompt, false, history);

                // Fetch 12 Ranked Verified Vendors for this trade route
                vendors = await fetchRankedVendorsForRoute(
                    {
                        $or: [
                            { countriesServed: new RegExp(destCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                            { serviceLocations: new RegExp(originCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
                        ]
                    },
                    12
                );

                botReply = (aiRouteReport || `🚢 **Trade Route Guide: ${originCountry} → ${destCountry}**\n\n• **Transit Times:** Ocean Freight approx 15–25 days.\n• **Major Ports:** ${originPortsListStr} → ${destPortsListStr}.\n• **Documentation:** Invoice, Packing List, Shipping Bill, Certificate of Origin.`) +
                    `\n\n📍 **Verified Freight Forwarders for ${originCountry} → ${destCountry}:**\nHere are 12 verified forwarders actively handling this trade route. You can review their verified profiles or connect directly:`;

                guideState.active = false;
                guideState.step = 'DONE';
                newContext.guideState = guideState;

                return res.json({
                    success: true,
                    reply: botReply,
                    vendors,
                    rates: [],
                    context: newContext
                });
            }
        }

        // -------------------------------------------------------------------------
        // STATE 4: NORMAL EXTRACTION & STEP-BY-STEP PROGRESSION
        // -------------------------------------------------------------------------
        if (isEnquiryInitiator || enquiryState.active) {
            enquiryState.active = true;

            // Extract entities with AI intelligence (Normalizing input)
            const aiExtracted = await extractEnquiryEntitiesWithAI(raw, enquiryState.data);
            if (aiExtracted) {
                if (aiExtracted.commodity && !enquiryState.data.commodity) enquiryState.data.commodity = aiExtracted.commodity;
                if (aiExtracted.weight && !enquiryState.data.weight) enquiryState.data.weight = aiExtracted.weight;
                if (aiExtracted.mode) enquiryState.data.mode = aiExtracted.mode;
                if (aiExtracted.originCountry && !enquiryState.data.originCountry) enquiryState.data.originCountry = aiExtracted.originCountry;
                if (aiExtracted.destinationCountry && !enquiryState.data.destinationCountry) enquiryState.data.destinationCountry = aiExtracted.destinationCountry;
                if (aiExtracted.originPort && !enquiryState.data.originPort) enquiryState.data.originPort = aiExtracted.originPort;
                if (aiExtracted.destinationPort && !enquiryState.data.destinationPort) enquiryState.data.destinationPort = aiExtracted.destinationPort;
            }

            // Fallback keyword detection for common locations
            if (!enquiryState.data.originCountry) {
                if (q.includes('india')) enquiryState.data.originCountry = 'India';
                else if (q.includes('china')) enquiryState.data.originCountry = 'China';
                else if (q.includes('dubai') || q.includes('uae')) enquiryState.data.originCountry = 'United Arab Emirates';
                else if (q.includes('usa')) enquiryState.data.originCountry = 'USA';
            }

            if (!enquiryState.data.destinationCountry) {
                if (q.includes('to china')) enquiryState.data.destinationCountry = 'China';
                else if (q.includes('to dubai') || q.includes('to uae')) enquiryState.data.destinationCountry = 'United Arab Emirates';
                else if (q.includes('to usa')) enquiryState.data.destinationCountry = 'USA';
                else if (q.includes('to india')) enquiryState.data.destinationCountry = 'India';
            }

            // Also check if commodity was typed as single words (e.g. "textiles", "spices", "clothes")
            if (!enquiryState.data.commodity) {
                const commodityKeywords = ['textile', 'textiles', 'garments', 'clothes', 'machinery', 'chemicals', 'electronics', 'auto parts', 'pharma', 'food', 'ceramic', 'steel', 'spices'];
                const matchedComm = commodityKeywords.find(c => q.includes(c));
                if (matchedComm) {
                    enquiryState.data.commodity = raw;
                }
            }

            // Also check if weight/load was typed or selected by option number
            if (!enquiryState.data.weight) {
                if (selectedNumber && enquiryState.data.destinationPort) {
                    if (enquiryState.data.mode === 'sea') {
                        const seaLoadOptions = ['20ft Standard Container (FCL)', '40ft Standard Container (FCL)', '40ft High Cube HC (FCL)', 'Less than Container Load (LCL / CBM)'];
                        if (seaLoadOptions[selectedNumber - 1]) {
                            enquiryState.data.weight = seaLoadOptions[selectedNumber - 1];
                        }
                    } else if (enquiryState.data.mode === 'air') {
                        const airWeightOptions = ['0 - 50 kg', '50 - 100 kg', '100 - 500 kg', '500+ kg'];
                        if (airWeightOptions[selectedNumber - 1]) {
                            enquiryState.data.weight = airWeightOptions[selectedNumber - 1];
                        }
                    }
                }
                const weightPattern = /\b(\d+(?:\.\d+)?\s*(?:kg|kgs|ton|tons|tonne|cbm|ft|container))\b/i;
                const matchW = raw.match(weightPattern);
                if (matchW) {
                    enquiryState.data.weight = matchW[1];
                } else if (/fcl|lcl|20ft|40ft|container/i.test(q)) {
                    enquiryState.data.weight = raw;
                }
            }

            // =========================================================================
            // STEP 1: TRANSPORT MODE SELECTION (Sea, Air, Land/Truck, CHA Customs)
            // =========================================================================
            if (!enquiryState.data.mode) {
                // If user wrote sea, air, land, cha as distinct words in message
                if (/\b(sea|ocean|fcl|lcl|ship|port)\b/i.test(q) && !q.includes('search')) {
                    enquiryState.data.mode = 'sea';
                } else if (/\b(air|flight|airline|airport)\b/i.test(q)) {
                    enquiryState.data.mode = 'air';
                } else if (/\b(land|truck|trucking|road|ftl|ptl)\b/i.test(q)) {
                    enquiryState.data.mode = 'land';
                } else if (/\b(cha|customs?|clearance)\b/i.test(q)) {
                    enquiryState.data.mode = 'cha';
                } else {
                    enquiryState.step = 'SELECTING_MODE';
                    options = [
                        { number: 1, label: '🌊 Ocean / Sea Freight (FCL / LCL)' },
                        { number: 2, label: '✈️ Air Cargo (Airport-to-Airport / Express)' },
                        { number: 3, label: '🚛 Land / Surface Freight (FTL / PTL)' },
                        { number: 4, label: '📋 Customs Clearance / CHA Port Services' }
                    ];
                    botReply = userWantsHindi
                        ? `🚢 **Aap kaun sa shipment mode book ya search karna chahte hain?** (Option number click ya type karein):\n\n1. **🌊 Ocean / Sea Freight (FCL / LCL)**\n2. **✈️ Air Cargo (Commercial Air / Express)**\n3. **🚛 Land / Surface Freight (FTL / PTL Trucking)**\n4. **📋 Customs Clearance / CHA Port Services**`
                        : `🚢 **Please select your Shipment Mode:** (Click an option or type 1, 2, 3, or 4):\n\n1. **🌊 Ocean / Sea Freight (FCL / LCL)**\n2. **✈️ Air Cargo (Commercial Air / Express)**\n3. **🚛 Land / Surface Freight (FTL / PTL Trucking)**\n4. **📋 Customs Clearance / CHA Port Services**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                }
            }

            // =========================================================================
            // STEP 2: ORIGIN LOCATION (Country / Port / City)
            // =========================================================================
            if (!enquiryState.data.originCountry) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? "🌍 **Shipment ka Origin Country / City kaunsa hai?** (Jaise: *India*, *China*, *UAE*, *USA*):"
                    : "🌍 **What is your Origin Country or City?** (e.g., *India*, *China*, *UAE*, *USA*):";
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.originPort) {
                // Fetch ports from DB for Origin Country based on selected mode
                const originPorts = await getPortsByCountryFromDb(enquiryState.data.originCountry, enquiryState.data.mode);
                const modeLabel = enquiryState.data.mode === 'air' ? 'Airport Hub' : (enquiryState.data.mode === 'land' ? 'Terminal / Hub' : 'Sea Port');
                if (originPorts.length > 0) {
                    enquiryState.step = 'SELECTING_ORIGIN_PORT';
                    enquiryState.portOptions = originPorts;
                    options = originPorts.map((p, idx) => ({ number: idx + 1, label: p.name, code: p.code, city: p.city }));

                    let portListText = originPorts.map((p, idx) => `${idx + 1}. **${p.name}** ${p.code ? `(${p.code})` : ''} - *${p.city || ''}*`).join('\n');
                    botReply = userWantsHindi
                        ? `⚓ **${enquiryState.data.originCountry} me apna Origin ${modeLabel} select karein** (Option number type karein ya port name):\n\n${portListText}`
                        : `⚓ **Please select your Origin ${modeLabel} in ${enquiryState.data.originCountry}** (Type option number or port name):\n\n${portListText}`;

                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    enquiryState.step = 'COLLECTING';
                    botReply = userWantsHindi
                        ? `⚓ **Kripya ${enquiryState.data.originCountry} me Origin ${modeLabel} ya City ka naam batayein:**`
                        : `⚓ **Please enter your Origin ${modeLabel} or loading city in ${enquiryState.data.originCountry}:**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }

            // =========================================================================
            // STEP 3: DESTINATION LOCATION (Country / Port / City)
            // =========================================================================
            if (!enquiryState.data.destinationCountry) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? "🏁 **Shipment ka Destination Country / City kaunsa hai?** (Jaise: *China*, *UAE*, *USA*, *Germany*):"
                    : "🏁 **What is your Destination Country or City?** (e.g., *China*, *UAE*, *USA*, *Germany*):";
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.destinationPort) {
                const destPorts = await getPortsByCountryFromDb(enquiryState.data.destinationCountry, enquiryState.data.mode);
                const modeLabel = enquiryState.data.mode === 'air' ? 'Airport Terminal' : 'Sea Port';
                if (destPorts.length > 0) {
                    enquiryState.step = 'SELECTING_DEST_PORT';
                    enquiryState.portOptions = destPorts;
                    options = destPorts.map((p, idx) => ({ number: idx + 1, label: p.name, code: p.code, city: p.city }));

                    let portListText = destPorts.map((p, idx) => `${idx + 1}. **${p.name}** ${p.code ? `(${p.code})` : ''} - *${p.city || ''}*`).join('\n');
                    botReply = userWantsHindi
                        ? `⚓ **${enquiryState.data.destinationCountry} me Destination ${modeLabel} select karein** (Option number type karein ya port name):\n\n${portListText}`
                        : `⚓ **Please select your Destination ${modeLabel} in ${enquiryState.data.destinationCountry}** (Type the option number or port name):\n\n${portListText}`;

                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    enquiryState.step = 'COLLECTING';
                    botReply = userWantsHindi
                        ? `⚓ **Kripya ${enquiryState.data.destinationCountry} me Destination Port ya City ka naam batayein:**`
                        : `⚓ **Please enter your Destination Port or city in ${enquiryState.data.destinationCountry}:**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }

            // =========================================================================
            // STEP 4: CARGO LOAD TYPE / WEIGHT DETAILS
            // =========================================================================
            if (!enquiryState.data.weight) {
                enquiryState.step = 'COLLECTING';
                if (enquiryState.data.mode === 'sea') {
                    options = [
                        { number: 1, label: '20ft Standard Container (FCL)' },
                        { number: 2, label: '40ft Standard Container (FCL)' },
                        { number: 3, label: '40ft High Cube HC (FCL)' },
                        { number: 4, label: 'Less than Container Load (LCL / CBM)' }
                    ];
                    botReply = userWantsHindi
                        ? `📦 **Cargo / Load Type select karein** (Option number click karein ya weight/volume type karein jaise *500 kg*, *5 CBM*):\n\n1. **20ft Standard Container (FCL)**\n2. **40ft Standard Container (FCL)**\n3. **40ft High Cube HC (FCL)**\n4. **Less than Container Load (LCL / CBM)**`
                        : `📦 **Please select your Cargo / Load Type** (Click an option or type custom weight like *500 kg* or *5 CBM*):\n\n1. **20ft Standard Container (FCL)**\n2. **40ft Standard Container (FCL)**\n3. **40ft High Cube HC (FCL)**\n4. **Less than Container Load (LCL / CBM)**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else if (enquiryState.data.mode === 'air') {
                    options = [
                        { number: 1, label: '0 - 50 kg' },
                        { number: 2, label: '50 - 100 kg' },
                        { number: 3, label: '100 - 500 kg' },
                        { number: 4, label: '500+ kg' }
                    ];
                    botReply = userWantsHindi
                        ? `📦 **Air Cargo Weight Class select karein** (Option number click karein ya weight type karein jaise *75 kg*):\n\n1. **0 - 50 kg**\n2. **50 - 100 kg**\n3. **100 - 500 kg**\n4. **500+ kg**`
                        : `📦 **Please select Air Cargo Weight Class** (Click an option or type exact weight like *75 kg*):\n\n1. **0 - 50 kg**\n2. **50 - 100 kg**\n3. **100 - 500 kg**\n4. **500+ kg**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                } else {
                    botReply = userWantsHindi
                        ? `📦 Is shipment ka **approximate weight ya vehicle load** kya hai? (Jaise: *500 kg*, *10 Ton*, *FTL Truck*):`
                        : `📦 What is the approximate **cargo weight or load**? (e.g., *500 kg*, *10 Ton*, *FTL Truck*):`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, context: newContext });
                }
            }

            // =========================================================================
            // ALL SEARCH FIELDS COLLECTED (Mode + Origin + Destination + Load/Weight):
            // SEARCH LIVE VENDOR RATES & VENDORS FROM DATABASE (Search Price Flow)
            // Commodity is collected at booking/enquiry time (like Search Results modal)
            // =========================================================================
            enquiryState.step = 'BROADCAST_CONFIRMATION';

            const originLabel = `${enquiryState.data.originPort || enquiryState.data.originCountry}`;
            const destLabel = `${enquiryState.data.destinationPort || enquiryState.data.destinationCountry}`;

            // 1. Search DB strictly for rates matching the specific origin port and destination port
            const dbRates = await findAvailableRatesForRoute(
                enquiryState.data.originPort,
                enquiryState.data.destinationPort,
                enquiryState.data.mode,
                enquiryState.data.weight
            );

            // 2. Search DB for matching verified vendors
            const dbVendors = await fetchRankedVendorsForRoute(
                {
                    $or: [
                        { countriesServed: new RegExp(enquiryState.data.destinationCountry || '', 'i') },
                        { portsCovered: new RegExp(enquiryState.data.destinationPort || '', 'i') },
                        { portsCovered: new RegExp(enquiryState.data.originPort || '', 'i') },
                        { serviceLocations: new RegExp(enquiryState.data.originCountry || '', 'i') }
                    ]
                },
                6
            );

            enquiryState.matchingVendors = dbVendors;
            enquiryState.availableRates = dbRates;
            vendors = dbVendors;
            rates = dbRates;

            let rateText = '';
            if (dbRates.length > 0) {
                rateText = `\n\n💰 **Live Matched Rates in Database (${dbRates.length}):**\n` +
                    dbRates.map((r, idx) => `• **${r.vendor?.company || r.vendor?.name || 'Verified Vendor'}**: **₹${r.price.toLocaleString('en-IN')}** ${r.currency || 'INR'} (${r.seaLoadType || r.deliverySpeed || 'Standard'} • ${r.type?.toUpperCase()})`).join('\n');
            } else {
                rateText = `\n\nℹ️ *Currently no fixed rate card is published for this exact pair in database. You can broadcast your enquiry to get custom bids.*`;
            }

            const vendorCardsIntro = dbVendors.length > 0
                ? `\n\nFound **${dbVendors.length} Verified Forwarders** actively handling this route.`
                : '';

            botReply = `📋 **Live Freight Search Results:**\n• **Sector:** ${originLabel} → ${destLabel}\n• **Mode:** ${enquiryState.data.mode?.toUpperCase()} Freight\n• **Cargo Load:** ${enquiryState.data.weight}${rateText}${vendorCardsIntro}\n\nClick **"Connect & Book Now"** on any rate card to book directly, or type **"1"** (or click "Broadcast to All Forwarders") to broadcast your enquiry to all matching verified forwarders.`;

            newContext.enquiryState = enquiryState;
            return res.json({
                success: true,
                reply: botReply,
                vendors,
                rates,
                context: newContext
            });
        }

        // =========================================================================
        // GENERAL FALLBACK & NORMAL CONVERSATION (Outside active enquiry)
        // =========================================================================
        // INTENT: Continuation request (e.g. "aur", "more", "next", "aur vendor", "aur list")
        const isContinuation = /^(aur|or|more|next|aur batao|aur dikhao|aur vendors?|aur list|show more|aur aage|page|next page)$/i.test(q) ||
            q === 'aur' || q === 'aur?' || q === 'aur bataiye' || q === 'more vendors' || q === 'next page';

        // Check recent conversation history for previous search context (location or vendor list)
        let previousSearchFilter = lastContext?.lastVendorFilter || null;
        let previousVendorOffset = lastContext?.vendorOffset || 0;

        // INTENT: Location Search & Vendor List Inquiries (e.g. "delhi", "mumbai", "india ka vendor ka list do", "forwarders in china", "aur")
        const isExplicitLocationSearch = Boolean(locationSearch && (locationSearch.country || locationSearch.city));
        if (isExplicitLocationSearch) {
            matchedCountry = locationSearch.country || matchedCountry;
            matchedCity = locationSearch.city || matchedCity;
        }

        const isVendorListInquiry =
            isExplicitLocationSearch ||
            Boolean(matchedCity) ||
            (Boolean(matchedCountry) && !q.includes('to ' + matchedCountry.toLowerCase())) ||
            q.includes('vendor') || q.includes('vendors') ||
            q.includes('forwarder') || q.includes('forwarders') ||
            q.includes('logistics partner') || q.includes('cha') ||
            q.includes('near me') || q.includes('search vendors by location') || q.includes('find vendor') ||
            isContinuation;

        if (isVendorListInquiry) {
            let filter = {};
            let targetCountry = matchedCountry;
            let targetCity = matchedCity;
            let offset = 0;

            if (isContinuation) {
                offset = (previousVendorOffset || 0) + 12;
                if (previousSearchFilter) {
                    targetCity = previousSearchFilter.city || '';
                    targetCountry = previousSearchFilter.country || 'India';
                } else {
                    targetCountry = 'India';
                }
            }

            // If user did not specify city or country, default to India
            if (!targetCity && !targetCountry) {
                targetCountry = 'India';
            }

            // Build vendor search filter matching VendorNetwork exactly
            const conditions = [];
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            if (targetCountry) {
                // Strict country match like Vendor Network (User.country)
                conditions.push({
                    country: new RegExp('^' + escapeRegExp(targetCountry) + '$', 'i')
                });
            }

            if (targetCity) {
                // City aliases like Vendor Network
                const cleanCity = targetCity.trim().toLowerCase();
                const cityAliases = {
                    'bangalore': ['bangalore', 'bangaluru', 'bengaluru'],
                    'bangaluru': ['bangalore', 'bangaluru', 'bengaluru'],
                    'bengaluru': ['bangalore', 'bangaluru', 'bengaluru'],
                    'mumbai': ['mumbai', 'bombay', 'nhava sheva'],
                    'delhi': ['delhi', 'new delhi']
                };

                if (cityAliases[cleanCity]) {
                    const aliasRegexStr = cityAliases[cleanCity].map(c => `^${escapeRegExp(c)}$`).join('|');
                    conditions.push({ city: new RegExp(aliasRegexStr, 'i') });
                } else {
                    conditions.push({ city: new RegExp('^' + escapeRegExp(targetCity) + '$', 'i') });
                }
            }

            if (conditions.length > 0) {
                filter.$and = conditions;
            }

            if (q.includes('cha') || q.includes('custom')) {
                filter.vendorTypes = 'CHA';
            } else if (q.includes('warehouse')) {
                filter.services = new RegExp('warehouse', 'i');
            }

            vendors = await fetchRankedVendorsForRoute(filter, 12, offset);

            // If offset ran out of extra vendors, loop back to start
            if (vendors.length === 0 && offset > 0) {
                offset = 0;
                vendors = await fetchRankedVendorsForRoute(filter, 12, 0);
            }

            newContext.lastVendorFilter = { city: targetCity, country: targetCountry };
            newContext.vendorOffset = offset;

            const locationLabel = [targetCity, targetCountry].filter(Boolean).join(', ').toUpperCase() || 'INDIA';

            botReply = offset > 0
                ? `📍 **More Verified Logistics Partners & Freight Forwarders for ${locationLabel}:**\n\nHere are next **${vendors.length} verified partners** (offset: ${offset}). Review their profiles, certifications, or request rates directly below:`
                : `📍 **Top Verified Logistics Partners & Freight Forwarders for ${locationLabel} on Logistics Scanner:**\n\nHere are **${vendors.length} active verified partners** on our portal database. You can review their verified profiles, certifications, and request quotations directly below:`;

            return res.json({ success: true, reply: botReply, vendors, context: newContext });
        }

        // PURE AI FALLBACK
        const aiAnswer = await queryOpenRouter(raw, userWantsHindi, history);
        botReply = aiAnswer || (userWantsHindi
            ? "Logistics Scanner par aap verified forwarders dhoondh sakte hain aur rates compare kar sakte hain."
            : "Logistics Scanner connects you with verified freight forwarders, competitive shipping rates, and customs clearance partners across India and internationally.");

        // If user mentions cargo commodity in general chat, also attach vendors
        const isCargoQuery = /textile|cloth|machine|chemical|electronic|auto|pharma|spices|food|ceramic|steel|rate|freight|cost|shipping/i.test(q);
        if (isCargoQuery) {
            vendors = await fetchRankedVendorsForRoute({ isVerified: true }, 6);
        }

        return res.json({
            success: true,
            reply: botReply,
            vendors,
            rates,
            context: newContext
        });

    } catch (error) {
        console.error('Chatbot Controller Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing chatbot query.',
            error: error.message
        });
    }
};
