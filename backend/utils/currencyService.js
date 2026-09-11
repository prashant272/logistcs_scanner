const axios = require('axios');

let cachedRate = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Converts currency amount from one currency to another (e.g. USD to INR).
 * @param {Number} amount - Amount in source currency
 * @param {String} from - Source currency code (e.g. 'USD')
 * @param {String} to - Target currency code (e.g. 'INR')
 * @returns {Promise<{ new_amount: Number, rate: Number, old_amount: Number, old_currency: String, new_currency: String }>}
 */
async function convertCurrency(amount, from = 'USD', to = 'INR') {
    const numAmount = parseFloat(amount) || 0;
    const fromCur = from.toUpperCase();
    const toCur = to.toUpperCase();

    if (fromCur === toCur || numAmount === 0) {
        return {
            old_amount: numAmount,
            old_currency: fromCur,
            new_currency: toCur,
            new_amount: numAmount,
            rate: 1
        };
    }

    const apiKey = process.env.API_NINJAS_KEY || process.env.NINJAS_API_KEY;

    // 1. Try API Ninjas Convert Currency if API key is provided
    if (apiKey) {
        try {
            const res = await axios.get('https://api.api-ninjas.com/v1/convertcurrency', {
                params: { have: fromCur, want: toCur, amount: numAmount },
                headers: { 'X-Api-Key': apiKey },
                timeout: 5000
            });
            if (res.data && res.data.new_amount !== undefined) {
                const rate = res.data.new_amount / numAmount;
                return {
                    old_amount: numAmount,
                    old_currency: fromCur,
                    new_currency: toCur,
                    new_amount: Math.round(res.data.new_amount * 100) / 100,
                    rate: Math.round(rate * 10000) / 10000
                };
            }
        } catch (ninjaErr) {
            console.warn('API Ninjas currency conversion failed, falling back to open exchange rates:', ninjaErr.message);
        }
    }

    // 2. Try Open Exchange Rates (Cached for 15 mins)
    const now = Date.now();
    if (cachedRate && (now - lastFetchTime < CACHE_DURATION_MS)) {
        const converted = numAmount * cachedRate;
        return {
            old_amount: numAmount,
            old_currency: fromCur,
            new_currency: toCur,
            new_amount: Math.round(converted * 100) / 100,
            rate: Math.round(cachedRate * 10000) / 10000
        };
    }

    try {
        const liveRes = await axios.get(`https://open.er-api.com/v6/latest/${fromCur}`, { timeout: 5000 });
        const rate = liveRes.data?.rates?.[toCur];
        if (rate && !isNaN(rate)) {
            cachedRate = rate;
            lastFetchTime = now;
            const converted = numAmount * rate;
            return {
                old_amount: numAmount,
                old_currency: fromCur,
                new_currency: toCur,
                new_amount: Math.round(converted * 100) / 100,
                rate: Math.round(rate * 10000) / 10000
            };
        }
    } catch (openErr) {
        console.warn('Open exchange rates failed:', openErr.message);
    }

    // 3. Fallback fixed rate (Mid-market standard)
    const fallbackRate = 94.6245;
    const fallbackConverted = numAmount * fallbackRate;
    return {
        old_amount: numAmount,
        old_currency: fromCur,
        new_currency: toCur,
        new_amount: Math.round(fallbackConverted * 100) / 100,
        rate: fallbackRate
    };
}

module.exports = { convertCurrency };
