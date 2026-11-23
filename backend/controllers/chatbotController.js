const axios = require('axios');
const mongoose = require('mongoose');
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

// Helper to find genuine published rates from Pricing collection
const findAvailableRatesForRoute = async (fromLocation, toLocation, mode = 'sea') => {
    try {
        const query = {
            status: 'active'
        };
        if (mode) {
            query.type = mode.toLowerCase();
        }

        // Broad regex for origin and destination ports/cities
        if (fromLocation) {
            const cleanFrom = fromLocation.replace(/\(.*?\)/g, '').trim().split(',')[0].trim();
            query.fromLocation = new RegExp(cleanFrom, 'i');
        }
        if (toLocation) {
            const cleanTo = toLocation.replace(/\(.*?\)/g, '').trim().split(',')[0].trim();
            query.toLocation = new RegExp(cleanTo, 'i');
        }

        const rates = await Pricing.find(query)
            .populate('vendor', 'name company city country profilePhoto isVerified')
            .sort({ price: 1 })
            .limit(6)
            .lean();

        return rates.filter(r => r.price && r.price > 0);
    } catch (err) {
        console.error("Error finding rates for route:", err);
        return [];
    }
};

// Main Chatbot Query Controller with Stateful Conversational Workflow
exports.handleChatbotQuery = async (req, res) => {
    try {
        const { message, intent, locationSearch, history, lastContext } = req.body;
        if (!message && !intent && !locationSearch) {
            return res.status(400).json({ success: false, message: 'Message or intent is required.' });
        }

        const raw = (message || '').trim();
        const q = raw.toLowerCase();
        const userWantsHindi = isExplicitHindi(raw);

        // Helper locations declared early so they are accessible anywhere in the handler
        const cities = ['delhi', 'mumbai', 'kolkata', 'chennai', 'mundra', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'surat', 'patna'];
        const countries = ['china', 'uae', 'dubai', 'usa', 'uk', 'germany', 'singapore', 'india'];
        let matchedCity = cities.find(c => q.includes(c)) || '';
        let matchedCountry = countries.find(c => q.includes(c)) || '';

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

        let newContext = { ...(lastContext || {}), enquiryState };
        let botReply = '';
        let vendors = [];
        let rates = [];
        let options = [];
        let enquirySummary = null;

        // =========================================================================
        // CHECK IF USER WANTS TO START OR IS IN A CONVERSATIONAL ENQUIRY FLOW
        // =========================================================================
        const isRouteInquiry =
            q.includes('shipping routes & port guide') ||
            q.includes('shipping route') ||
            q.includes('port guide') ||
            /ship.*from.*to/i.test(q) ||
            /send.*from.*to/i.test(q) ||
            (q.includes('route') && (q.includes('india') || q.includes('china') || q.includes('dubai') || q.includes('sea') || q.includes('air')));

        const isDirectQuoteRequest =
            q.includes('freight quote') ||
            q.includes('request quote') ||
            q.includes('rate quote') ||
            q.includes('need quote') ||
            q.includes('book shipment') ||
            q.includes('quote for');

        const isEnquiryInitiator = isDirectQuoteRequest || isRouteInquiry;

        // Check if user is answering a numbered option (e.g. "1", "2", "3", "option 1")
        const numberMatch = q.match(/^(?:option\s*)?([1-9]|10)$/i);
        const selectedNumber = numberMatch ? parseInt(numberMatch[1], 10) : null;

        // -------------------------------------------------------------------------
        // STATE 0: SELECTING TRANSPORT MODE (Sea vs Air)
        // -------------------------------------------------------------------------
        if (enquiryState.active && enquiryState.step === 'SELECTING_MODE') {
            if (selectedNumber === 1 || q.includes('sea') || q.includes('ocean')) {
                enquiryState.data.mode = 'sea';
            } else if (selectedNumber === 2 || q.includes('air') || q.includes('flight')) {
                enquiryState.data.mode = 'air';
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

            // Now check what else is missing: commodity or weight
            if (!enquiryState.data.commodity) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? `🏁 **Destination Port set to: ${chosenPort}**\n\nAap kaunsa **saman / commodity** bhejna chahte hain? (Jaise: *Textiles*, *Auto Parts*, *Machinery*, *Chemicals*):`
                    : `🏁 **Destination Port confirmed:** **${chosenPort}**\n\nWhat **commodity (goods)** are you shipping? (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):`;
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.weight) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? `📦 **Commodity:** **${enquiryState.data.commodity}**\n\nCargo ka **approximate weight ya container type** kya hai? (Jaise: *500 kg*, *1x20ft Container*, *1x40ft HC*, *5 CBM*):`
                    : `📦 **Commodity:** **${enquiryState.data.commodity}**\n\nWhat is the approximate **cargo weight or container load**? (e.g., *500 kg*, *1x20ft Container*, *1x40ft HC*, *4 CBM*):`;
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            // All collected! Proceed to vendor matching
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
                // If user selected option 1 (Specific vendor) vs option 2 (Broadcast to all)
                let targetVendorId = null;
                let targetVendorName = null;

                if (selectedNumber === 1 && enquiryState.matchingVendors.length > 0) {
                    targetVendorId = enquiryState.matchingVendors[0]._id;
                    targetVendorName = enquiryState.matchingVendors[0].company || enquiryState.matchingVendors[0].name;
                } else if (selectedNumber && selectedNumber <= enquiryState.matchingVendors.length) {
                    targetVendorId = enquiryState.matchingVendors[selectedNumber - 1]._id;
                    targetVendorName = enquiryState.matchingVendors[selectedNumber - 1].company || enquiryState.matchingVendors[selectedNumber - 1].name;
                }

                // Create Enquiry in Database
                try {
                    const enquiryPayload = {
                        fromLocation: `${enquiryState.data.originPort || enquiryState.data.originCountry}`,
                        toLocation: `${enquiryState.data.destinationPort || enquiryState.data.destinationCountry}`,
                        type: enquiryState.data.mode || 'sea',
                        category: 'international',
                        commodity: enquiryState.data.commodity || 'General Goods',
                        weightRange: enquiryState.data.weight || 'As discussed',
                        message: `Conversational AI Enquiry | Route: ${enquiryState.data.originPort} (${enquiryState.data.originCountry}) → ${enquiryState.data.destinationPort} (${enquiryState.data.destinationCountry}) | Commodity: ${enquiryState.data.commodity} | Load/Weight: ${enquiryState.data.weight}`,
                        vendor: targetVendorId || null,
                        isDirect: Boolean(targetVendorId),
                        status: 'Pending',
                        source: 'web'
                    };

                    const newEnquiry = await Enquiry.create(enquiryPayload);

                    if (targetVendorId) {
                        // Direct enquiry to specific vendor
                        botReply = userWantsHindi
                            ? `🎉 **Enquiry Safaltapoorvak Bheji Gayi!**\n\n• **Vendor:** **${targetVendorName}**\n• **Route:** ${enquiryState.data.originPort} → ${enquiryState.data.destinationPort}\n• **Commodity:** ${enquiryState.data.commodity} (${enquiryState.data.weight})\n\nVendor ko notification bhej diya gaya hai. Ve aapse jald hi live quotation ke sath contact karenge.`
                            : `🎉 **Enquiry Successfully Submitted!**\n\n• **Vendor:** **${targetVendorName}**\n• **Route:** ${enquiryState.data.originPort} → ${enquiryState.data.destinationPort}\n• **Commodity:** ${enquiryState.data.commodity} (${enquiryState.data.weight})\n\nThe vendor has been notified and will review your cargo specs to provide customized rates shortly.`;
                    } else {
                        // Broadcast enquiry to all matching vendors
                        await triggerVendorBroadcast(newEnquiry._id);
                        botReply = userWantsHindi
                            ? `📢 **Enquiry Broadcast Safaltapoorvak Ho Gayi!**\n\n• **Route:** ${enquiryState.data.originPort} (${enquiryState.data.originCountry}) → ${enquiryState.data.destinationPort} (${enquiryState.data.destinationCountry})\n• **Commodity:** ${enquiryState.data.commodity}\n• **Weight / Load:** ${enquiryState.data.weight}\n\nIs route ke sabhi eligible verified forwarders ko aapki lead bhej di gayi hai. Aapko portal par unke live competitive quotations prapt honge!`
                            : `📢 **Enquiry Successfully Broadcasted!**\n\n• **Route:** ${enquiryState.data.originPort} (${enquiryState.data.originCountry}) → ${enquiryState.data.destinationPort} (${enquiryState.data.destinationCountry})\n• **Commodity:** ${enquiryState.data.commodity}\n• **Weight / Load:** ${enquiryState.data.weight}\n\nYour enquiry has been delivered to all matching verified logistics forwarders. They will submit competitive spot rate quotations directly!`;
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
        // ROUTE & LOCATION ADVISORY FLOW (Detailed Freight Intelligence Report)
        // -------------------------------------------------------------------------
        if (!enquiryState.active && isRouteInquiry) {
            let from = 'India';
            let to = 'China';

            if (q.includes('china') && q.includes('india')) {
                from = q.indexOf('china') < q.indexOf('india') ? 'China' : 'India';
                to = from === 'China' ? 'India' : 'China';
            } else if (q.includes('delhi') && q.includes('dubai')) {
                from = 'Delhi'; to = 'Dubai';
            } else if (q.includes('mumbai') && q.includes('dubai')) {
                from = 'Mumbai'; to = 'Dubai';
            } else if (q.includes('mumbai') && q.includes('china')) {
                from = 'Mumbai'; to = 'China';
            } else if (q.includes('india') && q.includes('usa')) {
                from = 'India'; to = 'USA';
            } else if (matchedCity && matchedCountry) {
                from = matchedCity;
                to = matchedCountry;
            }

            const routeMode = q.includes('air') ? 'AIR' : 'SEA';

            // 1. Fetch 12 Ranked Verified Vendors for this route
            vendors = await fetchRankedVendorsForRoute(
                {
                    $or: [
                        { countriesServed: new RegExp(to, 'i') },
                        { serviceLocations: new RegExp(from, 'i') }
                    ]
                },
                12
            );

            // 2. Fetch AI Freight Intelligence Report for Route
            const llmPrompt = `Provide a comprehensive, high-value freight intelligence report for shipping from ${from} to ${to} via ${routeMode} freight:
1. **Major Loading & Discharge Ports**: (Specific hub ports in ${from} and ${to}).
2. **Transit Times**: (Direct vs transshipment vessel schedules in days).
3. **Current Market Rate Benchmarks**: (Realistic estimated freight cost ranges for 20ft/40ft container or air per kg, explaining how fuel and seasonal surcharges apply).
4. **Customs, CHA & Clearance Protocol**: (Exact paperwork: IEC Code, GST LUT, Packing List, Commercial Invoice, COO, Shipping Bill).
5. **Next Step Call-To-Action**: Include this exact question at the end:
"📦 What commodity (goods) are you planning to ship? (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):"`;

            const aiAnalysis = await queryOpenRouter(llmPrompt, userWantsHindi, history);

            botReply = aiAnalysis || (userWantsHindi
                ? `🚢 **${from} se ${to} (${routeMode} Freight) Route Guide:**\n\n` +
                  `• **Transit Time**: Ocean Freight approx 15–25 days; Air Cargo approx 3–5 days.\n` +
                  `• **Customs & Documentation**: **IEC Code**, **Commercial Invoice**, **Packing List**, **GST LUT**, aur **Shipping Bill** zaroori hain.\n\n` +
                  `📦 **What commodity (goods) are you planning to ship? (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):**`
                : `🚢 **Freight Intelligence Report: Shipping from ${from} to ${to} via ${routeMode} Freight:**\n\n` +
                  `1. **Major Loading & Discharge Ports**: Nhava Sheva (JNPT) / Mundra → Shanghai / Ningbo.\n` +
                  `2. **Transit Times**: Direct Ocean: 20–25 days | Air: 3–5 days.\n` +
                  `3. **Market Rate Benchmarks**: Ocean 20ft: $800–$1,200 | 40ft: $1,400–$2,200 | LCL: $50–$75/CBM | Air: $4–$7/kg.\n` +
                  `4. **Mandatory Documentation**: IEC Code, GST LUT, Commercial Invoice with HS Code, Packing List, Certificate of Origin.\n\n` +
                  `📦 **What commodity (goods) are you planning to ship? (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):**`);

            // Initialize enquiry state context with route info for next turn
            enquiryState.active = true;
            enquiryState.step = 'COLLECTING';
            enquiryState.data.originCountry = from;
            enquiryState.data.destinationCountry = to;
            enquiryState.data.mode = routeMode.toLowerCase();
            newContext.enquiryState = enquiryState;

            return res.json({
                success: true,
                reply: botReply,
                vendors,
                rates: [],
                context: newContext
            });
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

            // Also check if weight/load was typed (e.g. "500 kg", "20ft", "40ft", "4 cbm")
            if (!enquiryState.data.weight) {
                const weightPattern = /\b(\d+(?:\.\d+)?\s*(?:kg|kgs|ton|tons|tonne|cbm|ft|container))\b/i;
                const matchW = raw.match(weightPattern);
                if (matchW) {
                    enquiryState.data.weight = matchW[1];
                }
            }

            // Check next missing required field:
            // Order: 1. Commodity -> 2. Weight -> 3. Origin Country -> 4. Origin Port -> 5. Destination Country -> 6. Destination Port

            if (!enquiryState.data.commodity) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? "📦 **Aap kaunsa saman / commodity ship karna chahte hain?** (Jaise: *Textiles*, *Machinery*, *Electronics*, *Chemicals*):"
                    : "📦 **What commodity (goods) are you planning to ship?** (e.g., *Textiles*, *Machinery*, *Auto Parts*, *Electronics*):";
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.weight) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? `📦 **Commodity:** **${enquiryState.data.commodity}**\n\nIs cargo ka **approximate weight ya container size** kya hai? (Jaise: *500 kg*, *1x20ft Container*, *1x40ft HC*, ya *5 CBM*):`
                    : `📦 **Commodity:** **${enquiryState.data.commodity}**\n\nWhat is the approximate **cargo weight or container load**? (e.g., *500 kg*, *1x20ft Container*, *1x40ft HC*, or *4 CBM*):`;
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            // Transport Mode Selection before selecting Ports:
            if (!enquiryState.data.mode) {
                // If user wrote sea or air anywhere in input
                if (q.includes('sea') || q.includes('ocean')) {
                    enquiryState.data.mode = 'sea';
                } else if (q.includes('air') || q.includes('flight')) {
                    enquiryState.data.mode = 'air';
                } else {
                    enquiryState.step = 'SELECTING_MODE';
                    options = [
                        { number: 1, label: '🌊 Sea Freight (Ocean FCL / LCL)' },
                        { number: 2, label: '✈️ Air Cargo (Express / Commercial Air)' }
                    ];
                    botReply = userWantsHindi
                        ? `🚢 **Aapka transport mode kaunsa hoga?** (Option number type karein ya button click karein):\n\n1. **🌊 Sea Freight (Ocean FCL / LCL Container)**\n2. **✈️ Air Cargo (Fast Flight Cargo)**`
                        : `🚢 **What will be your Mode of Transport?** (Type option 1 or 2, or click an option):\n\n1. **🌊 Sea Freight (Ocean FCL / LCL Container)**\n2. **✈️ Air Cargo (Express / Air Cargo Terminal)**`;
                    newContext.enquiryState = enquiryState;
                    return res.json({ success: true, reply: botReply, options, context: newContext });
                }
            }

            if (!enquiryState.data.originCountry) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? "🌍 **Shipment ka Origin Country kaunsa hai?** (Jaise: *India*, *China*, *UAE*, *USA*):"
                    : "🌍 **What is your Origin Country?** (e.g., *India*, *China*, *UAE*, *USA*):";
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.originPort) {
                // Fetch ports from DB for Origin Country based on selected mode
                const originPorts = await getPortsByCountryFromDb(enquiryState.data.originCountry, enquiryState.data.mode);
                const modeLabel = enquiryState.data.mode === 'air' ? 'Airport Hub' : 'Sea Port';
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

            if (!enquiryState.data.destinationCountry) {
                enquiryState.step = 'COLLECTING';
                botReply = userWantsHindi
                    ? "🏁 **Shipment ka Destination Country kaunsa hai?** (Jaise: *China*, *UAE*, *USA*, *Germany*):"
                    : "🏁 **What is your Destination Country?** (e.g., *China*, *UAE*, *USA*, *Germany*):";
                newContext.enquiryState = enquiryState;
                return res.json({ success: true, reply: botReply, context: newContext });
            }

            if (!enquiryState.data.destinationPort) {
                const destPorts = await getPortsByCountryFromDb(enquiryState.data.destinationCountry, enquiryState.data.mode);
                if (destPorts.length > 0) {
                    enquiryState.step = 'SELECTING_DEST_PORT';
                    enquiryState.portOptions = destPorts;
                    options = destPorts.map((p, idx) => ({ number: idx + 1, label: p.name, code: p.code, city: p.city }));

                    let portListText = destPorts.map((p, idx) => `${idx + 1}. **${p.name}** ${p.code ? `(${p.code})` : ''} - *${p.city || ''}*`).join('\n');
                    botReply = userWantsHindi
                        ? `⚓ **${enquiryState.data.destinationCountry} me Destination Port select karein** (Option number type karein ya port name):\n\n${portListText}`
                        : `⚓ **Please select your Destination Port in ${enquiryState.data.destinationCountry}** (Type the option number or port name):\n\n${portListText}`;

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
            // ALL REQUIRED FIELDS COLLECTED: SEARCH VENDORS & RATES FROM DATABASE
            // =========================================================================
            enquiryState.step = 'BROADCAST_CONFIRMATION';

            const originLabel = `${enquiryState.data.originPort} (${enquiryState.data.originCountry})`;
            const destLabel = `${enquiryState.data.destinationPort} (${enquiryState.data.destinationCountry})`;

            // 1. Search DB for matching rates
            const dbRates = await findAvailableRatesForRoute(
                enquiryState.data.originPort || enquiryState.data.originCountry,
                enquiryState.data.destinationPort || enquiryState.data.destinationCountry,
                enquiryState.data.mode
            );

            // 2. Search DB for matching verified vendors
            const dbVendors = await fetchRankedVendorsForRoute(
                {
                    $or: [
                        { countriesServed: new RegExp(enquiryState.data.destinationCountry, 'i') },
                        { portsCovered: new RegExp(enquiryState.data.destinationPort, 'i') },
                        { portsCovered: new RegExp(enquiryState.data.originPort, 'i') },
                        { serviceLocations: new RegExp(enquiryState.data.originCountry, 'i') }
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
                rateText = `\n\n💰 **Available Vendor Rates in Database:**\n` +
                    dbRates.map((r, idx) => `• **${r.vendor?.company || r.vendor?.name || 'Verified Vendor'}**: **₹${r.price.toLocaleString('en-IN')}** ${r.currency || 'INR'} (${r.deliverySpeed || 'Standard'})`).join('\n');
            } else {
                rateText = `\n\nℹ️ *Currently, no direct published fixed rate card is found for this specific port pair in our database.*`;
            }

            const vendorCardsIntro = dbVendors.length > 0
                ? `\n\nFound **${dbVendors.length} Verified Forwarders** actively handling this route.`
                : '';

            botReply = userWantsHindi
                ? `📋 **Shipment Route Analysis:**\n• **Route:** ${originLabel} → ${destLabel}\n• **Commodity:** ${enquiryState.data.commodity}\n• **Weight / Load:** ${enquiryState.data.weight}${rateText}${vendorCardsIntro}\n\n**Kya aap is enquiry ko matching vendors ko broadcast karna chahte hain taaki ve live quotation provide karein?**\n\n1. **Broadcast to all matching vendors**\n2. **Send enquiry to a specific vendor**\n\n*(Kripya option 1 ya 2 type karein, ya 'Haan'/'Nahi' batayein)*`
                : `📋 **Shipment Route Analysis:**\n• **Route:** ${originLabel} → ${destLabel}\n• **Commodity:** ${enquiryState.data.commodity}\n• **Weight / Load:** ${enquiryState.data.weight}${rateText}${vendorCardsIntro}\n\n**Would you like us to broadcast your enquiry to matching vendors so they can provide live customized quotations?**\n\n1. **Broadcast enquiry to all matching vendors**\n2. **Send enquiry to a specific vendor**\n\n*(Please type 1 or 2, or reply Yes / No)*`;

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
        // INTENT: Continuation request (e.g. "aur", "aur batao", "aur dikhao", "more", "next", "aur vendor", "aur list do")
        const isContinuation = /^(aur|or|more|next|aur batao|aur dikhao|aur vendors?|aur list|show more|aur aage)$/i.test(q) ||
            q === 'aur' || q === 'aur?' || q === 'aur bataiye' || q === 'more vendors' || q === 'next page';

        // Check recent conversation history for previous search context (location or vendor list)
        let previousSearchFilter = lastContext?.lastVendorFilter || null;
        let previousVendorOffset = lastContext?.vendorOffset || 0;

        if (isContinuation && !previousSearchFilter && Array.isArray(history) && history.length > 0) {
            // Check if any previous bot message was showing vendor list or if user was asking for forwarders/location
            const historyText = history.map(h => (h.text || '').toLowerCase()).join(' ');
            for (const c of cities) {
                if (historyText.includes(c)) {
                    previousSearchFilter = { city: c };
                    break;
                }
            }
            if (!previousSearchFilter) {
                for (const co of countries) {
                    if (historyText.includes(co)) {
                        previousSearchFilter = { country: co };
                        break;
                    }
                }
            }
            if (!previousSearchFilter && (historyText.includes('forwarder') || historyText.includes('vendor') || historyText.includes('india'))) {
                previousSearchFilter = { country: 'India' };
            }
        }

        // INTENT: Location Search & Vendor List Inquiries (e.g. "delhi", "mumbai", "india ka vendor ka list do", "forwarders in china", "aur")
        const isVendorListInquiry =
            Boolean(matchedCity) ||
            (Boolean(matchedCountry) && matchedCountry !== 'india' && !q.includes('to ' + matchedCountry)) ||
            q.includes('vendor') || q.includes('vendors') ||
            q.includes('forwarder') || q.includes('forwarders') ||
            q.includes('logistics partner') || q.includes('cha') ||
            q.includes('in delhi') || q.includes('in mumbai') || q.includes('in china') ||
            q.includes('in india') || q.includes('india ka') || q.includes('india ke') ||
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

            // If query mentions India or general vendor list request
            if (!targetCity && (q.includes('india') || q.includes('bharat') || !targetCountry)) {
                targetCountry = targetCountry || 'India';
            }

            if (targetCity) {
                const reg = new RegExp(targetCity, 'i');
                filter.$or = [{ city: reg }, { serviceLocations: reg }, { portsCovered: reg }];
            } else if (targetCountry) {
                const reg = new RegExp(targetCountry, 'i');
                filter.$or = [{ country: reg }, { countriesServed: reg }, { serviceLocations: reg }];
            }

            if (q.includes('cha') || q.includes('custom')) {
                filter.vendorTypes = 'CHA';
            } else if (q.includes('warehouse')) {
                filter.services = new RegExp('warehouse', 'i');
            }

            vendors = await fetchRankedVendorsForRoute(filter, 12, offset);

            // If offset ran out of extra vendors, loop or fetch verified vendors
            if (vendors.length === 0 && offset > 0) {
                offset = 0;
                vendors = await fetchRankedVendorsForRoute(filter, 12, 0);
            }

            newContext.lastVendorFilter = { city: targetCity, country: targetCountry };
            newContext.vendorOffset = offset;

            const locationLabel = targetCity ? targetCity.toUpperCase() : (targetCountry ? targetCountry.toUpperCase() : 'INDIA');

            botReply = userWantsHindi
                ? `📍 **${locationLabel} ke Aur Verified Logistics Partners & Freight Forwarders:**\n\nLogistics Scanner portal ke agle **${vendors.length} verified vendors** neeche listed hain. Aap inki company profile dekh sakte hain ya direct quotation request kar sakte hain:`
                : `📍 **More Verified Logistics Partners & Freight Forwarders for ${locationLabel} on Logistics Scanner:**\n\nHere are **${vendors.length} verified partners** from our portal database. You can review their verified profiles, services, and connect directly below:`;

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
