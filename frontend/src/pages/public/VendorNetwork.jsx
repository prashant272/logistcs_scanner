import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, AlertCircle, X, Lock, Eye, CheckCircle2, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import useSEO from '../../hooks/useSEO';

const VendorNetwork = () => {
    useSEO({
        title: 'Our Vendor Network | Trusted Logistics Partners',
        description: 'Explore the extensive network of verified logistics vendors on Logistics Scanner. Find top-rated freight forwarders for your shipping needs.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    const { user } = useAuth();
    const navigate = useNavigate();
    const [lsid, setLsid] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    
    const [searchResults, setSearchResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [loading, setLoading] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [fingerprint, setFingerprint] = useState('');

    const [countryData, setCountryData] = useState({});

    // Fetch dynamic vendor locations on mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/public-vendors-locations`);
                setCountryData(data);
            } catch (err) {
                console.error('Failed to fetch vendor locations:', err);
            }
        };
        fetchLocations();
    }, []);

    // Calculate light fingerprint on mount
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

    const handleCountryChange = (e) => {
        setCountry(e.target.value);
        setCity('');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSearchResults([]);
        setCurrentPage(1);
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/auth/public-vendors-search`,
                {
                    params: { lsid, country, city }
                }
            );
            setSearchResults(data);
            if (data.length === 0) {
                setError('No vendors found matching criteria.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch vendors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewVendor = async (vendorId) => {
        setViewLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const headers = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const { data } = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/auth/public-vendors-search/${vendorId}/details`,
                {
                    params: { fingerprint },
                    headers
                }
            );
            setSelectedVendor(data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                setShowBlockModal(true);
            } else {
                alert(err.response?.data?.message || 'Failed to fetch vendor details.');
            }
        } finally {
            setViewLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pt-32 pb-20 font-sans">
            
            <div className="container mx-auto px-6 max-w-5xl">
                
                {/* Premium Simple Header */}
                <div className="text-center mb-12 animate-fade-in-up">
                    <span className="text-[#0066FF] text-xs font-black tracking-[0.3em] uppercase block mb-3">
                        Global Logistics Network
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black !text-[#0B1E43] tracking-tight mb-4">
                        Vendor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00b2fe]">Search</span>
                    </h1>
                    <p className="!text-slate-600 font-bold max-w-xl mx-auto">
                        Connect with verified Freight Forwarders, Transporters, & Warehouses across the globe.
                    </p>
                </div>

                {/* Premium Search Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 md:p-12 relative overflow-hidden mb-12">
                    {/* Soft decorative glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <form onSubmit={handleSearch} className="relative z-10">
                        {/* LSID Search */}
                        <div className="mb-8">
                            <label className="block !text-black font-extrabold mb-3 text-sm uppercase tracking-wider">Search by LSID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building2 size={20} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter Vendor ID (e.g. LS-10024)"
                                    value={lsid}
                                    onChange={(e) => setLsid(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all !text-black font-bold placeholder:font-light bg-slate-50 focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* OR Divider */}
                        <div className="flex items-center justify-center my-8">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="px-6 py-2 !text-slate-500 font-bold text-xs uppercase tracking-widest bg-slate-50 rounded-full border border-slate-200 mx-4">OR</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Location Search */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div>
                                <label className="block !text-black font-extrabold mb-3 text-sm uppercase tracking-wider">Country</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPin size={20} className="text-slate-400" />
                                    </div>
                                    <select
                                        value={country}
                                        onChange={handleCountryChange}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all !text-black font-bold appearance-none bg-slate-50 focus:bg-white cursor-pointer"
                                    >
                                        <option value="" disabled>Select Country</option>
                                        {Object.keys(countryData).map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block !text-black font-extrabold mb-3 text-sm uppercase tracking-wider">City</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPin size={20} className="text-slate-400" />
                                    </div>
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        disabled={!country}
                                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all !text-black font-bold appearance-none bg-slate-50 focus:bg-white cursor-pointer disabled:bg-slate-100 disabled:opacity-60"
                                    >
                                        <option value="" disabled>Select City</option>
                                        {country && countryData[country].map((cty) => (
                                            <option key={cty} value={cty}>{cty}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#0066FF]/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search size={20} />
                                    Search Vendor
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 font-semibold mb-8">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Search Results Table */}
                {searchResults.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-extrabold !text-[#0B1E43] text-lg uppercase tracking-wider">Search Results</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-extrabold text-xs uppercase tracking-wider bg-slate-50/20">
                                        <th className="py-4 px-6">LSID</th>
                                        <th className="py-4 px-6">Organization Name</th>
                                        <th className="py-4 px-6">City</th>
                                        <th className="py-4 px-6">Country</th>

                                        <th className="py-4 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 !text-black font-semibold">
                                    {searchResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vendor) => (
                                        <tr key={vendor._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-6 !text-[#0066FF] font-extrabold">
                                                LS-{vendor.lsid}
                                            </td>
                                            <td className="py-4 px-6 text-[#0B1E43] font-bold">
                                                <div className="flex items-center gap-2">
                                                    <span>{vendor.organizationName}</span>
                                                    {vendor.activePlan && vendor.activePlan.price > 0 && (
                                                        <>
                                                            <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm whitespace-nowrap">
                                                                Verified
                                                            </span>
                                                            {vendor.activePlan.name.toLowerCase().includes('premium') && (
                                                                <span className="bg-[#0066FF] text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm whitespace-nowrap">
                                                                    Pro
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                {vendor.city || 'N/A'}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600">
                                                {vendor.country || 'N/A'}
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => {
                                                        const slug = (vendor.organizationName || vendor.name || 'vendor').trim().replace(/[\s\W-]+/g, '-').toLowerCase();
                                                        navigate(`/vendor-network/profile/${slug}`, { state: { fromSearch: true } });
                                                    }}
                                                    className="inline-flex items-center gap-1 bg-[#0066FF] hover:bg-[#0B1E43] text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition-all"
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(() => {
                            const totalPages = Math.ceil(searchResults.length / itemsPerPage);
                            if (totalPages <= 1) return null;
                            
                            return (
                                <div className="flex justify-center items-center gap-4 p-6 border-t border-slate-100 bg-white">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold disabled:opacity-50 hover:bg-slate-200 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold disabled:opacity-50 hover:bg-slate-200 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

            </div>

            {/* Vendor Details Premium Modal */}
            {selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-8 overflow-hidden">
                        {/* soft gradient top bar */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0066FF] to-[#00b2fe]"></div>
                        
                        <button 
                            onClick={() => setSelectedVendor(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6 mt-2">
                            <div className="bg-[#0066FF]/10 p-3 rounded-2xl">
                                <ShieldCheck size={28} className="text-[#0066FF]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0B1E43] tracking-tight">{selectedVendor.organizationName}</h3>
                                <p className="text-xs text-[#0066FF] font-black uppercase tracking-widest mt-0.5">LSID: LS-{selectedVendor.lsid}</p>
                            </div>
                        </div>

                        <div className="space-y-4 border-t border-b border-slate-100 py-6 mb-6">
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Email Address</p>
                                    <p className="text-slate-800 font-bold">{selectedVendor.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Phone Number</p>
                                    <p className="text-slate-800 font-bold">{selectedVendor.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Location / Address</p>
                                    <p className="text-slate-800 font-bold">
                                        {selectedVendor.address ? `${selectedVendor.address}, ` : ''}
                                        {selectedVendor.city}, {selectedVendor.country}
                                    </p>
                                </div>
                            </div>

                            {selectedVendor.website && (
                                <div className="flex items-start gap-3">
                                    <Globe size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Website</p>
                                        <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-[#0066FF] hover:underline font-bold">
                                            {selectedVendor.website}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {selectedVendor.services && selectedVendor.services.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <Building2 size={18} className="text-slate-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Services Offered</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {selectedVendor.services.map((srv, idx) => (
                                                <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-bold">
                                                    {srv}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => setSelectedVendor(null)}
                            className="w-full bg-[#0B1E43] hover:bg-[#0066FF] text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}

            {/* Block Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden text-center">
                        <button 
                            onClick={() => setShowBlockModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <Lock size={32} />
                        </div>

                        <h3 className="text-2xl font-black text-[#0B1E43] mb-3">Profile Access Blocked</h3>
                        <p className="text-slate-600 font-bold text-sm mb-6 leading-relaxed">
                            You have already viewed details of one vendor. To view details of all logistics partners, please register and get approved as a vendor.
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link 
                                to="/vendor-auth" 
                                className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-[#0066FF]/20 transition-all text-center text-sm"
                                onClick={() => setShowBlockModal(false)}
                            >
                                Register as a Vendor
                            </Link>
                            <Link 
                                to="/vendor-auth" 
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-widest py-3.5 rounded-xl transition-all text-center text-sm"
                                onClick={() => setShowBlockModal(false)}
                            >
                                Log In
                            </Link>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default VendorNetwork;
