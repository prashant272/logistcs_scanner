import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    Send, Bot, Sparkles, Building2, MapPin, 
    CheckCircle2, DollarSign, ArrowRight, RefreshCw, RotateCcw, 
    Mic, MicOff, Search, Compass, ShieldCheck, ChevronRight, Copy, Check,
    Ship, Plane, Truck, FileText, Star, Award, Globe, Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Combined 4 Core Action Cards (Non-overlapping & Clean)
const QUICK_CARDS = [
    { 
        id: 1, 
        icon: Award,
        color: "blue",
        title: "Find Best Freight Forwarder", 
        desc: "Checklist, licenses to verify (IATA, FIATA, CHA) & top ranked portal partners", 
        prompt: "Best freight forwarder kaise find karein?" 
    },
    { 
        id: 2, 
        icon: MapPin,
        color: "indigo",
        title: "Search Vendors by Location", 
        desc: "Find verified forwarders by City or Country (Mumbai, Delhi, China, Dubai)", 
        prompt: "Search vendors by location" 
    },
    { 
        id: 3, 
        icon: Ship,
        color: "amber",
        title: "Shipping Routes & Port Guide", 
        desc: "Explore loading ports, transit schedules, and freight rate benchmarks", 
        prompt: "Shipping Routes & Port Guide"
    }
];

// Rich Formatter for Strong & Clear Typography
const FormattedMessage = ({ content }) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
        <div className="space-y-3 text-slate-800 leading-relaxed font-normal">
            {lines.map((rawLine, idx) => {
                const line = rawLine.trim();
                if (!line) return <div key={idx} className="h-1" />;

                // Main Section Headers ### Heading or #### Heading
                const isHeading3 = line.startsWith('###');
                const isHeading4 = line.startsWith('####');

                if (isHeading3 || isHeading4) {
                    const headingClean = line.replace(/^#{3,4}\s*/, '').replace(/\*\*/g, '');
                    return (
                        <div key={idx} className="pt-3 pb-1 border-b border-slate-200/80">
                            <h4 className="font-black text-[15px] text-slate-950 tracking-tight flex items-center gap-2">
                                <span className="w-2 h-4 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full inline-block"></span>
                                {headingClean}
                            </h4>
                        </div>
                    );
                }

                // Bullet point line
                const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
                const isNumbered = /^\d+\.\s/.test(line);

                // Parse bold parts: **text**
                const parts = line.split(/(\*\*.*?\*\*)/g);

                const renderedParts = parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const boldText = part.slice(2, -2);
                        return (
                            <strong 
                                key={pIdx} 
                                className="font-extrabold text-slate-950 bg-blue-50/90 text-blue-950 px-1.5 py-0.5 rounded mx-0.5 border border-blue-200/60 inline-block shadow-2xs"
                            >
                                {boldText}
                            </strong>
                        );
                    }
                    return <span key={pIdx}>{part}</span>;
                });

                if (isBullet || isNumbered) {
                    return (
                        <div key={idx} className="flex items-start gap-2.5 pl-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></span>
                            <div className="flex-1 text-[13.5px] text-slate-800 font-medium">
                                {renderedParts}
                            </div>
                        </div>
                    );
                }

                return (
                    <p key={idx} className="text-[13.5px] text-slate-800 font-medium">
                        {renderedParts}
                    </p>
                );
            })}
        </div>
    );
};

