import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    MapPin, Building2, ShieldCheck, Mail, Phone, Globe, Calendar, User, 
    MessageSquare, Send, X, Lock, CheckCircle2, Star, Share2, Info, AlertTriangle, AlertCircle, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VendorPublicProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fingerprint, setFingerprint] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);

    // Modal States
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [submittingContact, setSubmittingContact] = useState(false);
    const [contactSuccess, setContactSuccess] = useState('');

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

                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/public-vendors-search/${id}/details`,
                    {
                        params: { fingerprint },
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
                name: contactName,
                email: contactEmail,
                message: contactMessage
            });
            setContactSuccess('Your message has been sent successfully to the vendor!');
            setContactName('');
            setContactEmail('');
            setContactMessage('');
            setTimeout(() => {
                setShowContactModal(false);
                setContactSuccess('');
            }, 3000);
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
                        <Link 
                            to="/vendor-auth" 
                            className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-[#0066FF]/20 transition-all text-center text-sm"
                        >
                            Register as a Vendor
                        </Link>
                        <Link 
                            to="/vendor-auth" 
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-center text-sm"
                        >
                            Log In
                        </Link>
                        <button 
                            onClick={() => navigate('/vendor-network')}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold mt-2"
                        >
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
                    <button 
                        onClick={() => navigate('/vendor-network')}
                        className="bg-[#0066FF] text-white font-bold px-6 py-2.5 rounded-xl"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Determine verification badge
    const isVerified = vendor.isVerified;

    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-16 font-sans text-slate-800">
            {/* Breadcrumbs */}
            <div className="container mx-auto px-6 max-w-6xl mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Link to="/" className="hover:text-[#0066FF]">Home</Link>
                    <span>/</span>
                    <Link to="/vendor-network" className="hover:text-[#0066FF]">Vendors</Link>
                    <span>/</span>
                    <span className="text-slate-600">{vendor.organizationName}</span>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-6xl">
                
                {/* Main Profile Header Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-8 mb-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        {/* Profile Info Left */}
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-[#0066FF]/10 text-[#0066FF] rounded-2xl flex items-center justify-center shrink-0">
                                <Globe size={32} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-black text-[#0B1E43] tracking-tight">
                                        {vendor.organizationName}
                                    </h1>
                                    
                                    {/* Verification Badge */}
                                    {isVerified ? (
                                        <>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm animate-pulse">
                                                <ShieldCheck size={12} />
                                                Verified Vendor
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#0066FF] text-white shadow-sm shadow-[#0066FF]/30 hover:shadow-[#0066FF]/50 transition-shadow">
                                                <Crown size={12} />
                                                PRO
                                            </div>
                                        </>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-200 shadow-sm">
                                            <X size={12} />
                                            Not Verified
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                                        LSID: LS-{vendor.lsid}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">
                                        <MapPin size={12} /> {vendor.country || 'N/A'}
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-wider">
                                    <CheckCircle2 size={14} />
                                    Status: {vendor.verificationStatus || 'Approved'}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Right */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button 
                                onClick={() => setShowContactModal(true)}
                                className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0B1E43] text-white text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl shadow-lg shadow-[#0066FF]/20 transition-all cursor-pointer"
                            >
                                <MessageSquare size={16} />
                                Contact Vendor
                            </button>
                            <button 
                                onClick={() => setShowContactModal(true)}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                                <Send size={16} />
                                Send Inquiry
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Layout: Details vs Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Columns - Detailed Info Cards */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 1. Organization Details */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <h3 className="text-base font-extrabold !text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">
                                1. Organization Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Organization Name</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.organizationName}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Country</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.country || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Created On</span>
                                    <span className="text-slate-800 font-extrabold">
                                        {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Status</span>
                                    <span className="text-slate-800 font-extrabold text-emerald-600">{vendor.verificationStatus || 'Approved'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Alternative Email</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.alternativeEmail || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Alternative Contact</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.alternativeNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Contact Person Details */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <h3 className="text-base font-extrabold !text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">
                                2. Contact Person Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Name</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Email</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.email || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Phone Number</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Company Information */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <h3 className="text-base font-extrabold !text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">
                                3. Company Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Date of Incorporation</span>
                                    <span className="text-slate-800 font-extrabold">
                                        {vendor.dateOfIncorporation ? new Date(vendor.dateOfIncorporation).toLocaleDateString('en-GB') : '0000-00-00'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Company Age</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.companyAge || '0'} Years</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Director's Name</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.directorsNames || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-50 pb-2">
                                    <span className="text-slate-400 font-bold">Number of Directors</span>
                                    <span className="text-slate-800 font-extrabold">{vendor.directorsCount || '0'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Company Profile */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                            <h3 className="text-base font-extrabold !text-[#0B1E43] uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">
                                4. Company Profile
                            </h3>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                {vendor.companyProfile || `Welcome to ${vendor.organizationName}. We are dedicated to providing excellent logistics, warehousing and forwarding services globally.`}
                            </p>

                            {vendor.services && vendor.services.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {vendor.services.map((srv, idx) => (
                                        <span key={idx} className="bg-[#0066FF]/10 text-[#0066FF] text-xs font-black uppercase px-4 py-2 rounded-xl">
                                            {srv}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Columns - Highlights & Metrics */}
                    <div className="space-y-8">
                        
                        {/* Share & Actions */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-3">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
                                <Share2 size={16} />
                                <span>Share & Connect</span>
                            </div>
                            <button 
                                onClick={() => setShowContactModal(true)}
                                className="w-full inline-flex items-center justify-center gap-2 bg-[#0066FF] hover:bg-[#0B1E43] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all"
                            >
                                <Send size={14} />
                                Send Direct Inquiry
                            </button>
                            <button 
                                onClick={() => setShowContactModal(true)}
                                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all"
                            >
                                <Globe size={14} />
                                Connect with Carrier
                            </button>
                            <button 
                                onClick={() => setShowContactModal(true)}
                                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all"
                            >
                                <Building2 size={14} />
                                Request Freight Rates
                            </button>
                            <button 
                                onClick={() => alert('Added to preferred list!')}
                                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all"
                            >
                                <Star size={14} />
                                Add to Preferred Vendor
                            </button>
                        </div>

                        {/* Rating */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center">
                            <h4 className="text-[#0B1E43] font-black text-lg mb-1">Overall Rating 5 of 5</h4>
                            <div className="flex items-center justify-center gap-1 text-amber-400 my-3">
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                                <Star size={20} fill="currentColor" />
                            </div>
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-4">(0 Ratings)</span>
                            <button className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all">
                                View Reviews
                            </button>
                        </div>

                        {/* Highlights */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                                <ShieldCheck size={16} className="text-[#0066FF]" />
                                <span>Business Highlights</span>
                            </div>
                            <ul className="space-y-3.5 text-xs font-extrabold text-slate-600 uppercase tracking-wide">
                                <li className="flex items-center gap-2 text-emerald-600">✓ Global Logistics Network</li>
                                <li className="flex items-center gap-2 text-emerald-600">✓ Fast Response Time</li>
                                <li className="flex items-center gap-2 text-emerald-600">✓ Trusted by Business</li>
                                <li className="flex items-center gap-2 text-emerald-600">✓ Experienced & Professional Team</li>
                                <li className="flex items-center gap-2 text-emerald-600">✓ Cost Effective Solution</li>
                            </ul>
                        </div>

                        {/* Complaints Against Me */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                                <AlertTriangle size={16} className="text-red-500" />
                                <span>Complaints Against Me</span>
                            </div>
                            <div className="space-y-2 text-xs font-bold">
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Total Complaints</span>
                                    <span className="text-slate-800 font-extrabold">0</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Resolved</span>
                                    <span className="text-[#0066FF] font-extrabold">0</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Pending</span>
                                    <span className="text-amber-500 font-extrabold">0</span>
                                </div>
                            </div>
                        </div>

                        {/* Complaints Raised By Me */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
                                <Info size={16} className="text-[#0066FF]" />
                                <span>Complaints Raised By Me</span>
                            </div>
                            <div className="space-y-2 text-xs font-bold">
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Total Complaints</span>
                                    <span className="text-slate-800 font-extrabold">0</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-50">
                                    <span className="text-slate-500">Resolved</span>
                                    <span className="text-[#0066FF] font-extrabold">0</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">Pending</span>
                                    <span className="text-amber-500 font-extrabold">0</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* Contact Vendor Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden">
                        <button 
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
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
                                    <input 
                                        type="text" 
                                        required
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Your Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-500 font-extrabold text-xs uppercase tracking-wider mb-2">Message</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder="Write your message here..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 text-sm font-bold bg-slate-50 resize-none"
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={submittingContact}
                                    className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {submittingContact ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Send Inquiry
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorPublicProfile;
