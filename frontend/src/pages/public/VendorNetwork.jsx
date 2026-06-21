import React, { useState } from 'react';
import { Search, MapPin, Building2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const VendorNetwork = () => {
    const [lsid, setLsid] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [showMessage, setShowMessage] = useState(false);

    const countryData = {
        "Afghanistan": ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif"],
        "Botswana": ["Gaborone", "Francistown", "Molepolole"],
        "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
        "India": [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
            "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
            "Chandigarh", "Puducherry"
        ],
        "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh"],
        "South Africa": ["Cape Town", "Johannesburg", "Durban", "Pretoria"],
        "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
        "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
        "Uzbekistan": ["Tashkent", "Samarkand", "Bukhara", "Namangan"]
    };

    const handleCountryChange = (e) => {
        setCountry(e.target.value);
        setCity('');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
    };

    return (
        <div className="bg-slate-50 min-h-screen pt-32 pb-20 font-sans">
            
            <div className="container mx-auto px-6 max-w-4xl">
                
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
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 md:p-12 relative overflow-hidden">
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
                            className="w-full bg-[#0066FF] hover:bg-[#0B1E43] text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#0066FF]/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <Search size={20} />
                            Search Vendor
                        </button>

                        {/* Working on this Feature Message */}
                        {showMessage && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                <AlertCircle size={24} className="text-[#0066FF] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-[#0B1E43] font-bold text-sm">Under Development</h4>
                                    <p className="!text-[#0066FF] text-sm mt-1 font-bold">I am working on this features.</p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VendorNetwork;