// Inline Freight Inquiry Card - Progressive Step-by-Step Flow
const InlineQuoteBox = ({ defaultFrom = ' ', defaultTo = ' ', defaultMode = 'sea' }) => {
    // step 1: Cargo details (Commodity & Type), step 2: Weight/CBM & Locations check
    const [step, setStep] = useState(1);
    const [fromLoc, setFromLoc] = useState(defaultFrom);
    const [toLoc, setToLoc] = useState(defaultTo);
    const [shipMode, setShipMode] = useState(defaultMode || 'sea');
    const [commodity, setCommodity] = useState('');
    const [weight, setWeight] = useState('');
    const [containerType, setContainerType] = useState('20ft Container');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                fromLocation: fromLoc,
                toLocation: toLoc,
                type: shipMode,
                category: 'international',
                commodity: commodity || 'General Cargo',
                message: `Direct Inquiry from AI Chat | Mode: ${shipMode.toUpperCase()} | Load: ${containerType} | Weight/CBM: ${weight || 'N/A'}`
            };
            await api.post('/enquiries', payload);
            setDone(true);
        } catch (err) {
            console.error(err);
            setDone(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-3.5 shadow-sm">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div>
                    <h5 className="font-extrabold text-sm text-emerald-950">Quotation Request Successfully Registered!</h5>
                    <p className="text-xs text-emerald-800 mt-1 font-semibold">
                        Logistics Scanner verified vendors active for <strong className="text-emerald-950">{fromLoc} → {toLoc}</strong> will review your cargo details and submit customized rates shortly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                        {step}
                    </span>
                    <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900">
                            {step === 1 ? 'Step 1: Specify Cargo & Packaging' : 'Step 2: Confirm Route & Weight'}
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                            {step === 1 ? 'Choose commodity and load type for quote' : `Route: ${fromLoc} → ${toLoc}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {step === 2 && (
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                        >
                            ← Back
                        </button>
                    )}
                    <span className="text-[10px] uppercase font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                        {shipMode} Freight
                    </span>
                </div>
            </div>

            {/* STEP 1: Commodity and Container / Packaging Selection */}
            {step === 1 && (
                <div className="space-y-3 pt-1">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Commodity / Goods Description:
                        </label>
                        <input
                            type="text"
                            value={commodity}
                            onChange={(e) => setCommodity(e.target.value)}
                            placeholder="e.g. Textiles, Auto Parts, Electronics, Chemicals..."
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Container / Packaging Type:
                        </label>
                        <select
                            value={containerType}
                            onChange={(e) => setContainerType(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        >
                            <option value="20ft Container">20ft Standard Ocean Container (FCL)</option>
                            <option value="40ft Container">40ft High Cube Ocean Container (FCL)</option>
                            <option value="LCL Loose Cargo">LCL (Loose Cargo / Shared Container)</option>
                            <option value="Air Cargo Box">Air Cargo Standard Carton / Pallet</option>
                            <option value="Road Full Truck">Full Truck Load (FTL)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                        <span>Next: Confirm Ports & Weight →</span>
                    </button>
                </div>
            )}

            {/* STEP 2: Weight & Port verification then Submit */}
            {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin Port / City</label>
                            <input
                                type="text"
                                required
                                value={fromLoc}
                                onChange={(e) => setFromLoc(e.target.value)}
                                placeholder="e.g. Mumbai, Nhava Sheva"
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination Port / City</label>
                            <input
                                type="text"
                                required
                                value={toLoc}
                                onChange={(e) => setToLoc(e.target.value)}
                                placeholder="e.g. Shanghai, Jebel Ali, USA"
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimated Weight / Volume / CBM (Optional):</label>
                        <input
                            type="text"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="e.g. 500 kg, 4 CBM, 18 Tons"
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                    >
                        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Submit Live Rate Request to Matched Vendors</span>
                    </button>
                </form>
            )}
        </div>
    );
};

// Interactive Location Search Selector Widget
const LocationSearchWidget = ({ onSearch }) => {
    const [basis, setBasis] = useState(null); // 'country' | 'city' | 'both'
    const [countryInput, setCountryInput] = useState('');
    const [cityInput, setCityInput] = useState('');

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (basis === 'city' && !cityInput.trim()) return;
        if (basis === 'country' && !countryInput.trim()) return;
        if (basis === 'both' && !countryInput.trim() && !cityInput.trim()) return;

        onSearch({
            basis,
            city: cityInput.trim(),
            country: countryInput.trim()
        });
    };

    return (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                        <MapPin className="w-4 h-4" />
                    </span>
                    <div>
                        <h5 className="font-black text-sm text-slate-900">
                            How would you like to search for vendors?
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Select search basis: City, Country, or Both
                        </p>
                    </div>
                </div>

                {/* 3 Choice Buttons */}
                <div className="grid grid-cols-3 gap-2.5 mt-3.5">
                    <button
                        type="button"
                        onClick={() => setBasis('city')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            basis === 'city'
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200'
                        }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>City</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBasis('country')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            basis === 'country'
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200'
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Country</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBasis('both')}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            basis === 'both'
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200'
                        }`}
                    >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Both (City & Country)</span>
                    </button>
                </div>
            </div>

            {/* Input Form based on selected basis */}
            {basis && (
                <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
                    {(basis === 'country' || basis === 'both') && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Enter Country Name:
                            </label>
                            <input
                                type="text"
                                required={basis === 'country'}
                                value={countryInput}
                                onChange={(e) => setCountryInput(e.target.value)}
                                placeholder="e.g. India, China, UAE, USA, Germany..."
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-indigo-600 outline-none"
                            />
                        </div>
                    )}

                    {(basis === 'city' || basis === 'both') && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Enter City Name:
                            </label>
                            <input
                                type="text"
                                required={basis === 'city'}
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                placeholder="e.g. Delhi, Mumbai, Shanghai, Ningbo, Dubai..."
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-indigo-600 outline-none"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        <Search className="w-4 h-4" />
                        <span>Search Vendors</span>
                    </button>
                </form>
            )}
        </div>
    );
};

