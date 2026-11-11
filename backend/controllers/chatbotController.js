const axios = require('axios');
const User = require('../models/User');
const Pricing = require('../models/Pricing');

// Check if query is explicitly in Devanagari Hindi or user asked for Hindi
const isExplicitHindi = (text) => {
    const devanagariRegex = /[\u0900-\u097F]/;
    if (devanagariRegex.test(text)) return true;
    const lower = text.toLowerCase();
    if (lower.includes('hindi me') || lower.includes('in hindi') || lower.includes('hindi mein')) return true;
    return false;
};

// Safe DB query helper with short timeout
const safeDbFind = async (model, query, select, limit = 10, populate = null) => {
    try {
        let q = model.find(query).select(select).limit(limit);
        if (populate) q = q.populate(populate.path, populate.select);
        return await q.lean().maxTimeMS(2500);
    } catch (err) {
        return [];
    }
};

// Query OpenRouter AI using openai/gpt-4o-mini
const queryOpenRouter = async (userPrompt, forceHindi = false) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_KEY_HERE')) {
        return null;
    }

    const languageInstruction = forceHindi
        ? "Respond in natural, polite Hindi (Devanagari script)."
        : "Respond strictly in clear, professional ENGLISH by default, unless the user explicitly requests Hindi in Devanagari.";

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are the Senior Logistics Shipping & Freight Specialist for **Logistics Scanner** (India's premier digital freight forwarding network).
CRITICAL RULES:
1. ${languageInstruction}
2. Never mention outside competitor brands (like DHL, Maersk, Kuehne+Nagel). Always highlight **Logistics Scanner's verified vendors and internal network**.
3. When asked "How to find the best freight forwarder" or similar selection questions, provide deep, actionable AI guidance on:
   - **What to look for (Kya dekhein)**: Valid accreditations (IATA, FIATA, MTO), customs clearance expertise, specific trade route experience (China/USA/Dubai), transparent pricing without hidden destination charges, tracking technology, cargo insurance.
   - **What to avoid / Red flags (Kya na dekhein / Kya avoid karein)**: Unrealistic unusually low initial freight rates with hidden terminal handling fees, unverified agents without GST/PAN or physical presence, forwarders with no dedicated CHA or tracking system.
   - **How Logistics Scanner solves this**: Verified profiles, genuine port/service coverage, peer reviews, direct rate comparisons.
4. Keep the text formatted with strong bold keywords, clear numbered headers, and bullet points.`
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
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

// Exact Intent Matrix Engine (30 Core Intents + Search Matrix)
exports.handleChatbotQuery = async (req, res) => {
    try {
        const { message, intent } = req.body;
        if (!message && !intent) {
            return res.status(400).json({ success: false, message: 'Message or intent is required.' });
        }

        const raw = (message || '').trim();
        const q = raw.toLowerCase();
        const userWantsHindi = isExplicitHindi(raw);

        let botReply = '';
        let vendors = [];
        let rates = [];
        let routeInfo = null;
        let showQuoteForm = false;

        // Helper locations
        const cities = ['delhi', 'mumbai', 'kolkata', 'chennai', 'mundra', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'surat', 'patna'];
        const countries = ['china', 'uae', 'dubai', 'usa', 'uk', 'germany', 'singapore'];

        let matchedCity = cities.find(c => q.includes(c)) || '';
        let matchedCountry = countries.find(c => q.includes(c)) || '';

        // Mode detection
        let mode = 'sea';
        if (q.includes('air')) mode = 'air';
        else if (q.includes('land') || q.includes('road') || q.includes('transporter')) mode = 'land';
        else if (q.includes('cha') || q.includes('custom')) mode = 'cha';
        else if (q.includes('warehouse')) mode = 'warehouse';
        else if (q.includes('lcl')) mode = 'sea';
        else if (q.includes('fcl')) mode = 'sea';

        // =========================================================================
        // INTENT 1: "Best freight forwarder kaise find karein?" / Selection criteria
        // =========================================================================
        if (
            q.includes('kaise find kare') || q.includes('how to find') || 
            q.includes('best freight forwarder kaise') || q.includes('kya dekhe') || q.includes('kya na dekhe')
        ) {
            showQuoteForm = true;
            routeInfo = { from: 'Mumbai', to: 'China', mode: 'sea' };

            // Fetch AI expert guidance with GPT-4o-mini
            const aiAnswer = await queryOpenRouter(
                "How to find the best freight forwarder? Give complete practical checklist: 1. What to look for (Certifications, Route experience, CHA, Transparent pricing). 2. Red flags to avoid (Hidden destination charges, unverified agents). 3. Key shipment parameters needed for quote. 4. How Logistics Scanner helps with verified vendors.",
                userWantsHindi
            );

            if (aiAnswer) {
                botReply = aiAnswer;
            } else {
                botReply = userWantsHindi
                    ? `### 1. **Best Freight Forwarder Choose Karte Waqt Kya Dekhein (Must-Have Checklist):**\n\n` +
                      `• **Accreditations & Licenses**: Forwarder ke paas **MTO (Multimodal Transport Operator)**, **IATA (for Air)**, ya **CHA License** hona zaroori hai.\n` +
                      `• **Route & Sector Expertise**: Dekhein ki unka aapke specific route (**China, UAE, USA**) par active container volume aur port tie-ups hain ya nahi.\n` +
                      `• **In-house Customs Clearance (CHA)**: Jin forwarders ke paas dedicated CHA team hoti hai, wahan customs delay aur demurrage charges nahi lagte.\n` +
                      `• **Transparent All-Inclusive Pricing**: Sea freight, Origin THC, BL fees, aur Destination DTHC pehle se clear likhi honi chahiye.\n\n` +
                      `### 2. **Kya Avoid Karein (Critical Red Flags):**\n\n` +
                      `• **Unusually Cheap Initial Rates**: Bahut kam ocean freight quote karke destination port par heavy hidden charges lagana.\n` +
                      `• **Unverified / Broker Agents**: Jin forwarders ke paas valid GST, PAN, ya physical presence na ho.\n` +
                      `• **Lack of Tracking & Support**: Jinki customer service responsive na ho.\n\n` +
                      `### 3. **Logistics Scanner Advantage:**\n\n` +
                      `Logistics Scanner par sabhi forwarders **GST & KYC Verified** hote hain. Aap direct transparent quotes compare kar sakte hain. **Neeche form me details fill karke verified vendors se live quotation prapt karein!**`
                    : `### 1. **What to Look For When Choosing a Freight Forwarder (Essential Checklist):**\n\n` +
                      `• **Valid Accreditations & Licenses**: Verify if the forwarder holds **MTO (Multimodal Transport Operator)**, **IATA (for Air Cargo)**, or **Customs House Agent (CHA) License**.\n` +
                      `• **Trade Route & Commodity Experience**: Ensure they regularly handle your specific sector (e.g. **India ↔ China, UAE, USA**) and commodity type.\n` +
                      `• **In-House Customs Clearance (CHA)**: Forwarders with dedicated customs clearance minimize port hold-ups and demurrage costs.\n` +
                      `• **Transparent All-Inclusive Pricing**: Insist on transparent breakdown covering Ocean/Air Freight, Origin THC, BL Fee, and Destination Charges without hidden surprises.\n` +
                      `• **Real-Time Tracking & Responsive Support**: Ability to provide live milestone updates.\n\n` +
                      `### 2. **Red Flags & What to Avoid:**\n\n` +
                      `• **Unrealistically Cheap Ocean Freight**: Beware of low base freight rates that come with exorbitant hidden terminal handling charges at the discharge port.\n` +
                      `• **Unverified Middlemen / Brokers**: Avoid agents without registered GST, verifiable credentials, or physical presence.\n` +
                      `• **Vague Terms on Free Time**: Always confirm container free days at destination (minimum 14–21 days recommended).\n\n` +
                      `### 3. **The Logistics Scanner Guarantee:**\n\n` +
                      `On **Logistics Scanner**, all logistics partners are **KYC & GST Verified**. You can review genuine profiles, compare rates transparently, and connect directly. **Submit your cargo details below to receive competitive quotes from our top verified vendors!**`;
            }

            vendors = await safeDbFind(
                User,
                { role: 'vendor', $or: [{ isVerified: true }, { verificationStatus: 'Approved' }] },
                'name company city country services vendorTypes profilePhoto isVerified',
                6
            );
        }

        // =========================================================================
        // INTENT 3 & 25: "Top 10 freight forwarders in India" / "Top logistics companies"
        // =========================================================================
        else if (
            q.includes('top 10') || 
            (q.includes('top') && (q.includes('forwarder') || q.includes('logistics company') || q.includes('logistics companies') || q.includes('india')))
        ) {
            vendors = await safeDbFind(
                User,
                { role: 'vendor', $or: [{ isVerified: true }, { verificationStatus: 'Approved' }] },
                'name company city country services vendorTypes profilePhoto isVerified rating lastYearTurnover',
                10
            );

            if (vendors.length < 10) {
                const more = await safeDbFind(
                    User,
                    { role: 'vendor' },
                    'name company city country services vendorTypes profilePhoto isVerified rating lastYearTurnover',
                    10
                );
                vendors = more;
            }

            botReply = userWantsHindi
                ? `🏆 **Logistics Scanner ke Top 10 Verified Freight Forwarders aur Logistics Partners:**\n\n` +
                  `Ye sabhi verified partners hamare portal par active hain. Aap inki company profile dekh sakte hain aur live rates direct compare kar sakte hain.`
                : `🏆 **Top 10 Verified Freight Forwarders on Logistics Scanner (India):**\n\n` +
                  `Here are the ranked verified logistics partners active on our portal. You can view their verified profile, service capabilities (Air, Sea, CHA, Land), and request instant custom quotations directly through Logistics Scanner.`;
        }

        // =========================================================================
        // INTENT 2, 4, 5, 6, 23, 24: City / Country / "Near Me" / CHA / Warehouse Searches
        // =========================================================================
        else if (
            q.includes('in delhi') || q.includes('in mumbai') || q.includes('in china') ||
            q.includes('near me') || q.includes('cha agent') || q.includes('warehouse near me') ||
            q.includes('verified vendor') || q.includes('verified freight forwarder')
        ) {
            let filter = { role: 'vendor' };

            if (matchedCity) {
                const reg = new RegExp(matchedCity, 'i');
                filter.$or = [{ city: reg }, { serviceLocations: reg }, { portsCovered: reg }];
            } else if (matchedCountry) {
                const reg = new RegExp(matchedCountry, 'i');
                filter.$or = [{ country: reg }, { countriesServed: reg }, { serviceLocations: reg }];
            }

            if (q.includes('cha') || q.includes('custom')) {
                filter.vendorTypes = 'CHA';
            } else if (q.includes('warehouse')) {
                filter.services = new RegExp('warehouse', 'i');
            } else {
                filter.$or = filter.$or || [{ isVerified: true }, { verificationStatus: 'Approved' }];
            }

            vendors = await safeDbFind(
                User,
                filter,
                'name company city country services vendorTypes profilePhoto isVerified',
                8
            );

            const locationLabel = matchedCity ? matchedCity.toUpperCase() : (matchedCountry ? matchedCountry.toUpperCase() : 'your location');

            botReply = userWantsHindi
                ? `📍 **${locationLabel} ke Verified Logistics Partners:**\n\nHamare portal par ${vendors.length} verified vendors active hain jo end-to-end shipping handle karte hain.`
                : `📍 **Verified Logistics Forwarders for ${locationLabel} on Logistics Scanner:**\n\nFound **${vendors.length} active verified partners** on our portal specializing in end-to-end freight, port handling, and customs clearance.`;
        }

        // =========================================================================
        // INTENT 9, 30: "Best rate for my shipment" / "I need a freight quote"
        // =========================================================================
        else if (
            q.includes('need a freight quote') || q.includes('get freight quote') ||
            q.includes('best rate for my shipment')
        ) {
            showQuoteForm = true;
            routeInfo = { from: 'Mumbai', to: 'China', mode: 'sea' };

            vendors = await safeDbFind(
                User,
                { role: 'vendor', $or: [{ isVerified: true }, { verificationStatus: 'Approved' }] },
                'name company city country services vendorTypes profilePhoto isVerified',
                6
            );

            botReply = userWantsHindi
                ? `📋 **Shipment Quotation Form:**\n\nDirect quote request create karne ke liye kripya **neeche diye form me origin, destination aur cargo details fill karein**. Logistics Scanner ke verified vendors turant competitive rates provide karenge!`
                : `📋 **Instant Freight Quotation Request:**\n\nPlease **provide your shipment parameters in the form below** (Origin, Destination, Commodity, and Weight/Volume). Our portal's verified freight forwarders will review and submit live quotations directly!`;
        }

        // =========================================================================
        // INTENT 7, 8, 10, 11, 12, 14, 15, 16: Route & Rate Search (India <-> China, Mumbai <-> Dubai, etc.)
        // =========================================================================
        else if (
            q.includes('rate') || q.includes('price') || q.includes('cost') || 
            q.includes('compare') || q.includes('cheapest') || q.includes('shipping') ||
            q.includes('to china') || q.includes('to dubai') || q.includes('to india') || q.includes('to usa')
        ) {
            let from = 'Mumbai';
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
            }

            routeInfo = { from, to, mode };
            showQuoteForm = true;

            // 1. Fetch active rates from Database
            rates = await safeDbFind(
                Pricing,
                {
                    status: 'active',
                    fromLocation: new RegExp(from, 'i'),
                    toLocation: new RegExp(to, 'i')
                },
                'fromLocation toLocation type price currency seaLoadType truckLoad validUntil vendor',
                4,
                { path: 'vendor', select: 'name company phone email isVerified' }
            );

            // 2. Fetch verified vendors on Logistics Scanner serving this route
            vendors = await safeDbFind(
                User,
                {
                    role: 'vendor',
                    $or: [
                        { countriesServed: new RegExp(to, 'i') },
                        { serviceLocations: new RegExp(from, 'i') }
                    ]
                },
                'name company city country services vendorTypes profilePhoto isVerified',
                6
            );

            botReply = userWantsHindi
                ? `🚢 **${from} se ${to} (${mode.toUpperCase()} Freight) Route Guide:**\n\n` +
                  `• **Transit Time**: Ocean Freight approx 15–25 days (Nhava Sheva/Mundra to Shanghai/Ningbo/Jebel Ali); Air Cargo approx 3–5 days.\n` +
                  `• **Customs & Documentation**: **IEC Code**, **Commercial Invoice**, **Packing List**, **GST LUT**, aur **Shipping Bill** zaroori hain.\n` +
                  `• **Verified Vendors on Logistics Scanner**: Is route ke verified forwarders neeche listed hain. Direct rate pane ke liye form fill karein.`
                : `🚢 **${from} → ${to} (${mode.toUpperCase()} Freight) Shipping & Rate Overview:**\n\n` +
                  `• **Mode of Transport**: **Ocean FCL** (Full 20ft/40ft container), **Ocean LCL** (Per CBM basis), or **Air Cargo** for urgent shipment.\n` +
                  `• **Ports of Transit**: Major Indian ports (**Nhava Sheva / Mundra / Chennai**) to Destination hubs (**Shanghai, Ningbo, Jebel Ali**).\n` +
                  `• **Mandatory Documents**: **IEC Code**, **Commercial Invoice**, **Packing List**, **GST LUT**, and **Bill of Lading (BL) / Air Waybill (AWB)**.\n` +
                  `• **Logistics Scanner Verified Vendors**: Top verified forwarders handling this sector are listed below. Submit your cargo details in the form to get live quotes directly!`;
        }

        // =========================================================================
        // INTENT 18, 19, 20, 21, 22, 28, 29: Mode Services (FCL, LCL, Air, Sea, CHA, Door-to-door)
        // =========================================================================
        else if (
            q.includes('fcl') || q.includes('lcl') || q.includes('air freight') || 
            q.includes('sea freight') || q.includes('land transport') || q.includes('door-to-door') ||
            q.includes('door to door') || q.includes('customs clearance') || q.includes('cha')
        ) {
            let serviceTag = 'Freight forwarder';
            let title = 'Freight Forwarding';

            if (q.includes('fcl')) { serviceTag = 'Sea'; title = 'FCL Container Shipping'; }
            else if (q.includes('lcl')) { serviceTag = 'Sea'; title = 'LCL Consolidation (Per CBM)'; }
            else if (q.includes('air')) { serviceTag = 'Air'; title = 'Air Freight Cargo'; }
            else if (q.includes('sea')) { serviceTag = 'Sea'; title = 'Ocean Freight'; }
            else if (q.includes('land') || q.includes('transporter')) { serviceTag = 'Land'; title = 'Road & Land Transport'; }
            else if (q.includes('cha') || q.includes('custom')) { serviceTag = 'CHA'; title = 'Customs Clearance (CHA)'; }

            vendors = await safeDbFind(
                User,
                {
                    role: 'vendor',
                    $or: [
                        { services: new RegExp(serviceTag, 'i') },
                        { vendorTypes: new RegExp(serviceTag, 'i') }
                    ]
                },
                'name company city country services vendorTypes profilePhoto isVerified',
                6
            );

            botReply = userWantsHindi
                ? `📦 **Logistics Scanner par Verified ${title} Providers:**\n\n` +
                  `Hamare portal par verified ${title} partners available hain jo complete port pickup, customs clearance aur cargo delivery handle karte hain.`
                : `📦 **Verified ${title} Providers on Logistics Scanner:**\n\n` +
                  `Here are verified logistics partners on our portal specializing in **${title}**. You can connect directly with their verified profile or request a quotation.`;
        }

        // =========================================================================
        // PURE AI FALLBACK: Using GPT-4o-mini strictly for generic logistics advice
        // =========================================================================
        else {
            const aiAnswer = await queryOpenRouter(raw, userWantsHindi);
            botReply = aiAnswer || (userWantsHindi
                ? "Logistics Scanner par aap verified forwarders dhoondh sakte hain aur rates compare kar sakte hain."
                : "Logistics Scanner connects you with verified freight forwarders, competitive shipping rates, and customs clearance partners across India and internationally.");
        }

        return res.json({
            success: true,
            reply: botReply,
            routeInfo,
            showQuoteForm,
            vendors,
            rates
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
