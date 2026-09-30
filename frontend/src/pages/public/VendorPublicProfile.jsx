import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    MapPin, Building2, ShieldCheck, Mail, Phone, Globe, Calendar, User,
    MessageSquare, Send, X, Lock, CheckCircle2, Star, Share2, Info, AlertTriangle, AlertCircle, Crown,
    Briefcase, Users, Globe2, Network, Clock, Timer, Check, Ship, Plane, Truck, Warehouse, Package, 
    Bookmark, Flag, HelpCircle, FileText, Facebook, Twitter, Linkedin, Instagram, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useSEO from '../../hooks/useSEO';
import ReactCountryFlag from "react-country-flag";
import { useLocations } from '../../services/LocationService';

const VendorPublicProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Data States
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fingerprint, setFingerprint] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    const [activeTab, setActiveTab] = useState('about'); // for future proofing

    // Modal States
    const [showContactModal, setShowContactModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showServicesModal, setShowServicesModal] = useState(false);
    const [showIndustriesModal, setShowIndustriesModal] = useState(false);
    const [showCountriesModal, setShowCountriesModal] = useState(false);
    const [showPortsModal, setShowPortsModal] = useState(false);
    const [showFaqsModal, setShowFaqsModal] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [submittingContact, setSubmittingContact] = useState(false);
    const [contactSuccess, setContactSuccess] = useState('');
    
    // Action States (Save, Share, Report)
    const [isSaved, setIsSaved] = useState(false);
    const [shareText, setShareText] = useState('Share');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const handleSave = () => setIsSaved(!isSaved);
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShareText('Copied!');
        setTimeout(() => setShareText('Share'), 2000);
    };

    // Quick Inquiry Form State
    const { getSuggestions } = useLocations();
    const [suggestions, setSuggestions] = useState([]);
    const [activeInput, setActiveInput] = useState(null);
    const [inqForm, setInqForm] = useState({
        name: '', company: '', email: '', phone: '', origin: '', destination: '', serviceType: 'sea', message: ''
    });

    const fetchSuggestions = async (query, inputType) => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            let typeParam = '';
            if (inqForm.serviceType === 'sea') typeParam = 'Seaport';
            else if (inqForm.serviceType === 'air') typeParam = 'Airport';
            else if (inqForm.serviceType === 'land') typeParam = 'Land Port';
            else if (inqForm.serviceType === 'warehouse') typeParam = 'Warehouse';
            else typeParam = 'Seaport,Airport,Land Port'; // CHA generic

            const locations = await getSuggestions(query, typeParam);
            setSuggestions(locations || []);
        } catch (err) {
            console.error(err);
            setSuggestions([]);
        }
    };

    useEffect(() => {
        let activeQuery = '';
        if (activeInput === 'origin') activeQuery = inqForm.origin;
        else if (activeInput === 'destination') activeQuery = inqForm.destination;

        if (!activeQuery || activeQuery.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            fetchSuggestions(activeQuery, activeInput);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [inqForm.origin, inqForm.destination, activeInput, inqForm.serviceType]);

    const handleSelectSuggestion = (loc, inputType) => {
        const value = loc.code ? `${loc.city} (${loc.code})` : loc.city;
        setInqForm({ ...inqForm, [inputType]: value });
        setSuggestions([]);
        setActiveInput(null);
    };

    const renderSuggestions = (inputType) => {
        if (activeInput !== inputType || suggestions.length === 0) return null;
        return (
            <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto w-full">
                {suggestions.map((loc) => (
                    <div
                        key={loc._id}
                        onMouseDown={() => handleSelectSuggestion(loc, inputType)}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-left transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-black text-slate-900 truncate">
                                {loc.city}, {loc.country}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold truncate">
                                {loc.name}
                            </span>
                        </div>
                        {loc.code && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="bg-[#0066FF]/10 text-[#0066FF] text-[9px] font-black px-1.5 py-0.5 rounded uppercase border border-[#0066FF]/20">
                                    {loc.code}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Generate Fingerprint
    useEffect(() => {
        const fp = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset()
        ].join('||');
        let hash = 0;
        for (let i = 0; i < fp.length; i++) {
            hash = (hash * 31 + fp.charCodeAt(i)) & 0xFFFFFFFF;
        }
        setFingerprint(Math.abs(hash).toString(16));
    }, []);

    // Fetch Details when fingerprint is ready
    useEffect(() => {
        if (!fingerprint) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('userToken');
                const headers = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const isDirectVisit = !location.state?.fromSearch;

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/public-vendors-search/${id}/details`,
                    {
                        params: { fingerprint, directVisit: isDirectVisit },
                        headers
                    }
                );
                setVendor(data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403) {
                    setIsBlocked(true);
                } else {
                    setError(err.response?.data?.message || 'Failed to load vendor details.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, fingerprint]);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setSubmittingContact(true);
        setContactSuccess('');
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/vendor-contact`, {
                vendorId: vendor._id,
                name: contactName || inqForm.name,
                email: contactEmail || inqForm.email,
                message: contactMessage || inqForm.message
            });
            setContactSuccess('Your message has been sent successfully to the vendor!');
            setContactName(''); setContactEmail(''); setContactMessage('');
            setTimeout(() => {
                setShowContactModal(false);
                setContactSuccess('');
            }, 3000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to send message.');
        } finally {
            setSubmittingContact(false);
        }
    };

    const handleQuickInquirySubmit = async (e) => {
        e.preventDefault();
        setSubmittingContact(true);
        setContactSuccess('');
        try {
            const token = localStorage.getItem('userToken');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            
            const payload = {
                vendor: vendor._id,
                isDirect: false,
                fromLocation: inqForm.origin || 'India',
                toLocation: inqForm.destination || (inqForm.serviceType === 'warehouse' ? 'Warehouse' : 'Destination'),
                type: inqForm.serviceType === 'sea' ? 'Sea' : (inqForm.serviceType === 'air' ? 'Air' : (inqForm.serviceType === 'land' ? 'Land' : (inqForm.serviceType === 'warehouse' ? 'Warehouse' : 'CHA'))),
                guestName: inqForm.name,
                guestEmail: inqForm.email,
                guestPhone: inqForm.phone,
                guestCompany: inqForm.company,
                message: inqForm.message + '\n\n- This enquiry is created through vendor profile'
            };

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/enquiries`, payload, config);
            
            setContactSuccess('Your inquiry has been submitted directly to the vendor!');
            setInqForm({name:'', company:'', email:'', phone:'', origin:'', destination:'', cargoType:'', message:''});
            setTimeout(() => setContactSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to send inquiry.');
        } finally {
            setSubmittingContact(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-bold">Loading Vendor Profile...</p>
                </div>
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-28 pb-16 px-4">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0B1E43] mb-3">Profile Access Blocked</h3>
                    <p className="text-slate-600 font-bold text-sm mb-8 leading-relaxed">
                        You have already viewed details of one vendor. To view details of all logistics partners, please register and get approved as a vendor.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link to="/vendor-auth" className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-[#0066FF]/20 transition-all text-center text-sm">
                            Register as a Vendor
                        </Link>
                        <Link to="/vendor-auth" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-center text-sm">
                            Log In
                        </Link>
                        <button onClick={() => navigate('/vendor-network')} className="text-slate-400 hover:text-slate-600 text-xs font-bold mt-2">
                            Back to Vendor Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-28">
                <div className="text-center p-8 bg-white rounded-3xl shadow-md max-w-md border border-slate-100">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Error Loading Profile</h3>
                    <p className="text-slate-500 font-medium mb-6">{error || 'Vendor not found.'}</p>
                    <button onClick={() => navigate('/vendor-network')} className="bg-[#0066FF] text-white font-bold px-6 py-2.5 rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isVendorProfileLite = vendor.activePlan?.name && vendor.activePlan.name.toLowerCase() === 'vendor lite';
    const isVerified = vendor.isVerified && !isVendorProfileLite;

    const renderContactDetail = (value, isName = false) => {
        if (!value) return 'N/A';
        if (user?.role === 'admin' || user?._id === vendor?._id) return value;
        if (user?.role === 'vendor' || user?.role === 'vendor-sub') {
            const isVendorLite = user?.activePlan?.name && user.activePlan.name.toLowerCase() === 'vendor lite';
            if (user?.activePlan && user.activePlan.price > 0 && !isVendorLite) {
                if (isName) return value.charAt(0) + '***';
                return value;
            }
            return <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Please upgrade your plan to see these details</span>;
        }
        return <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">This is only for vendors</span>;
    };

    const vendorName = vendor?.organizationName || 'Vendor';
    const country = vendor?.country || 'India';
    const vendorCoverImage = vendor?.profilePhoto ? (vendor.profilePhoto.startsWith('http') ? vendor.profilePhoto : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${vendor.profilePhoto}`) : 'https://www.logisticsscanner.com/default-vendor-image.jpg';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://www.logisticsscanner.com/vendor-network/profile/${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const metaDesc = `${vendorName} is a verified freight forwarding and logistics company in ${country} offering Sea Freight, Air Freight, Warehousing, Customs Clearance, Land Transport and global logistics solutions. Compare freight rates and connect directly through Logistics Scanner.`;

    return (
        <div className="bg-[#F8FAFC] min-h-screen pt-28 pb-16 font-sans text-slate-800">
            {/* Dynamic SEO Tags (React 19+) */}
            <title>{`${vendorName} | Verified Freight Forwarder in ${country} | Logistics Scanner`}</title>
            <meta name="description" content={metaDesc} />
            <meta name="keywords" content={`${vendorName}, ${vendorName} Logistics, Freight Forwarder ${country}, Shipping Company ${country}, Sea Freight ${country}, Air Freight ${country}, Warehouse ${country}, CHA ${country}, Import Export Logistics, Freight Rates, Global Logistics, Container Shipping, International Freight, Logistics Scanner`} />
            <meta name="author" content="Logistics Scanner" />
            <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
            <link rel="canonical" href={currentUrl} />
            <meta name="theme-color" content="#0F6CBD" />
            
            {/* Open Graph Tags */}
            <meta property="og:type" content="profile" />
            <meta property="og:title" content={`${vendorName} | Freight Forwarder in ${country}`} />
            <meta property="og:description" content={metaDesc} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={vendorCoverImage} />
            <meta property="og:image:alt" content={vendorName} />
            <meta property="og:site_name" content="Logistics Scanner" />
            <meta property="og:locale" content="en_US" />
            
            {/* Twitter Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`${vendorName} | Logistics Scanner`} />
            <meta name="twitter:description" content={metaDesc} />
            <meta name="twitter:image" content={vendorCoverImage} />
            
            {/* Alternate URL */}
            <link rel="alternate" hreflang="en" href={currentUrl} />
            
            {/* Schema.org JSON-LD */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": ["Organization", "LocalBusiness"],
                    "name": vendorName,
                    "image": vendorCoverImage,
                    "description": metaDesc,
                    "url": currentUrl,
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": country
                    }
                })}
            </script>

            {/* Breadcrumbs */}
            <div className="w-full px-6 lg:px-12 mx-auto max-w-[1400px] mb-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Link to="/" className="hover:text-[#0066FF] shrink-0">Home</Link>
                    <span className="shrink-0">/</span>
                    <Link to="/vendor-network" className="hover:text-[#0066FF] shrink-0">Vendor Network</Link>
                    <span className="shrink-0">/</span>
                    <span className="text-slate-600 shrink-0">{country} Freight Forwarders</span>
                    <span className="shrink-0">/</span>
                    <span className="text-[#0066FF] truncate max-w-[200px] sm:max-w-xs">{vendorName}</span>
                </div>
            </div>

            <div className="w-full px-6 lg:px-12 mx-auto max-w-[1400px]">

                {/* Main Header Banner */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 mb-4 relative flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                    {/* Left side: Logo & Title */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1 min-w-0">
                        <div className="w-28 h-28 bg-slate-50 text-[#0066FF] rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm p-4">
                            {vendor.profilePhoto ? (
                                <img
                                    src={vendor.profilePhoto.startsWith('http') ? vendor.profilePhoto : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${vendor.profilePhoto}`}
                                    alt={`${vendorName} Freight Forwarder ${country}`}
                                    title={`${vendorName} Logistics Company`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div className={`w-full h-full flex flex-col items-center justify-center ${vendor.profilePhoto ? 'hidden' : 'flex'}`}>
                                <Globe size={32} className="opacity-80 mb-1" />
                            </div>
                        </div>
                        <div className="pt-2 flex-1 min-w-0">
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-[#0B1E43] tracking-tight break-words">{vendor.organizationName}</h1>
                                {isVerified ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <CheckCircle2 size={12} /> VERIFIED
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-500 border border-red-100">
                                        <X size={12} /> NOT VERIFIED
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs font-bold text-slate-500 mb-3">
                                <span>LSID: LS-{vendor.lsid}</span>
                                <span className="flex items-center gap-1 text-[#0066FF]"><MapPin size={14} /> {vendor.country || 'India'}</span>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> STATUS: APPROVED
                                </span>
                                {vendor.gst && (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        GST: {vendor.gst}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Right side: Actions */}
                    <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                        <div className="flex gap-3 w-full md:w-auto">
                            <button onClick={() => setShowContactModal(true)} className="flex-1 md:flex-none bg-[#0066FF] hover:bg-[#0B1E43] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <MessageSquare size={16} /> Contact Vendor
                            </button>
                            <button onClick={() => setShowContactModal(true)} className="flex-1 md:flex-none bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Send size={16} /> Send Inquiry
                            </button>
                        </div>
                        <div className="flex items-center gap-6 text-slate-400 text-xs font-bold w-full md:w-auto justify-center md:justify-end px-2">
                            <button onClick={handleSave} className={`flex items-center gap-1.5 transition-colors ${isSaved ? 'text-[#0066FF]' : 'hover:text-[#0066FF]'}`}>
                                <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors">
                                <Share2 size={14} /> {shareText}
                            </button>
                            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                                <AlertCircle size={14} /> Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <Calendar size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Established</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.yearOfEstablishment || (vendor.dateOfIncorporation ? new Date(vendor.dateOfIncorporation).getFullYear() : '2015')}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <Users size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Employees</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.employeesCount || '50-100'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <Globe2 size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Countries Served</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.countriesServed?.length > 0 ? vendor.countriesServed.length + '+' : '25+'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <Building2 size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Branches</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.branchesCount || '5+'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <CheckCircle2 size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">On-Time Delivery</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.onTimeDelivery || '98%'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center pt-4 md:pt-0">
                            <Clock size={20} className="text-[#0066FF] mb-2" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Response Time</span>
                            <span className="text-sm font-black text-[#0B1E43]">{vendor.responseTime || '< 2 Hrs'}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Detailed Info */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* About Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <User size={20} />
                                </div>
                                <h2 className="text-lg font-black text-[#0B1E43]">About {vendor.organizationName}</h2>
                            </div>
                            <div className="relative">
                                <div 
                                    className="text-sm text-slate-600 leading-relaxed font-medium break-words mb-0 line-clamp-5 overflow-hidden prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2"
                                    dangerouslySetInnerHTML={{ __html: vendor.companyProfile || `${vendor.organizationName} is a trusted logistics and freight forwarding company based in ${vendor.country || 'India'}, offering comprehensive solutions in sea freight, air freight, land transportation, warehousing, and customs clearance. With a strong global network and experienced team, we deliver cost-effective, reliable and efficient logistics services tailored to your business needs.` }}
                                />
                                {((vendor.companyProfile || '').length > 300 || !vendor.companyProfile) && (
                                    <button onClick={() => setShowAboutModal(true)} className="mt-4 text-xs font-bold text-[#0066FF] border border-[#0066FF] rounded-lg px-4 py-2 hover:bg-[#0066FF] hover:text-white transition-colors">
                                        View More
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Services Offered */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                        <Briefcase size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-[#0B1E43]">Freight & Logistics Services</h2>
                                </div>
                                {((vendor.services?.length > 0 ? vendor.services : ['Sea Freight', 'Air Freight', 'Road Freight', 'Warehousing', 'Customs Clearance', 'Project Cargo', 'Door to Door', 'Supply Chain']).length > 8) && (
                                    <button onClick={() => setShowServicesModal(true)} className="text-xs font-bold text-[#0066FF] hover:underline">View All Services →</button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Default services if none provided */}
                                {(vendor.services?.length > 0 ? vendor.services : ['Sea Freight', 'Air Freight', 'Road Freight', 'Warehousing', 'Customs Clearance', 'Project Cargo', 'Door to Door', 'Supply Chain']).slice(0, 8).map((srv, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[#0066FF]/40 transition-all cursor-pointer">
                                        <div className="w-8 h-8 bg-blue-50/50 rounded-full flex items-center justify-center text-[#0066FF] mb-2">
                                            {srv.toLowerCase().includes('sea') ? <Ship size={16} /> : 
                                             srv.toLowerCase().includes('air') ? <Plane size={16} /> : 
                                             srv.toLowerCase().includes('road') ? <Truck size={16} /> : 
                                             srv.toLowerCase().includes('ware') ? <Warehouse size={16} /> : 
                                             <Package size={16} />}
                                        </div>
                                        <h3 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{srv}</h3>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{srv} solutions</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Industries Served */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                        <Building2 size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-[#0B1E43]">Industries Served</h2>
                                </div>
                                {((vendor.industriesServed?.length > 0 ? vendor.industriesServed : ['Automotive', 'Electronics', 'Pharmaceutical', 'Retail', 'Chemicals', 'Engineering', 'Textiles', 'Food & Beverages']).length > 5) && (
                                    <button onClick={() => setShowIndustriesModal(true)} className="text-xs font-bold text-[#0066FF] hover:underline">View All Industries →</button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3 h-[52px] overflow-hidden p-1 -m-1">
                                {(vendor.industriesServed?.length > 0 ? vendor.industriesServed : ['Automotive', 'Electronics', 'Pharmaceutical', 'Retail', 'Chemicals', 'Engineering', 'Textiles', 'Food & Beverages']).slice(0, 8).map((ind, i) => (
                                    <div key={i} className="px-5 py-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl hover:from-[#0066FF] hover:to-blue-700 transition-all cursor-pointer shadow-sm hover:shadow-md group whitespace-nowrap">
                                        <span className="text-xs font-black text-[#0B1E43] group-hover:text-white transition-colors">{ind}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Countries Served */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                        <Globe size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-[#0B1E43]">Countries Served</h2>
                                </div>
                                {((vendor.countriesServed?.length > 0 ? vendor.countriesServed : [{code:'IN', name:'India'}]).length > 8) && (
                                    <button onClick={() => setShowCountriesModal(true)} className="text-xs font-bold text-[#0066FF] hover:underline">View All Countries →</button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-6 h-[80px] overflow-hidden p-1 -m-1">
                                {(vendor.countriesServed?.length > 0 ? vendor.countriesServed.map(c => ({code: c.substring(0,2).toUpperCase(), name: c})) : [ {code: 'IN', name: 'India'}, {code: 'CN', name: 'China'}, {code: 'US', name: 'USA'}, {code: 'CA', name: 'Canada'}, {code: 'AE', name: 'UAE'}, {code: 'SG', name: 'Singapore'}, {code: 'AU', name: 'Australia'}, {code: 'DE', name: 'Germany'} ]).slice(0, 8).map((c, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-14 h-10 overflow-hidden rounded shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
                                            <ReactCountryFlag countryCode={c.code} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ports Covered */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                        <MapPin size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-[#0B1E43]">Ports Covered</h2>
                                </div>
                                {((vendor.portsCovered?.length > 0 ? vendor.portsCovered : ['Nhava Sheva', 'Mundra', 'Chennai', 'Kolkata', 'Vancouver', 'Montreal', 'Prince Rupert', 'Singapore']).length > 8) && (
                                    <button onClick={() => setShowPortsModal(true)} className="text-xs font-bold text-[#0066FF] hover:underline">View All Ports →</button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-8 h-[96px] overflow-hidden p-2 -m-2">
                                {(vendor.portsCovered?.length > 0 ? vendor.portsCovered : ['Nhava Sheva', 'Mundra', 'Chennai', 'Kolkata', 'Vancouver', 'Montreal', 'Prince Rupert', 'Singapore']).slice(0, 8).map((p, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E43] group-hover:from-[#0066FF] group-hover:to-blue-700 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg">
                                            <Ship size={24} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700 whitespace-nowrap">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why Choose Us */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <ShieldCheck size={20} />
                                </div>
                                <h2 className="text-lg font-black text-[#0B1E43]">Why Choose {vendor.organizationName}?</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                {(vendor.whyChooseUs?.length > 0 ? vendor.whyChooseUs : [
                                    'Experienced & Professional Team', 'Fast Response & 24/7 Support',
                                    'Global Network & Strong Partnerships', 'On-Time Delivery & Reliable Service',
                                    'Competitive Rates & Cost Effective', 'Customer Satisfaction Guaranteed'
                                ]).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>






                    </div>

                    {/* RIGHT COLUMN: Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Quick Inquiry Form */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#0B1E43] to-[#0066FF] text-white p-5 flex items-center gap-3">
                                <Send size={20} />
                                <h3 className="font-black text-base tracking-wide">Quick Inquiry</h3>
                            </div>
                            <form onSubmit={handleQuickInquirySubmit} className="p-5 space-y-2.5">
                                <div className="grid grid-cols-5 gap-2 mb-1 p-1 bg-slate-100 rounded-xl">
                                    {[{id:'sea', icon:<Ship size={14}/>}, {id:'air', icon:<Plane size={14}/>}, {id:'land', icon:<Truck size={14}/>}, {id:'warehouse', icon:<Warehouse size={14}/>}, {id:'cha', icon:<ClipboardList size={14}/>}].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setInqForm({...inqForm, serviceType: type.id, origin: '', destination: ''})}
                                            className={`flex justify-center items-center py-2 rounded-lg transition-all ${inqForm.serviceType === type.id ? 'bg-white text-[#0066FF] shadow-sm font-black' : 'text-slate-500 hover:text-slate-700'}`}
                                            title={type.id.toUpperCase()}
                                        >
                                            {type.icon}
                                        </button>
                                    ))}
                                </div>
                                
                                <input type="text" placeholder="Full Name*" required value={inqForm.name} onChange={e=>setInqForm({...inqForm, name: e.target.value})} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                <input type="text" placeholder="Company Name*" required value={inqForm.company} onChange={e=>setInqForm({...inqForm, company: e.target.value})} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                <input type="email" placeholder="Email Address*" required value={inqForm.email} onChange={e=>setInqForm({...inqForm, email: e.target.value})} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                <input type="text" placeholder="Phone Number*" required value={inqForm.phone} onChange={e=>setInqForm({...inqForm, phone: e.target.value})} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                
                                <div className="relative">
                                    <input type="text" placeholder="From (Origin)*" required value={inqForm.origin} onChange={e=>setInqForm({...inqForm, origin: e.target.value})} onFocus={() => setActiveInput('origin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                    {renderSuggestions('origin')}
                                </div>
                                
                                {inqForm.serviceType !== 'warehouse' && (
                                <div className="relative">
                                    <input type="text" placeholder="To (Destination)*" required value={inqForm.destination} onChange={e=>setInqForm({...inqForm, destination: e.target.value})} onFocus={() => setActiveInput('destination')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]" />
                                    {renderSuggestions('destination')}
                                </div>
                                )}
                                
                                <textarea rows="2" placeholder="Message - Please describe your requirement..." required value={inqForm.message} onChange={e=>setInqForm({...inqForm, message: e.target.value})} className="w-full text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] resize-none"></textarea>
                                
                                <button type="submit" disabled={submittingContact} className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white text-sm font-black uppercase tracking-wider py-3 rounded-xl shadow-lg transition-all mt-2">
                                    {submittingContact ? 'Sending...' : 'Send Inquiry'}
                                </button>
                                {contactSuccess && <p className="text-xs text-emerald-600 font-bold text-center">{contactSuccess}</p>}
                            </form>
                        </div>

                        {/* Business Details Sidebar */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center">
                                    <Building2 size={20} />
                                </div>
                                <h2 className="font-black text-lg text-[#0B1E43]">Business Overview</h2>
                            </div>
                            <div className="space-y-5 text-sm">
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Briefcase size={16}/> <span>Business Type</span></div>
                                    <span className="font-bold text-slate-800 text-right truncate">{vendor.businessType || 'Freight Forwarder'}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Calendar size={16}/> <span>Established</span></div>
                                    <span className="font-bold text-slate-800 text-right whitespace-nowrap">{vendor.yearOfEstablishment || (vendor.dateOfIncorporation ? new Date(vendor.dateOfIncorporation).getFullYear() : '2015')}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><MapPin size={16}/> <span>Head Office</span></div>
                                    <span className="font-bold text-slate-800 text-right truncate">{vendor.headOffice || `${vendor.city || 'Mumbai'}, ${vendor.country || 'India'}`}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Globe size={16}/> <span>Website</span></div>
                                    <span className="font-bold text-[#0066FF] hover:underline text-right truncate cursor-pointer">{renderContactDetail(vendor.website || vendor.companyWebsite || 'NA')}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Mail size={16}/> <span>Email</span></div>
                                    <span className="font-bold text-[#0066FF] hover:underline text-right truncate cursor-pointer">{renderContactDetail(vendor.email)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Phone size={16}/> <span>Phone</span></div>
                                    <span className="font-bold text-slate-800 text-right whitespace-nowrap">{renderContactDetail(vendor.phone)}</span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-2 text-slate-500 shrink-0"><Clock size={16}/> <span>Working Hours</span></div>
                                    <span className="font-bold text-slate-800 text-right whitespace-nowrap">{vendor.workingHours ? vendor.workingHours.replace(/\n/g, ' ') : 'Mon - Sat (9:00 AM - 6:00 PM)'}</span>
                                </div>
                            </div>
                            
                            {/* Social Icons */}
                            <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-slate-100">
                                <a href={vendor.socialLinks?.linkedin || '#'} className="w-8 h-8 rounded-full bg-[#0077b5] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Linkedin size={14} /></a>
                                <a href={vendor.socialLinks?.facebook || '#'} className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Facebook size={14} /></a>
                                <a href={vendor.socialLinks?.twitter || '#'} className="w-8 h-8 rounded-full bg-[#1DA1F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Twitter size={14} /></a>
                                <a href={vendor.socialLinks?.instagram || '#'} className="w-8 h-8 rounded-full bg-[#E4405F] text-white flex items-center justify-center hover:opacity-80 transition-opacity"><Instagram size={14} /></a>
                            </div>
                        </div>

                        {/* Overall Rating Sidebar Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
                            <h4 className="font-black text-sm text-[#0B1E43] mb-4">Overall Rating</h4>
                            <div className="text-4xl font-black text-slate-800 mb-2">5.0</div>
                            <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
                                <Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 block mb-6">(12 Reviews)</span>
                            <button className="w-full text-xs font-bold text-[#0066FF] border border-[#0066FF]/20 bg-blue-50/50 hover:bg-[#0066FF] hover:text-white py-2.5 rounded-lg transition-colors">
                                View All Reviews
                            </button>
                        </div>
                        
                    </div>
                </div>

                {/* Split Section: Reviews & FAQs (Moved outside for full width) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Reviews */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-50 text-[#0066FF] rounded-[6px]">
                                    <MessageSquare size={18} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-[17px] font-black text-[#0B1E43]">Business Highlights & Reviews</h2>
                            </div>
                            <Link to="#" className="text-[10px] font-bold text-[#0066FF] hover:underline">View All Reviews →</Link>
                        </div>
                        <div className="flex-1 flex flex-col">
                            {[
                                {name:'Sharma Corp', date:'15 Apr 2025', text:'Excellent service and very cooperative team. Our shipments always reach on time.'},
                                {name:'Global Impex', date:'10 Apr 2025', text:'Very professional and reliable logistics partner. Highly recommended!'},
                                {name:'Oceanic Exports', date:'05 Apr 2025', text:'Great communication and smooth customs clearance. Will work again.'}
                            ].map((rev, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-center border-b border-slate-100 last:border-0 py-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://ui-avatars.com/api/?name=${rev.name}&background=random`} alt={rev.name} className="w-6 h-6 rounded-full object-cover" />
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-[#0B1E43]">{rev.name}</span>
                                                <div className="flex text-orange-400">
                                                    <Star size={10} fill="currentColor" className="text-orange-400" /><Star size={10} fill="currentColor" className="text-orange-400" /><Star size={10} fill="currentColor" className="text-orange-400" /><Star size={10} fill="currentColor" className="text-orange-400" /><Star size={10} fill="currentColor" className="text-orange-400" />
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold">{rev.date}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{rev.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* FAQs */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col h-full">
                        {(() => {
                            const faqsList = vendor.faqs?.length > 0 ? vendor.faqs : [
                                {question: `What services does ${vendorName} offer?`, answer: `We offer end-to-end logistics solutions including sea freight, air freight, customs clearance, and warehousing.`},
                                {question: `Which countries does ${vendorName} serve?`, answer: `We have a strong global network covering Asia, Europe, North America, and the Middle East.`},
                                {question: `Do you provide door-to-door delivery?`, answer: `Yes, we provide seamless door-to-door delivery for both commercial and residential shipments.`},
                                {question: `Can you handle project cargo & ODC shipments?`, answer: `Absolutely. We have specialized teams and equipment for oversized and project cargo.`},
                                {question: `Do you provide customs clearance services?`, answer: `Yes, our in-house customs brokers ensure smooth and compliant clearance at all major ports.`}
                            ];
                            const displayFaqs = faqsList.slice(0, 5);
                            const hasMoreFaqs = faqsList.length > 5;

                            return (
                                <>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-blue-50 text-[#0066FF] rounded-[6px]">
                                                <CheckCircle2 size={18} strokeWidth={2.5} />
                                            </div>
                                            <h2 className="text-[17px] font-black text-[#0B1E43]">Frequently Asked Questions</h2>
                                        </div>
                                        {hasMoreFaqs ? (
                                            <button onClick={() => setShowFaqsModal(true)} className="text-[10px] font-bold text-[#0066FF] hover:underline">View All FAQs →</button>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[350px] pr-2 scrollbar-thin">
                                        {displayFaqs.map((q, i) => (
                                            <div key={i} className="flex flex-col border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all rounded-lg overflow-hidden shrink-0">
                                                <div 
                                                    className="flex items-center justify-between cursor-pointer py-3 px-2"
                                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                                >
                                                    <span className={`text-xs font-bold transition-colors ${openFaq === i ? 'text-[#0066FF]' : 'text-[#0B1E43]'}`}>{q.question}</span>
                                                    <span className={`text-slate-500 font-black text-lg transition-transform ${openFaq === i ? 'rotate-45 text-[#0066FF]' : ''}`}>+</span>
                                                </div>
                                                {openFaq === i && (
                                                    <div className="px-2 pb-3 pt-1 text-xs font-medium text-slate-600 animate-fade-in whitespace-pre-line">
                                                        {q.answer || 'Answer not provided by vendor.'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Bottom Related Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex items-center gap-5">
                        <Users size={40} className="text-[#0066FF] shrink-0" strokeWidth={2} />
                        <div className="flex flex-col">
                            <h4 className="text-[15px] font-black text-[#0B1E43]">Related Vendors</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-1 mb-2">Explore other verified logistics partners.</p>
                            <Link to="/vendor-network" className="text-[11px] font-black text-[#0066FF] hover:underline">View All Vendors →</Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex items-center gap-5">
                        <Ship size={40} className="text-[#0066FF] shrink-0" strokeWidth={2} />
                        <div className="flex flex-col">
                            <h4 className="text-[15px] font-black text-[#0B1E43]">Popular Shipping Routes</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-1 mb-2">Explore top shipping routes and rates.</p>
                            <Link to="/vendor-network" className="text-[11px] font-black text-[#0066FF] hover:underline">View All Routes →</Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex items-center gap-5">
                        <FileText size={40} className="text-[#0066FF] shrink-0" strokeWidth={2} />
                        <div className="flex flex-col">
                            <h4 className="text-[15px] font-black text-[#0B1E43]">Helpful Resources</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-1 mb-2">Blogs, guides and logistics insights.</p>
                            <Link to="/vendor-network" className="text-[11px] font-black text-[#0066FF] hover:underline">View All Articles →</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="mt-8 rounded-[24px] overflow-hidden relative flex flex-col md:flex-row items-center justify-between shadow-lg h-[240px]">
                    <div className="absolute inset-0 z-0">
                        <img src="/cta_ship.png" alt={`${vendorName} Freight Forwarder ${country}`} title={`${vendorName} Logistics Company`} className="w-full h-full object-cover object-center" />
                    </div>
                    
                    <div className="relative z-20 p-12 pl-14 flex flex-col justify-center h-full max-w-2xl">
                        <h2 className="text-3xl font-black !text-white mb-2" style={{ color: '#ffffff' }}>Ready to work with {vendor.organizationName || 'ROI GLOBAL'}?</h2>
                        <p className="!text-white text-[13px] font-bold mb-8" style={{ color: '#ffffff' }}>Connect directly with the vendor for quotes, rates and logistics solutions.</p>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowContactModal(true)} className="bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-black tracking-wide px-6 py-3.5 rounded-[10px] transition-colors flex items-center gap-2">
                                <MessageSquare size={16} /> Contact Vendor
                            </button>
                            <button onClick={() => setShowContactModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black tracking-wide px-6 py-3.5 rounded-[10px] transition-colors flex items-center gap-2">
                                <Send size={16} /> Send Inquiry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Report Vendor Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden">
                        <button onClick={() => {setShowReportModal(false); setReportSubmitted(false); setReportReason('');}} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-[#0B1E43] mb-2">Report Vendor</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-6">Report this profile to our trust & safety team</p>
                        
                        {reportSubmitted ? (
                            <div className="p-6 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex flex-col items-center justify-center text-center">
                                <CheckCircle2 size={48} className="mb-3" />
                                <h4 className="font-black text-lg mb-1">Report Submitted</h4>
                                <p className="text-xs font-bold">Our team will investigate this vendor within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); setReportSubmitted(true); }} className="space-y-4">
                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Reason for reporting</label>
                                    <textarea required rows={4} value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Please provide details on why you are reporting this vendor..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-sm font-bold bg-slate-50 resize-none"></textarea>
                                </div>
                                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-black tracking-wide py-3.5 rounded-[10px] transition-colors mt-2">
                                    Submit Report
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Contact Vendor Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden">
                        <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <X size={20} />
                        </button>
                        <h3 className="text-2xl font-black text-[#0B1E43] mb-2">Contact Vendor</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-6">Send your inquiry to {vendor.organizationName}</p>
                        {contactSuccess ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3 font-semibold mb-4 text-sm">
                                <CheckCircle2 size={20} />
                                <span>{contactSuccess}</span>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Your Name</label>
                                    <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Your Email</label>
                                    <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Message</label>
                                    <textarea required rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Write your message here..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50 resize-none"></textarea>
                                </div>
                                <button type="submit" disabled={submittingContact} className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    {submittingContact ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Send size={16} /> Send Inquiry</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* About Modal */}
            {showAboutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <h3 className="text-2xl font-black text-[#0B1E43]">About {vendor.organizationName}</h3>
                            <button onClick={() => setShowAboutModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div 
                                className="text-sm text-slate-600 leading-relaxed font-medium prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2"
                                dangerouslySetInnerHTML={{ __html: vendor.companyProfile || `${vendor.organizationName} is a trusted logistics and freight forwarding company based in ${vendor.country || 'India'}, offering comprehensive solutions in sea freight, air freight, land transportation, warehousing, and customs clearance. With a strong global network and experienced team, we deliver cost-effective, reliable and efficient logistics services tailored to your business needs.` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Services Modal */}
            {showServicesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <Briefcase size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-[#0B1E43]">All Services</h3>
                            </div>
                            <button onClick={() => setShowServicesModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {(vendor.services?.length > 0 ? vendor.services : ['Sea Freight', 'Air Freight', 'Road Freight', 'Warehousing', 'Customs Clearance', 'Project Cargo', 'Door to Door', 'Supply Chain']).map((srv, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-[#0066FF]/40 transition-all">
                                        <div className="w-8 h-8 bg-blue-50/50 rounded-full flex items-center justify-center text-[#0066FF] mb-2">
                                            {srv.toLowerCase().includes('sea') ? <Ship size={16} /> : 
                                             srv.toLowerCase().includes('air') ? <Plane size={16} /> : 
                                             srv.toLowerCase().includes('road') ? <Truck size={16} /> : 
                                             srv.toLowerCase().includes('ware') ? <Warehouse size={16} /> : 
                                             <Package size={16} />}
                                        </div>
                                        <h3 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{srv}</h3>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{srv} solutions</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Industries Modal */}
            {showIndustriesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <Building2 size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-[#0B1E43]">All Industries Served</h3>
                            </div>
                            <button onClick={() => setShowIndustriesModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="flex flex-wrap gap-3">
                                {(vendor.industriesServed?.length > 0 ? vendor.industriesServed : ['Automotive', 'Electronics', 'Pharmaceutical', 'Retail', 'Chemicals', 'Engineering', 'Textiles', 'Food & Beverages']).map((ind, i) => (
                                    <div key={i} className="px-5 py-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl hover:from-[#0066FF] hover:to-blue-700 transition-all cursor-pointer shadow-sm hover:shadow-md group whitespace-nowrap">
                                        <span className="text-xs font-black text-[#0B1E43] group-hover:text-white transition-colors">{ind}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Countries Modal */}
            {showCountriesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <Globe size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-[#0B1E43]">All Countries Served</h3>
                            </div>
                            <button onClick={() => setShowCountriesModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="flex flex-wrap gap-6">
                                {(vendor.countriesServed?.length > 0 ? vendor.countriesServed.map(c => ({code: c.substring(0,2).toUpperCase(), name: c})) : [ {code: 'IN', name: 'India'}, {code: 'CN', name: 'China'}, {code: 'US', name: 'USA'}, {code: 'CA', name: 'Canada'}, {code: 'AE', name: 'UAE'}, {code: 'SG', name: 'Singapore'}, {code: 'AU', name: 'Australia'}, {code: 'DE', name: 'Germany'} ]).map((c, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-14 h-10 overflow-hidden rounded shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
                                            <ReactCountryFlag countryCode={c.code} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ports Modal */}
            {showPortsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-8 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-[#0066FF] rounded-lg">
                                    <MapPin size={20} />
                                </div>
                                <h3 className="text-2xl font-black text-[#0B1E43]">All Ports Covered</h3>
                            </div>
                            <button onClick={() => setShowPortsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2">
                            <div className="flex flex-wrap gap-8 p-2">
                                {(vendor.portsCovered?.length > 0 ? vendor.portsCovered : ['Nhava Sheva', 'Mundra', 'Chennai', 'Kolkata', 'Vancouver', 'Montreal', 'Prince Rupert', 'Singapore']).map((p, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 flex items-center justify-center text-[#0B1E43] group-hover:from-[#0066FF] group-hover:to-blue-700 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg">
                                            <Ship size={24} />
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700 whitespace-nowrap">{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All FAQs Modal */}
            {showFaqsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#0B1E43]">All Frequently Asked Questions</h3>
                                    <p className="text-xs font-bold text-slate-500 mt-1">Get answers to common queries about {vendorName}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowFaqsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 md:p-8">
                            <div className="flex flex-col gap-2">
                                {(vendor.faqs?.length > 0 ? vendor.faqs : [
                                    {question: `What services does ${vendorName} offer?`, answer: `We offer end-to-end logistics solutions including sea freight, air freight, customs clearance, and warehousing.`},
                                    {question: `Which countries does ${vendorName} serve?`, answer: `We have a strong global network covering Asia, Europe, North America, and the Middle East.`},
                                    {question: `Do you provide door-to-door delivery?`, answer: `Yes, we provide seamless door-to-door delivery for both commercial and residential shipments.`},
                                    {question: `Can you handle project cargo & ODC shipments?`, answer: `Absolutely. We have specialized teams and equipment for oversized and project cargo.`},
                                    {question: `Do you provide customs clearance services?`, answer: `Yes, our in-house customs brokers ensure smooth and compliant clearance at all major ports.`}
                                ]).map((q, i) => (
                                    <div key={i} className="flex flex-col border border-slate-100 rounded-xl overflow-hidden mb-2">
                                        <div 
                                            className="flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 transition-colors"
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        >
                                            <span className={`text-sm font-bold transition-colors ${openFaq === i ? 'text-[#0066FF]' : 'text-[#0B1E43]'}`}>{q.question}</span>
                                            <span className={`text-slate-500 font-black text-xl transition-transform ${openFaq === i ? 'rotate-45 text-[#0066FF]' : ''}`}>+</span>
                                        </div>
                                        {openFaq === i && (
                                            <div className="p-4 pt-0 text-sm font-medium text-slate-600 animate-fade-in whitespace-pre-line border-t border-slate-50 bg-slate-50/50">
                                                {q.answer || 'Answer not provided by vendor.'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorPublicProfile;