// Interactive Route & Port Discovery Selector Widget - Step-by-Step Progressive Flow
const RouteSelectorWidget = ({ onSearch }) => {
    // step: 1 = Choose Mode, 2 = Enter Countries, 3 = Select Ports & Confirm
    const [step, setStep] = useState(1);
    const [shipMode, setShipMode] = useState(null); // 'sea' | 'air'
    const [fromCountry, setFromCountry] = useState('India');
    const [toCountry, setToCountry] = useState('China');
    const [selectedOriginPort, setSelectedOriginPort] = useState('');
    const [selectedDestPort, setSelectedDestPort] = useState('');

    // Pre-calculated major shipping ports & air hubs by country
    const PORT_DIRECTORY = {
        'india': {
            sea: ['Nhava Sheva (JNPT, Mumbai)', 'Mundra Port (Gujarat)', 'Chennai Port', 'Kolkata / Haldia Port', 'Hazira Port', 'Cochin Port', 'Pipavav Port'],
            air: ['Mumbai (BOM Air Cargo Hub)', 'Delhi (DEL Cargo Terminal)', 'Bengaluru (BLR Air Cargo)', 'Chennai (MAA Cargo)', 'Hyderabad (HYD Cargo)']
        },
        'china': {
            sea: ['Shanghai Port', 'Ningbo-Zhoushan Port', 'Shenzhen Port', 'Qingdao Port', 'Guangzhou Port', 'Tianjin Port', 'Xiamen Port'],
            air: ['Shanghai Pudong (PVG Air Hub)', 'Guangzhou Baiyun (CAN)', 'Shenzhen Baoan (SZX)', 'Beijing Capital (PEK)', 'Hong Kong (HKG Cargo)']
        },
        'uae': {
            sea: ['Jebel Ali Port (Dubai)', 'Khalifa Port (Abu Dhabi)', 'Sharjah Port', 'Fujairah Port'],
            air: ['Dubai Cargo Village (DXB)', 'Al Maktoum (DWC Air Hub)', 'Abu Dhabi Cargo (AUH)']
        },
        'usa': {
            sea: ['Port of Los Angeles / Long Beach', 'Port of New York & New Jersey', 'Port of Savannah', 'Port of Houston', 'Port of Seattle'],
            air: ['Chicago O\'Hare (ORD)', 'New York JFK Cargo', 'Los Angeles (LAX)', 'Atlanta (ATL Cargo)']
        },
        'germany': {
            sea: ['Port of Hamburg', 'Port of Bremen / Bremerhaven'],
            air: ['Frankfurt Cargo City (FRA)', 'Munich Airport (MUC)']
        }
    };

    const getPorts = (countryName, mode) => {
        const clean = (countryName || '').toLowerCase().trim();
        for (const key of Object.keys(PORT_DIRECTORY)) {
            if (clean.includes(key)) {
                return PORT_DIRECTORY[key][mode] || [];
            }
        }
        return mode === 'sea' ? ['Major Sea Port', 'Secondary Hub Port'] : ['International Air Cargo Terminal'];
    };

    const originPorts = getPorts(fromCountry, shipMode || 'sea');
    const destPorts = getPorts(toCountry, shipMode || 'sea');

    const handleSelectMode = (mode) => {
        setShipMode(mode);
        setSelectedOriginPort('');
        setSelectedDestPort('');
        setStep(2);
    };

    const handleProceedToPorts = (e) => {
        e.preventDefault();
        if (!fromCountry.trim() || !toCountry.trim()) return;
        setStep(3);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch({
            from: fromCountry,
            to: toCountry,
            mode: shipMode || 'sea',
            originPort: selectedOriginPort || originPorts[0],
            destPort: selectedDestPort || destPorts[0]
        });
    };

    return (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                        {step}
                    </span>
                    <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-900">
                            {step === 1 && "Step 1: Choose Shipment Transport Mode"}
                            {step === 2 && "Step 2: Enter Origin & Destination Country"}
                            {step === 3 && `Step 3: Select Active ${shipMode === 'sea' ? 'Sea Ports' : 'Airport Hubs'}`}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                            {step === 1 && "Select whether your cargo moves by Ocean (Sea) or by Air"}
                            {step === 2 && `Configuring route for ${shipMode === 'sea' ? '🌊 Sea Freight' : '✈️ Air Cargo'}`}
                            {step === 3 && `Major transit hubs for ${fromCountry} → ${toCountry}`}
                        </p>
                    </div>
                </div>

                {/* Back / Reset button if in step 2 or 3 */}
                {step > 1 && (
                    <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
                    >
                        ← Back
                    </button>
                )}
            </div>

            {/* STEP 1: Choose Mode Sea vs Air */}
            {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => handleSelectMode('sea')}
                        className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-400 text-left transition-all flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                            <Ship className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block font-black text-xs sm:text-sm text-blue-950">
                                🌊 Ocean / Sea Freight
                            </span>
                            <span className="block text-[11px] text-blue-800 font-medium mt-0.5">
                                FCL Containers, LCL Shared cargo, major seaports
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSelectMode('air')}
                        className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 hover:border-indigo-400 text-left transition-all flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                            <Plane className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block font-black text-xs sm:text-sm text-indigo-950">
                                ✈️ Air Cargo / Freight
                            </span>
                            <span className="block text-[11px] text-indigo-800 font-medium mt-0.5">
                                Express boxes, high priority, international airport terminals
                            </span>
                        </div>
                    </button>
                </div>
            )}

            {/* STEP 2: Enter Origin and Destination Countries */}
            {step === 2 && (
                <form onSubmit={handleProceedToPorts} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Origin Country:
                            </label>
                            <input
                                type="text"
                                required
                                value={fromCountry}
                                onChange={(e) => { setFromCountry(e.target.value); setSelectedOriginPort(''); }}
                                placeholder="e.g. India, UAE, China..."
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Destination Country:
                            </label>
                            <input
                                type="text"
                                required
                                value={toCountry}
                                onChange={(e) => { setToCountry(e.target.value); setSelectedDestPort(''); }}
                                placeholder="e.g. China, USA, UAE, Germany..."
                                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                        <span>Next: Select Specific {shipMode === 'sea' ? 'Ports' : 'Airports'} →</span>
                    </button>
                </form>
            )}

            {/* STEP 3: Select Ports & Submit Search */}
            {step === 3 && (
                <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                {shipMode === 'sea' ? `Select Origin Port (${fromCountry}):` : `Select Origin Airport (${fromCountry}):`}
                            </label>
                            <select
                                value={selectedOriginPort || originPorts[0]}
                                onChange={(e) => setSelectedOriginPort(e.target.value)}
                                className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                            >
                                {originPorts.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                {shipMode === 'sea' ? `Select Destination Port (${toCountry}):` : `Select Destination Airport (${toCountry}):`}
                            </label>
                            <select
                                value={selectedDestPort || destPorts[0]}
                                onChange={(e) => setSelectedDestPort(e.target.value)}
                                className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                            >
                                {destPorts.map((p, idx) => (
                                    <option key={idx} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 hover:from-amber-600 hover:to-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                        <Compass className="w-4 h-4" />
                        <span>Discover Route Timelines, Ports & Connect with Forwarders</span>
                    </button>
                </form>
            )}
        </div>
    );
};

const VendorAIChatTab = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [lastContext, setLastContext] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Speech-to-text setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'hi-IN';

            rec.onresult = (e) => {
                const text = e.results[0][0].transcript;
                if (text) {
                    setInput(text);
                    handleSend(text);
                }
                setIsListening(false);
            };
            rec.onerror = () => setIsListening(false);
            rec.onend = () => setIsListening(false);
            recognitionRef.current = rec;
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    // Trigger structured location prompt
    const handleStartLocationFlow = () => {
        const newMessages = [
            ...messages,
            {
                sender: 'user',
                text: 'Find Vendor by Location'
            },
            {
                sender: 'bot',
                text: '📍 **Find Logistics Vendors by Location:**\n\nPlease select whether you want to search by **City**, **Country**, or **Both** below.',
                showLocationSelector: true
            }
        ];
        setMessages(newMessages);
    };

    // Trigger structured interactive route & port discovery prompt
    const handleStartRouteFlow = () => {
        const newMessages = [
            ...messages,
            {
                sender: 'user',
                text: 'Shipping Routes & Port Guide'
            },
            {
                sender: 'bot',
                text: '🚢 **Interactive Shipping Route & Port Hub Discovery:**\n\nConfigure your origin, destination, and mode of shipment (Sea FCL/LCL or Air Cargo) below to view active loading ports, discharge hubs, transit timelines, and get verified quotes directly.',
                showRouteSelector: true
            }
        ];
        setMessages(newMessages);
    };

    // Execute route search via backend
    const handleRouteSearchSubmit = async (routeParams) => {
        const promptText = `Best shipping route from ${routeParams.from} (${routeParams.originPort}) to ${routeParams.to} (${routeParams.destPort}) mode ${routeParams.mode}`;

        const newMessages = [...messages, { sender: 'user', text: promptText }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await api.post('/chatbot/query', {
                message: promptText,
                lastContext,
                history: newMessages.map(m => ({ sender: m.sender, text: m.text }))
            });

            if (res.data?.success) {
                if (res.data.context) {
                    setLastContext(res.data.context);
                }
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: res.data.reply,
                        routeInfo: {
                            from: routeParams.from,
                            to: routeParams.to,
                            mode: routeParams.mode,
                            originPort: routeParams.originPort,
                            destPort: routeParams.destPort
                        },
                        showQuoteForm: false, // Inquire naturally in chat
                        vendors: res.data.vendors || [],
                        rates: res.data.rates || []
                    }
                ]);
            }
        } catch (error) {
            console.error('Route search error:', error);
            setMessages([
                ...newMessages,
                {
                    sender: 'bot',
                    text: 'Unable to analyze route right now. Please try again.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Execute location search via backend
    const handleLocationSearchSubmit = async (locParams) => {
        const locLabel = [locParams.city, locParams.country].filter(Boolean).join(', ');
        const promptText = `Find vendors in ${locLabel} (Basis: ${locParams.basis})`;

        const newMessages = [...messages, { sender: 'user', text: promptText }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await api.post('/chatbot/query', {
                message: promptText,
                locationSearch: locParams,
                lastContext,
                history: newMessages.map(m => ({ sender: m.sender, text: m.text }))
            });

            if (res.data?.success) {
                if (res.data.context) {
                    setLastContext(res.data.context);
                }
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: res.data.reply,
                        vendors: res.data.vendors || [],
                        rates: res.data.rates || []
                    }
                ]);
            }
        } catch (error) {
            console.error('Location search error:', error);
            setMessages([
                ...newMessages,
                {
                    sender: 'bot',
                    text: 'Unable to fetch vendors right now. Please try again.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (queryText) => {
        const text = (queryText || input).trim();
        if (!text || loading) return;

        // Check if query is about location search without specific city/country
        const lower = text.toLowerCase();
        if (
            (lower.includes('find vendor') || lower.includes('search vendor')) &&
            (lower.includes('country') || lower.includes('city') || lower.includes('location')) &&
            !lower.includes('delhi') && !lower.includes('mumbai') && !lower.includes('china') && !lower.includes('dubai')
        ) {
            handleStartLocationFlow();
            setInput('');
            return;
        }

        const newMessages = [...messages, { sender: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chatbot/query', {
                message: text,
                lastContext,
                history: newMessages.map(m => ({ sender: m.sender, text: m.text }))
            });

            if (res.data?.success) {
                if (res.data.context) {
                    setLastContext(res.data.context);
                }
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: res.data.reply,
                        options: res.data.options || [],
                        vendors: res.data.vendors || [],
                        rates: res.data.rates || [],
                        enquiryCreated: res.data.enquiryCreated || false
                    }
                ]);
            } else {
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: "Sorry, could not process the response. Please try again."
                    }
                ]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages([
                ...newMessages,
                {
                    sender: 'bot',
                    text: "Connection error. Make sure the backend server is running."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setLastContext(null);
        setInput('');
    };

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Logistics AI Assistant</h2>
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Portal Database & AI Active
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Instant Freight Quotes, Verified Forwarders, Port Navigation & Customs</p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
                        title="New Chat"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Chat
                    </button>
                )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
                {/* Initial View: 7 Quick Prompt Cards */}
                {messages.length === 0 && (
                    <div className="max-w-4xl mx-auto py-6 space-y-6">
                        <div className="text-center space-y-2.5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Smart Logistics AI
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                Find the Best Freight Forwarders & Live Shipping Rates
                            </h3>
                            <p className="text-sm text-slate-600 max-w-lg mx-auto font-medium">
                                Choose one of the quick options below or type your freight requirement in English or Hindi.
                            </p>
                        </div>

                        {/* 3 Clean Action Cards Grid in one row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {QUICK_CARDS.map((card) => {
                                const CardIcon = card.icon;
                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => handleSend(card.prompt)}
                                        className="p-5 bg-white hover:bg-slate-50/80 rounded-2xl border-2 border-slate-200/90 hover:border-blue-500 text-left transition-all duration-200 shadow-xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                                                    <CardIcon className="w-5 h-5" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                                                    Action 0{card.id}
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                {card.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                                                {card.desc}
                                            </p>
                                        </div>
                                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-blue-600">
                                            <span>Start with AI</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Conversation Messages */}
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3.5 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                        <div
                            className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-sm ${
                                m.sender === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-blue-500/20'
                            }`}
                        >
                            {m.sender === 'user' ? 'YOU' : <Bot className="w-5 h-5" />}
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Message Bubble */}
                            <div
                                className={`p-5 rounded-2xl shadow-sm relative group border ${
                                    m.sender === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none border-blue-700 font-medium'
                                        : 'bg-white border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs'
                                }`}
                            >
                                {m.sender === 'user' ? (
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-semibold">{m.text}</p>
                                ) : (
                                    <>
                                        <FormattedMessage content={m.text} />
                                        {/* Copy button */}
                                        <button
                                            onClick={() => handleCopy(m.text, idx)}
                                            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy response"
                                        >
                                            {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Clickable Quick Option Pills (e.g. Numbered Ports: 1. Nhava Sheva, 2. Mundra) */}
                            {m.options && m.options.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                                        Click to Select Option:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {m.options.map((opt, oIdx) => (
                                            <button
                                                key={oIdx}
                                                type="button"
                                                onClick={() => handleSend(`${opt.number}`)}
                                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border-2 border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2 cursor-pointer group"
                                            >
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-[10px] font-black transition-colors">
                                                    {opt.number}
                                                </span>
                                                <span>{opt.label}</span>
                                                {opt.code && (
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        ({opt.code})
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Published Vendor Rates Card */}
                            {m.rates && m.rates.length > 0 && (
                                <div className="bg-emerald-50/60 border-2 border-emerald-300/80 rounded-2xl p-4 shadow-2xs space-y-2">
                                    <h5 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                        Direct Vendor Rates Available in Database ({m.rates.length})
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {m.rates.map((r, rIdx) => (
                                            <div
                                                key={r._id || rIdx}
                                                className="bg-white rounded-xl p-3 border border-emerald-200 flex items-center justify-between"
                                            >
                                                <div>
                                                    <h6 className="font-black text-xs text-slate-900">
                                                        {r.vendor?.company || r.vendor?.name || 'Verified Vendor'}
                                                    </h6>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        {r.seaLoadType || r.deliverySpeed || 'Standard'} • {r.type?.toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-emerald-700 text-sm">
                                                        ₹{Number(r.price).toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                                                        {r.currency || 'INR'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Verified & Recommended Forwarders on Logistics Scanner */}
                            {m.vendors && m.vendors.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between px-1">
                                        <h5 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                            Portal Vendors ({m.vendors.length})
                                        </h5>
                                        <div className="flex items-center gap-2 text-[10px] font-bold">
                                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Recommended
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {m.vendors.map((v, vIdx) => {
                                            // Mutual exclusivity: if isRecommended, show Recommended badge; else if verified, show Verified Vendor badge
                                            const isRec = Boolean(v.isRecommended);
                                            const isVer = !isRec && Boolean(v.isVerifiedVendor || v.isVerified || v.verificationStatus === 'Approved');

                                            return (
                                                <div
                                                    key={v._id || vIdx}
                                                    className={`bg-white rounded-2xl p-4 shadow-xs hover:shadow-md transition-all group border-2 ${
                                                        isRec 
                                                            ? 'border-amber-300 ring-1 ring-amber-200/60 bg-gradient-to-br from-amber-50/20 via-white to-white' 
                                                            : 'border-slate-200/90 hover:border-blue-500'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            {/* Distinct Badge: Either Recommended OR Verified Vendor */}
                                                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                                {isRec && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                                                                        <Star className="w-3 h-3 fill-white text-white" />
                                                                        Recommended
                                                                    </span>
                                                                )}
                                                                {isVer && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                        Verified Vendor
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                <h5 className="font-black text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                                                                    {v.company || v.name}
                                                                </h5>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                                                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                                                {v.city ? `${v.city}, ` : ''}{v.country || 'India'}
                                                            </p>
                                                        </div>

                                                        <Link
                                                            to={`/vendor-network/profile/${v._id}`}
                                                            target="_blank"
                                                            className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl border transition-all shadow-2xs whitespace-nowrap ${
                                                                isRec 
                                                                    ? 'text-amber-800 bg-amber-50 hover:bg-amber-500 hover:text-white border-amber-300' 
                                                                    : 'text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border-blue-200'
                                                            }`}
                                                        >
                                                            View Profile
                                                        </Link>
                                                    </div>

                                                    {v.services && v.services.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-3">
                                                            {v.services.slice(0, 3).map((s, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                                >
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2.5 text-slate-700 text-xs font-bold bg-white border border-slate-200 p-4 rounded-2xl max-w-sm shadow-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        Fetching verified vendors & rate breakdown...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-white border-t border-slate-200 p-4 shadow-sm">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2.5"
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening... bolna shuru kijiye..." : "Ask freight question (e.g. best rate mumbai to china mode sea, Top 10 forwarders)..."}
                            className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm font-semibold px-4 py-3.5 rounded-xl border transition-all outline-none ${
                                isListening 
                                    ? 'border-red-500 ring-3 ring-red-500/20 bg-red-50/20' 
                                    : 'border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
                            }`}
                        />
                    </div>

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={toggleVoice}
                        className={`p-3.5 rounded-xl border transition-all ${
                            isListening 
                                ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                        title={isListening ? "Stop Voice" : "Voice Input (Hindi/English)"}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span>Send</span>
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VendorAIChatTab;
