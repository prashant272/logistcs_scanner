import React, { useState, useEffect } from 'react';
import { Ship, Plane, Truck, Warehouse, ClipboardList, ArrowLeftRight, CheckCircle2, Search, ArrowRight, Loader2, Sparkles, Info, X, Phone, Mail, Building, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocations } from '../../services/LocationService';
import { usePricing } from '../../services/PricingService';
import { useEnquiries } from '../../services/EnquiryService';

const AIRLINES_DOMESTIC = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Akasa Air'];
const AIRLINES_INTERNATIONAL = ['Emirates', 'Qatar Airways', 'Singapore Airlines', 'British Airways', 'Lufthansa', 'Delta Air Lines', 'Etihad Airways'];

const COUNTRY_CODES = [
    { code: '+91', country: 'IN' },
    { code: '+1', country: 'US' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'AE' },
    { code: '+65', country: 'SG' },
    { code: '+86', country: 'CN' }
];

const SearchPrice = ({ isDashboard = false }) => {
    const { user } = useAuth();
    const { getSuggestions, fetchLocations } = useLocations();
    const { searchRates } = usePricing();
    const { createEnquiry, submissionStatus: enquiryStatus, setSubmissionStatus: setEnquiryStatus } = useEnquiries();
    const navigate = useNavigate();

    // Sync tab identifiers: sea, air, land, warehouse, cha
    const [activeTab, setActiveTab] = useState('sea');
    
    // Form States
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [width, setWidth] = useState('');
    const [length, setLength] = useState('');
    const [unit, setUnit] = useState('cm');
    const [quantity, setQuantity] = useState('');
    const [loadType, setLoadType] = useState('');
    const [fclStandard, setFclStandard] = useState('');
    const [fclUnit, setFclUnit] = useState('');
    const [lclWeightRange, setLclWeightRange] = useState('');
    const [lclVolumeRange, setLclVolumeRange] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [landCountry, setLandCountry] = useState('India');
    const [warehouseCountry, setWarehouseCountry] = useState('');
    const [warehouseState, setWarehouseState] = useState('');
    const [warehouseDistrict, setWarehouseDistrict] = useState('');
    const [warehouseCity, setWarehouseCity] = useState('');
    const [warehouseRateType, setWarehouseRateType] = useState('Display All Rates');
    const [storageType, setStorageType] = useState('');
    const [warehouseLocationsData, setWarehouseLocationsData] = useState([]);
    const [chaType, setChaType] = useState('Air');
    const [port, setPort] = useState('');
    const [chaCargoType, setChaCargoType] = useState('Select Type');

    // Air Freight Extra States
    const [airCategory, setAirCategory] = useState('domestic');
    const [airAirline, setAirAirline] = useState('');
    const [handlingType, setHandlingType] = useState('General Cargo');
    const [additionalServices, setAdditionalServices] = useState('');

    // Guest Info / Get A Quote Popup States
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestCompany, setGuestCompany] = useState('');
    const [guestCommodity, setGuestCommodity] = useState('');
    const [guestPhoneCode, setGuestPhoneCode] = useState('+91');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [selectedRateForQuote, setSelectedRateForQuote] = useState(null);

    // Search Action States
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState(null); // null means not searched yet, [] means no results, [...] means matched
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [showSuccessPage, setShowSuccessPage] = useState(false);

    // IHC / Via Ports States
    const [availableViaPorts, setAvailableViaPorts] = useState([]);
    const [selectedViaPort, setSelectedViaPort] = useState('');
    const [loadingViaPorts, setLoadingViaPorts] = useState(false);

    // Fetch via ports when destination changes (if Sea tab)
    useEffect(() => {
        if (activeTab === 'sea' && destination && destination.length > 2) {
            const fetchVia = async () => {
                setLoadingViaPorts(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ihc/via-ports?destination=${encodeURIComponent(destination)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setAvailableViaPorts(data.data || []);
                        if (!data.data?.includes(selectedViaPort)) {
                            setSelectedViaPort('');
                        }
                    }
                } catch (err) {
                    console.error('Error fetching via ports:', err);
                } finally {
                    setLoadingViaPorts(false);
                }
            };
            
            const timeoutId = setTimeout(fetchVia, 500); // debounce
            return () => clearTimeout(timeoutId);
        } else {
            setAvailableViaPorts([]);
            setSelectedViaPort('');
        }
    }, [destination, activeTab]);

    // Reset results when tab changes
    useEffect(() => {
        setSearchResults(null);
        setSearchPerformed(false);
        setEnquiryStatus('');
        setShowSuccessPage(false);

        if (activeTab === 'warehouse' && warehouseLocationsData.length === 0) {
            fetchLocations(1, 1000, '', 'Warehouse').then(data => {
                if (data && data.locations) {
                    setWarehouseLocationsData(data.locations);
                }
            }).catch(err => console.error('Error loading warehouse locations:', err));
        }
    }, [activeTab]);

    // Autocomplete Suggestion States
    const [suggestions, setSuggestions] = useState([]);
    const [activeInput, setActiveInput] = useState(null); // 'origin', 'destination', 'warehouse', 'port'
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const fetchSuggestions = async (query, inputType) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        try {
            // Map active tab to strict type parameters for backend query
            let typeParam = '';
            if (activeTab === 'sea') typeParam = 'Seaport';
            else if (activeTab === 'air') typeParam = 'Airport';
            else if (activeTab === 'land') typeParam = 'Land Port';
            else if (activeTab === 'warehouse') typeParam = 'Warehouse';
            else if (activeTab === 'cha') {
                if (chaType === 'Air') typeParam = 'Airport';
                else if (chaType === 'Sea') typeParam = 'Seaport';
                else if (chaType === 'Land') typeParam = 'Land Port';
                else typeParam = 'Seaport,Airport';
            }

            const locations = await getSuggestions(query, typeParam);
            setSuggestions(locations || []);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        let activeQuery = '';
        if (activeInput === 'origin') activeQuery = origin;
        else if (activeInput === 'destination') activeQuery = destination;
        else if (activeInput === 'port') activeQuery = port;

        if (!activeQuery || activeQuery.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            fetchSuggestions(activeQuery, activeInput);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [origin, destination, port, activeInput]);

    const handleSelectSuggestion = (loc, inputType) => {
        // Format as City (Code) if code exists, otherwise just City
        const value = loc.code ? `${loc.city} (${loc.code})` : loc.city;
        if (inputType === 'origin') {
            setOrigin(value);
        } else if (inputType === 'destination') {
            setDestination(value);
        } else if (inputType === 'port') {
            setPort(value);
        }
        setSuggestions([]);
        setActiveInput(null);
    };

    const renderSuggestions = (inputType) => {
        if (activeInput !== inputType || suggestions.length === 0) return null;

        return (
            <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto w-full suggestions-scrollbar">
                {suggestions.map((loc) => (
                    <div
                        key={loc._id}
                        onMouseDown={() => handleSelectSuggestion(loc, inputType)}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-left transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-black !text-slate-900 truncate">
                                {loc.city}, {loc.country}
                            </span>
                            <span className="text-[10px] !text-slate-400 font-bold truncate">
                                {loc.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {loc.code && (
                                <span className="bg-[#0066FF]/10 text-[#0066FF] text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-[#0066FF]/20">
                                    {loc.code}
                                </span>
                            )}
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                {loc.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const handleSwap = () => {
        const temp = origin;
        setOrigin(destination);
        setDestination(temp);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearching(true);
        setSearchResults(null);
        setSearchPerformed(true);
        setEnquiryStatus('');
        setShowSuccessPage(false);

        let fromLoc = origin;
        let toLoc = destination;

        if (activeTab === 'warehouse') {
            fromLoc = warehouseCity;
            toLoc = 'Warehouse';
        } else if (activeTab === 'cha') {
            fromLoc = port;
            toLoc = 'Customs Port';
        }

        const payload = {
            fromLocation: fromLoc,
            toLocation: toLoc,
            type: activeTab,
            category: activeTab === 'air' ? airCategory : undefined,
            airline: activeTab === 'air' && airCategory !== 'domestic' ? airAirline : undefined,
            weightRange: activeTab === 'sea' && loadType === 'LCL' ? lclWeightRange : (activeTab === 'air' ? weight : undefined),
            cbmRange: activeTab === 'sea' && loadType === 'LCL' ? lclVolumeRange : undefined,
            truckLoad: activeTab === 'land' ? loadType : undefined,
            vehicleType: activeTab === 'land' ? vehicleType : undefined,
            seaLoadType: activeTab === 'sea' ? loadType : undefined,
            fclStandard: activeTab === 'sea' ? fclStandard : undefined,
            warehouseRateType: activeTab === 'warehouse' ? warehouseRateType : undefined,
            warehouseStorageType: activeTab === 'warehouse' ? storageType : undefined,
            chaServiceType: activeTab === 'cha' ? chaType : undefined,
            chaCargoType: activeTab === 'cha' ? chaCargoType : undefined,
            viaPort: activeTab === 'sea' ? selectedViaPort : undefined
        };

        try {
            const data = await searchRates(payload);
            setSearching(false);
            const targetPath = user 
                ? (user.role === 'customer' ? '/customer/search-results' : '/vendor/search-results')
                : '/search-results';
            navigate(targetPath, {
                state: {
                    payload,
                    results: data.matched ? data.results : [],
                    searchQueryDetails: {
                        origin,
                        destination,
                        activeTab,
                        weight,
                        height,
                        width,
                        length,
                        quantity,
                        loadType,
                        fclStandard,
                        fclUnit,
                        lclWeightRange,
                        lclVolumeRange,
                        vehicleType,
                        landCountry,
                        warehouseCountry,
                        warehouseState,
                        warehouseDistrict,
                        warehouseCity,
                        warehouseRateType,
                        storageType,
                        chaType,
                        port,
                        chaCargoType,
                        airCategory,
                        airAirline,
                        handlingType,
                        additionalServices
                    }
                }
            });
        } catch (err) {
            console.error('Search error:', err);
            setSearching(false);
            const targetPath = user 
                ? (user.role === 'customer' ? '/customer/search-results' : '/vendor/search-results')
                : '/search-results';
            navigate(targetPath, {
                state: {
                    payload,
                    results: [],
                    searchQueryDetails: {
                        origin,
                        destination,
                        activeTab,
                        weight,
                        height,
                        width,
                        length,
                        quantity,
                        loadType,
                        fclStandard,
                        fclUnit,
                        lclWeightRange,
                        lclVolumeRange,
                        vehicleType,
                        landCountry,
                        warehouseCountry,
                        warehouseState,
                        warehouseDistrict,
                        warehouseCity,
                        warehouseRateType,
                        storageType,
                        chaType,
                        port,
                        chaCargoType,
                        airCategory,
                        airAirline,
                        handlingType,
                        additionalServices
                    }
                }
            });
        }
    };

    const handleCreateEnquiry = async (matchedRate = null, autoDirect = false) => {
        if (!user && !autoDirect) {
            // Guest clicked submit on a matched rate:
            setSelectedRateForQuote(matchedRate);
            setIsQuoteModalOpen(true);
            return;
        }

        setEnquiryStatus('submitting');
        
        let fromLoc = origin;
        let toLoc = destination;

        if (activeTab === 'warehouse') {
            fromLoc = warehouseCity;
            toLoc = 'Warehouse';
        } else if (activeTab === 'cha') {
            fromLoc = port;
            toLoc = 'Customs Port';
        }

        const payload = {
            fromLocation: fromLoc,
            toLocation: toLoc,
            type: activeTab,
            category: activeTab === 'air' ? airCategory : undefined,
            airline: activeTab === 'air' ? airAirline : undefined,
            weightRange: activeTab === 'air' ? weight : undefined,
            truckLoad: activeTab === 'land' ? loadType : undefined,
            vehicleType: activeTab === 'land' ? vehicleType : undefined,
            handlingType: handlingType || 'General Cargo',
            additionalServices: additionalServices || '',
            deliverySpeed: matchedRate ? matchedRate.deliverySpeed : '3-4',
            price: matchedRate ? matchedRate.price : null,
            vendor: matchedRate ? matchedRate.vendor._id : null,
            isDirect: matchedRate ? false : true
        };

        try {
            await createEnquiry(payload);
            setShowSuccessPage(true);
        } catch (err) {
            console.error('Error submitting enquiry:', err);
        }
    };

    const handleGuestQuoteSubmit = async (e) => {
        e.preventDefault();

        let fromLoc = origin;
        let toLoc = destination;

        if (activeTab === 'warehouse') {
            fromLoc = warehouseCity;
            toLoc = 'Warehouse';
        } else if (activeTab === 'cha') {
            fromLoc = port;
            toLoc = 'Customs Port';
        }

        const payload = {
            fromLocation: fromLoc,
            toLocation: toLoc,
            type: activeTab,
            category: activeTab === 'air' ? airCategory : undefined,
            airline: activeTab === 'air' ? airAirline : undefined,
            weightRange: activeTab === 'air' ? weight : undefined,
            truckLoad: activeTab === 'land' ? loadType : undefined,
            vehicleType: activeTab === 'land' ? vehicleType : undefined,
            handlingType: handlingType || 'General Cargo',
            additionalServices: additionalServices || '',
            deliverySpeed: selectedRateForQuote ? selectedRateForQuote.deliverySpeed : '3-4',
            price: selectedRateForQuote ? selectedRateForQuote.price : null,
            vendor: selectedRateForQuote ? selectedRateForQuote.vendor._id : null,
            isDirect: selectedRateForQuote ? false : true,
            // Guest fields
            guestName,
            guestCompany,
            guestPhone: `${guestPhoneCode} ${guestPhone}`,
            guestEmail,
            commodity: guestCommodity
        };

        try {
            await createEnquiry(payload);
            setIsQuoteModalOpen(false);
            setShowSuccessPage(true);
            resetGuestForm();
        } catch (err) {
            console.error('Error submitting guest enquiry:', err);
            alert('Error submitting quote request. Please try again.');
        }
    };

    const resetGuestForm = () => {
        setGuestName('');
        setGuestCompany('');
        setGuestCommodity('');
        setGuestPhone('');
        setGuestEmail('');
        setSelectedRateForQuote(null);
    };

    const handleGoBack = () => {
        setSearchResults(null);
        setSearchPerformed(false);
        setEnquiryStatus('');
        setShowSuccessPage(false);
    };

    const airlinesOptions = airCategory === 'domestic' ? AIRLINES_DOMESTIC : AIRLINES_INTERNATIONAL;

    return (
        <section id="search-price-section" className={`bg-[#f4f7fc] pb-12 px-4 font-sans relative z-20 ${isDashboard ? 'pt-6' : ''}`}>
            <div className={`w-full max-w-[1400px] mx-auto ${isDashboard ? 'mt-0' : '-mt-16 lg:-mt-24'}`}>
                <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(11,30,67,0.06)] border border-slate-100 p-0">
                    
                    {/* Tabs Strip */}
                    <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none bg-white">
                        {[
                            { id: 'sea', label: 'Ocean Freight', icon: <Ship size={16} /> },
                            { id: 'air', label: 'Air Freight', icon: <Plane size={16} /> },
                            { id: 'land', label: 'Road Freight', icon: <Truck size={16} /> },
                            { id: 'warehouse', label: 'Warehousing', icon: <Warehouse size={16} /> },
                            { id: 'cha', label: 'Customs Clearance (CHA)', icon: <ClipboardList size={16} /> }
                        ].map((tab, idx, arr) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-2.5 px-6 py-5 text-xs font-black transition-all border-b-[3px] cursor-pointer whitespace-nowrap flex-1 hover:text-[#0066FF] ${
                                    idx !== arr.length - 1 ? 'border-r border-slate-100' : ''
                                } ${
                                    activeTab === tab.id
                                        ? 'border-[#0066FF] !text-[#0066FF] bg-slate-50/30'
                                        : 'border-transparent !text-slate-700'
                                }`}
                            >
                                <span className={activeTab === tab.id ? 'text-[#0066FF]' : 'text-slate-400'}>
                                    {tab.icon}
                                </span>
                                <span className={activeTab === tab.id ? '!text-[#0066FF]' : '!text-slate-700'}>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Form & Input Fields */}
                    <div className="p-6 md:p-8 bg-white">
                        
                        {showSuccessPage ? (
                            /* Success Screen */
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
                                <div className="p-4 bg-green-50 text-green-500 rounded-full border-4 border-green-100/80 animate-bounce">
                                    <CheckCircle size={48} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-[#0B1E43] tracking-tight">Your Enquiry Submitted Successfully!</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Our verified vendors will connect with you shortly.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                                    <button
                                        onClick={handleGoBack}
                                        className="flex-1 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-3 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 cursor-pointer uppercase tracking-wider"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        onClick={() => navigate('/vendor-network')}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                                    >
                                        Explore More
                                    </button>
                                </div>
                                <a
                                    href="mailto:support@logisticsscanner.com?subject=Freight Inquiry Assistance"
                                    className="text-xs text-slate-400 hover:text-[#0066FF] font-bold transition-colors underline"
                                >
                                    For any query connect me
                                </a>
                            </div>
                        ) : (
                            /* Regular Search Form */
                            <form onSubmit={handleSearch} className="space-y-6">

                                {/* ==================== OCEAN (SEA) FREIGHT ==================== */}
                                {activeTab === 'sea' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end border-b border-slate-100 pb-4 mb-4">
                                            <div className="lg:col-span-2 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Cargo / Load Type</label>
                                                <select
                                                    value={loadType}
                                                    onChange={(e) => setLoadType(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all shadow-sm cursor-pointer"
                                                >
                                                    <option value="">Select Load Type</option>
                                                    <option value="LCL">Less Container Load (LCL)</option>
                                                    <option value="FCL">Full Container Load (FCL)</option>
                                                </select>
                                            </div>

                                            <div className="lg:col-span-3 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Origin</label>
                                                <input
                                                    type="text"
                                                    placeholder="POL (Port of Loading)"
                                                    value={origin} onFocus={() => setActiveInput('origin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    onChange={(e) => setOrigin(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                                 {renderSuggestions('origin')}
                                             </div>
    
                                            <div className="lg:col-span-1 flex justify-center pb-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSwap}
                                                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-3 rounded-full transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                                    title="Swap"
                                                >
                                                    <ArrowLeftRight size={14} className="text-[#0066FF]" />
                                                </button>
                                            </div>
    
                                            <div className="lg:col-span-3 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Destination</label>
                                                <input
                                                    type="text"
                                                    placeholder="POD (Port of Discharge)"
                                                    value={destination} onFocus={() => setActiveInput('destination')} onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    onChange={(e) => setDestination(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                                 {renderSuggestions('destination')}
                                             </div>
    
                                            <div className="lg:col-span-2 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all shadow-sm cursor-pointer"
                                                    required
                                                />
                                            </div>
    
                                            <div className="lg:col-span-1">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>

                                        {loadType === 'LCL' && (
                                            <div className="flex flex-col items-center gap-4 pt-2 pb-4 w-full">
                                                <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                                                    <div className="w-32">
                                                        <input type="text" placeholder="Length" value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm" />
                                                    </div>
                                                    <div className="w-32">
                                                        <input type="text" placeholder="Width" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm" />
                                                    </div>
                                                    <div className="w-32">
                                                        <input type="text" placeholder="Height" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm" />
                                                    </div>
                                                    <div className="w-32">
                                                        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                                                            <option value="cm">cm</option>
                                                            <option value="in">in</option>
                                                            <option value="m">m</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-32">
                                                        <input type="text" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="flex justify-center items-center gap-4 w-full">
                                                    <div className="w-40">
                                                        <select value={lclWeightRange} onChange={(e) => setLclWeightRange(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                                                            <option value="">Select Weight</option>
                                                            <option value="0-5">0-5 Tonnes</option>
                                                            <option value="5-15">5-15 Tonnes</option>
                                                            <option value="15-45">15-45 Tonnes</option>
                                                            <option value="45+">45+ Tonnes</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-40">
                                                        <select value={lclVolumeRange} onChange={(e) => setLclVolumeRange(e.target.value)} className="w-full bg-[#f0f7ff] border border-[#0066FF]/30 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                                                            <option value="">Select Volume</option>
                                                            <option value="0-5">0-5 CBM</option>
                                                            <option value="5-15">5-15 CBM</option>
                                                            <option value="15-45">15-45 CBM</option>
                                                            <option value="45+">45+ CBM</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {loadType === 'FCL' && (
                                            <div className="flex justify-center items-center gap-4 pt-2 pb-4 w-full">
                                                <div className="w-48">
                                                    <select value={fclStandard} onChange={(e) => setFclStandard(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                                                        <option value="">Select FCL Standard</option>
                                                        <option value="20ft">20ft Standard</option>
                                                        <option value="40ft">40ft Standard</option>
                                                        <option value="40ft HC">40ft High Cube</option>
                                                    </select>
                                                </div>
                                                <div className="w-40">
                                                    <select value={fclUnit} onChange={(e) => setFclUnit(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                                                        <option value="">Select Unit</option>
                                                        <option value="1">1 Container</option>
                                                        <option value="2">2 Containers</option>
                                                        <option value="3">3 Containers</option>
                                                        <option value="4+">4+ Containers</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ==================== AIR FREIGHT ==================== */}
                                {activeTab === 'air' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                            <div className="lg:col-span-3 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Origin</label>
                                                <input
                                                    type="text"
                                                    placeholder="City or Airport"
                                                    value={origin}
                                                    onChange={(e) => setOrigin(e.target.value)}
                                                    onFocus={() => setActiveInput('origin')}
                                                    onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                                {renderSuggestions('origin')}
                                            </div>

                                            <div className="lg:col-span-1 flex justify-center pb-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSwap}
                                                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-3 rounded-full transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                                    title="Swap"
                                                >
                                                    <ArrowLeftRight size={14} className="text-[#0066FF]" />
                                                </button>
                                            </div>

                                            <div className="lg:col-span-3 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Destination</label>
                                                <input
                                                    type="text"
                                                    placeholder="City or Airport"
                                                    value={destination}
                                                    onChange={(e) => setDestination(e.target.value)}
                                                    onFocus={() => setActiveInput('destination')}
                                                    onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                                {renderSuggestions('destination')}
                                            </div>

                                            <div className="lg:col-span-2 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all shadow-sm cursor-pointer"
                                                    required
                                                />
                                            </div>

                                            <div className="lg:col-span-2 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Weight Class</label>
                                                <select
                                                    value={weight}
                                                    onChange={(e) => setWeight(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                >
                                                    <option value="">Select Weight</option>
                                                    <option value="0-50">0 - 50 kg</option>
                                                    <option value="50-100">50 - 100 kg</option>
                                                    <option value="100-500">100 - 500 kg</option>
                                                    <option value="500+">500+ kg</option>
                                                </select>
                                            </div>

                                            <div className="lg:col-span-1">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>

                                        {/* Air Extra Specific Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 mt-2">
                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</label>
                                                <select
                                                    value={airCategory}
                                                    onChange={(e) => setAirCategory(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF]"
                                                >
                                                    <option value="domestic">Domestic</option>
                                                    <option value="international">International</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Airline Preference</label>
                                                <select
                                                    value={airAirline}
                                                    onChange={(e) => setAirAirline(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF]"
                                                >
                                                    <option value="">Any Airline</option>
                                                    {airlinesOptions.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Handling Type</label>
                                                <select
                                                    value={handlingType}
                                                    onChange={(e) => setHandlingType(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF]"
                                                >
                                                    <option value="General Cargo">General Cargo</option>
                                                    <option value="Hazardous Goods">Hazardous Goods</option>
                                                    <option value="Perishable Goods">Perishable Goods</option>
                                                    <option value="Fragile Items">Fragile Items</option>
                                                    <option value="Valuables">Valuables</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Additional Services</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Packing, Insurance"
                                                    value={additionalServices}
                                                    onChange={(e) => setAdditionalServices(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ==================== ROAD (LAND) FREIGHT ==================== */}
                                {activeTab === 'land' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end border-b border-slate-100 pb-4 mb-4">
                                            <div className="lg:col-span-4 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Country</label>
                                                <select
                                                    value={landCountry}
                                                    onChange={(e) => setLandCountry(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                    required
                                                >
                                                    <option value="India">India</option>
                                                    <option value="USA">USA</option>
                                                    <option value="UK">UK</option>
                                                    <option value="UAE">UAE</option>
                                                    <option value="Singapore">Singapore</option>
                                                    <option value="China">China</option>
                                                </select>
                                            </div>

                                            <div className="lg:col-span-4 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Load Type</label>
                                                <select
                                                    value={loadType}
                                                    onChange={(e) => setLoadType(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                    required
                                                >
                                                    <option value="">Select Load Type</option>
                                                    <option value="PTL">Part Truck Load (PTL)</option>
                                                    <option value="FTL">Full Truck Load (FTL)</option>
                                                </select>
                                            </div>

                                            <div className="lg:col-span-4 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Vehicle Type</label>
                                                <select
                                                    value={vehicleType}
                                                    onChange={(e) => setVehicleType(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                    required
                                                >
                                                    <option value="">Select Vehicle Type</option>
                                                    <option value="Open Body Truck">Open Body Truck</option>
                                                    <option value="Closed Container">Closed Container</option>
                                                    <option value="Flatbed Trailer">Flatbed Trailer</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                            <div className="lg:col-span-4 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                    {loadType === 'PTL' ? 'Origin Pincode' : 'Origin'}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={loadType === 'PTL' ? 'Enter Origin Pincode' : 'City or Location'}
                                                    value={origin} onFocus={() => setActiveInput('origin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    onChange={(e) => setOrigin(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                             {loadType !== 'PTL' && renderSuggestions('origin')}
                                         </div>

                                            <div className="lg:col-span-1 flex justify-center pb-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSwap}
                                                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-3 rounded-full transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                                    title="Swap"
                                                >
                                                    <ArrowLeftRight size={14} className="text-[#0066FF]" />
                                                </button>
                                            </div>

                                            <div className="lg:col-span-4 space-y-1.5 relative">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                    {loadType === 'PTL' ? 'Destination Pincode' : 'Destination'}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={loadType === 'PTL' ? 'Enter Destination Pincode' : 'City or Location'}
                                                    value={destination} onFocus={() => setActiveInput('destination')} onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                    onChange={(e) => setDestination(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                    required
                                                />
                                             {loadType !== 'PTL' && renderSuggestions('destination')}
                                         </div>

                                            <div className="lg:col-span-2 space-y-1.5">
                                                <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all shadow-sm cursor-pointer"
                                                    required
                                                />
                                            </div>

                                            <div className="lg:col-span-1">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ==================== WAREHOUSE ==================== */}
                                {activeTab === 'warehouse' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap justify-between items-center gap-4 w-full border-b border-slate-100 pb-4 mb-4">
                                            <div className="flex-1 min-w-[150px]">
                                                <select
                                                    value={warehouseCountry}
                                                    onChange={(e) => {
                                                        setWarehouseCountry(e.target.value);
                                                        setWarehouseState('');
                                                        setWarehouseCity('');
                                                    }}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                >
                                                    <option value="">Country</option>
                                                    {[...new Set(warehouseLocationsData.map(loc => loc.country))].filter(Boolean).map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 min-w-[150px]">
                                                <select
                                                    value={warehouseState}
                                                    onChange={(e) => {
                                                        setWarehouseState(e.target.value);
                                                        setWarehouseCity('');
                                                    }}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                    disabled={!warehouseCountry}
                                                >
                                                    <option value="">State</option>
                                                    {[...new Set(warehouseLocationsData.filter(loc => loc.country === warehouseCountry).map(loc => loc.state))].filter(Boolean).map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 min-w-[150px]">
                                                <select
                                                    value={warehouseCity}
                                                    onChange={(e) => setWarehouseCity(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                    disabled={!warehouseState}
                                                >
                                                    <option value="">City</option>
                                                    {[...new Set(warehouseLocationsData.filter(loc => loc.state === warehouseState).map(loc => loc.city))].filter(Boolean).map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-[120px]">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-center items-center gap-4 pt-2 pb-4 w-full">
                                            <div className="w-48 relative">
                                                <select
                                                    value={warehouseRateType}
                                                    onChange={(e) => setWarehouseRateType(e.target.value)}
                                                    className="w-full bg-[#0066FF] text-white border border-[#0066FF] rounded-xl px-3 py-3 text-xs font-bold focus:outline-none shadow-sm cursor-pointer"
                                                >
                                                    <option value="Display All Rates" className="bg-white text-slate-900">Display All Rates</option>
                                                    <option value="Per Month" className="bg-white text-slate-900">Per Month</option>
                                                    <option value="Per Day" className="bg-white text-slate-900">Per Day</option>
                                                    <option value="Per Week" className="bg-white text-slate-900">Per Week</option>
                                                </select>
                                            </div>
                                            <div className="w-48">
                                                <select
                                                    value={storageType}
                                                    onChange={(e) => setStorageType(e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                >
                                                    <option value="">Warehouse Type</option>
                                                    <option value="General">General Warehousing</option>
                                                    <option value="Cold">Cold Storage</option>
                                                    <option value="Bonded">Bonded Warehouse</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ==================== CUSTOMS CLEARANCE (CHA) ==================== */}
                                {activeTab === 'cha' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                                        <div className="lg:col-span-3 space-y-1.5">
                                            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Service Type</label>
                                            <select
                                                value={chaType}
                                                onChange={(e) => setChaType(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                required
                                            >
                                                <option value="Air">Air</option>
                                                <option value="Sea">Sea</option>
                                            </select>
                                        </div>

                                        <div className="lg:col-span-4 space-y-1.5 relative">
                                            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">
                                                {chaType === 'Air' ? 'Airport' : 'Port'}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder={chaType === 'Air' ? 'Enter Airport Location' : 'Enter Port Location'}
                                                value={port} onFocus={() => setActiveInput('port')} onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                                                onChange={(e) => setPort(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
                                                required
                                            />
                                             {renderSuggestions('port')}
                                         </div>

                                        <div className="lg:col-span-4 space-y-1.5">
                                            <label className="block text-[11px] font-black text-slate-900 uppercase tracking-wider">Cargo Type</label>
                                            <select
                                                value={chaCargoType}
                                                onChange={(e) => setChaCargoType(e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-3.5 text-xs font-bold !text-slate-900 focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer"
                                                required
                                            >
                                                <option value="Select Type">Select Type</option>
                                                <option value="Customs Clearing">Customs Clearing</option>
                                                <option value="Import Duty">Import Duty Clearance</option>
                                                <option value="Export Documentation">Export Documentation</option>
                                            </select>
                                        </div>

                                        <div className="lg:col-span-1">
                                            <button
                                                type="submit"
                                                className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </form>
                        )}

                        {/* Search Results Display Section */}
                        {searchPerformed && !showSuccessPage && (
                            <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
                                <h3 className="text-sm font-black text-[#0B1E43] uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={16} className="text-[#0066FF]" /> Search Results
                                </h3>

                                {searching ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400 font-bold text-xs">
                                        <Loader2 className="animate-spin text-[#0066FF]" size={24} />
                                        <span>SEARCHING SYSTEM RATES...</span>
                                    </div>
                                ) : searchResults && searchResults.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-xs text-green-700 font-bold">
                                            We found matching vendor rates! Submit an enquiry to connect with the vendor.
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {searchResults.map((rate) => (
                                                <div key={rate._id} className="bg-white border border-slate-200/80 hover:border-[#0066FF]/60 hover:shadow-lg hover:shadow-[#0066FF]/5 rounded-2xl p-5 transition-all space-y-4 relative overflow-hidden">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Vendor Cargo Carrier</span>
                                                            <h4 className="text-sm font-black text-slate-800 mt-0.5">{rate.vendor?.company || rate.vendor?.name}</h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shipment Type</span>
                                                            <div className="text-xs font-extrabold text-[#0066FF] uppercase mt-0.5">{rate.type}</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 text-slate-500 font-semibold">
                                                        {rate.type === 'air' && (
                                                            <>
                                                                <div>Airline: <strong className="text-slate-800">{rate.airline || 'Any'}</strong></div>
                                                                <div>Weight Class: <strong className="text-slate-800">{rate.weightRange}</strong></div>
                                                                <div>Category: <strong className="text-slate-800">{rate.category}</strong></div>
                                                            </>
                                                        )}
                                                        {rate.type === 'land' && (
                                                            <>
                                                                <div>Truck: <strong className="text-slate-800">{rate.vehicleType}</strong></div>
                                                                <div>Load: <strong className="text-slate-800">{rate.truckLoad}</strong></div>
                                                            </>
                                                        )}
                                                        <div>Speed: <strong className="text-slate-800">{rate.deliverySpeed} Days</strong></div>
                                                        {rate.handlingType && <div>Handling: <strong className="text-slate-800">{rate.handlingType}</strong></div>}
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2">
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Standard Rate</span>
                                                            <span className="text-lg font-black text-[#0066FF]">₹ {rate.price.toLocaleString()}</span>
                                                        </div>
                                                        {enquiryStatus === 'success' ? (
                                                            <div className="text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                                                Enquiry Sent
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleCreateEnquiry(rate)}
                                                                disabled={enquiryStatus === 'submitting'}
                                                                className="bg-[#0066FF] hover:bg-[#0052cc] disabled:bg-slate-200 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                                            >
                                                                {enquiryStatus === 'submitting' ? 'Submitting...' : 'Submit Enquiry'} <ArrowRight size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* No direct rates found loading state or custom message placeholder (since logged in automatically submits, this only shows briefly) */
                                    <div className="text-center py-6 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                        Processing Direct Enquiry...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trust Indicators Strip */}
                        <div className="flex flex-wrap justify-between items-center mt-6 pt-6 border-t border-slate-100 gap-4">
                            {[
                                'Real-time Rates',
                                'Multiple Vendors',
                                'Best Price Guarantee',
                                'Secure & Easy'
                            ].map((text) => (
                                <div key={text} className="flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-[#0066FF]" />
                                    <span className="text-[11px] font-black !text-slate-900 tracking-wide">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Get A Quote / Guest Details Modal */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-100 overflow-hidden flex flex-col">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-base font-black text-[#0B1E43] tracking-tight">Get A Quote</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Please provide your contact information to proceed</p>
                            </div>
                            <button
                                onClick={() => { setIsQuoteModalOpen(false); resetGuestForm(); }}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body / Form */}
                        <form onSubmit={handleGuestQuoteSubmit} className="p-6 space-y-4">
                            
                            {/* Organization Name */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                    <Building size={11} className="text-slate-400" /> Organization Name/Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter Your Organization Name/Name"
                                    value={guestCompany}
                                    onChange={(e) => {
                                        setGuestCompany(e.target.value);
                                        setGuestName(e.target.value); // Sync name/company for simpler storage
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                                    required
                                />
                            </div>

                            {/* Commodity Details */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                    <FileText size={11} className="text-slate-400" /> Commodity
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter commodity details here..."
                                    value={guestCommodity}
                                    onChange={(e) => setGuestCommodity(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                                    required
                                />
                            </div>

                            {/* Mobile Code & Number */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                    <Phone size={11} className="text-slate-400" /> Mobile
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={guestPhoneCode}
                                        onChange={(e) => setGuestPhoneCode(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] cursor-pointer"
                                    >
                                        {COUNTRY_CODES.map((item) => (
                                            <option key={item.code} value={item.code}>
                                                {item.country} ({item.code})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={guestPhone}
                                        onChange={(e) => setGuestPhone(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                                    <Mail size={11} className="text-slate-400" /> Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter Your Email"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                                    required
                                />
                            </div>

                            {/* Info text */}
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed pt-2">
                                By submitting, you allow our verified vendors to contact you with freight quotes.
                            </p>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={enquiryStatus === 'submitting'}
                                    className="w-full bg-[#0066FF] hover:bg-[#0052cc] disabled:bg-slate-200 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-[#0066FF]/10"
                                >
                                    {enquiryStatus === 'submitting' ? 'Submitting Details...' : 'Submit Details & Request Quote'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SearchPrice;
