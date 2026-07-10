const User = require('../models/User');

const levenshtein = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

const getSimilarity = (s1, s2) => {
    let longer = s1.toLowerCase();
    let shorter = s2.toLowerCase();
    if (s1.length < s2.length) { longer = s2.toLowerCase(); shorter = s1.toLowerCase(); }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - levenshtein(longer, shorter)) / parseFloat(longerLength);
};

const toTitleCase = (s) => {
    if (!s) return '';
    return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const normalizeLocationInput = async (countryInput, cityInput) => {
    let normalizedCountry = countryInput ? toTitleCase(countryInput.trim()) : '';
    let normalizedCity = cityInput ? toTitleCase(cityInput.trim()) : '';

    // Hardcode known explicit mappings first to bypass DB checks
    if (normalizedCountry.toLowerCase() === 'indiaa' || normalizedCountry.toLowerCase() === 'india') {
        normalizedCountry = 'India';
    }
    
    if (normalizedCity.toLowerCase() === 'banglore' || normalizedCity.toLowerCase() === 'bengaluru' || normalizedCity.toLowerCase() === 'bangalore') {
        normalizedCity = 'Bangalore';
    }

    // Dynamic fuzzy mapping
    // Fetch distinct existing countries and cities from the DB
    try {
        if (normalizedCountry && normalizedCountry !== 'India') {
            const existingCountries = await User.distinct('country', { role: 'vendor' });
            for (let c of existingCountries) {
                if (c && getSimilarity(normalizedCountry, c) >= 0.8) {
                    normalizedCountry = toTitleCase(c);
                    break;
                }
            }
        }

        if (normalizedCity && normalizedCity !== 'Bangalore') {
            const existingCities = await User.distinct('city', { role: 'vendor' });
            for (let ct of existingCities) {
                if (ct && getSimilarity(normalizedCity, ct) >= 0.8) {
                    normalizedCity = toTitleCase(ct);
                    break;
                }
            }
        }
    } catch (err) {
        console.error("Location Normalization Error:", err);
    }

    return { country: normalizedCountry, city: normalizedCity };
};

module.exports = {
    normalizeLocationInput,
    toTitleCase
};
