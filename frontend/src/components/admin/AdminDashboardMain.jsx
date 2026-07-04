import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Calendar as CalendarIcon, RotateCcw, Menu, Users, ShoppingBag, AlertCircle, FileText, IndianRupee, UserCheck } from 'lucide-react';

const fetcher = async ([url, filterType, customStart, customEnd]) => {
    const token = sessionStorage.getItem('adminToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    let fetchUrl = url;
    let startDate, endDate;
    const now = new Date();
    
    if (filterType === 'Custom Date' && customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
    } else if (filterType === 'Weekly') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        endDate = new Date();
    } else if (filterType === 'Last 15 Days') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 15);
        endDate = new Date();
    } else if (filterType === 'Monthly') {
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        endDate = new Date();
    }

    if (startDate && endDate) {
        fetchUrl += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }

    const res = await axios.get(fetchUrl, config);
    return res.data;
};

const StatCard = ({ title, value, icon: Icon, gradientClass, subtitle }) => (
    <div className={`rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 ${gradientClass}`}>
        <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-black/10 backdrop-blur-md shadow-inner">
                <Icon size={24} className="text-white drop-shadow-md" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/10 px-2.5 py-1 rounded-md backdrop-blur-md shadow-sm border border-white/10">
                Live
            </span>
        </div>
        <div className="mt-6">
            <h3 className="text-4xl font-black !text-white drop-shadow-md tracking-tight">{value}</h3>
            <p className="text-sm font-bold text-white mt-1 drop-shadow-sm">{title}</p>
            {subtitle && <p className="text-xs text-white/90 mt-1.5 font-medium drop-shadow-sm">{subtitle}</p>}
        </div>
    </div>
);

const AdminDashboardMain = () => {
    const [filterType, setFilterType] = useState('Monthly');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const { data: stats, error, isLoading: loading } = useSWR(
        [`${import.meta.env.VITE_API_BASE_URL}/admin/dashboard-stats`, filterType, customStart, customEnd],
        fetcher,
        { refreshInterval: 30000, revalidateOnFocus: true }
    );

    const getDateRangeDisplay = (rangeType) => {
        if (rangeType === 'Custom Date' && customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            return `${start.toLocaleDateString('en-GB', options)} - ${end.toLocaleDateString('en-GB', options)}`;
        }
        
        const now = new Date();
        let start = new Date();
        if (rangeType === 'Weekly') {
            start.setDate(now.getDate() - 7);
        } else if (rangeType === 'Last 15 Days') {
            start.setDate(now.getDate() - 15);
        } else if (rangeType === 'Monthly') {
            start.setMonth(now.getMonth() - 1);
        } else {
            return 'Select Custom Dates';
        }
        
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return `${start.toLocaleDateString('en-GB', options)} - ${now.toLocaleDateString('en-GB', options)}`;
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-64 flex-col gap-4">
                <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">Loading Live Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview Dashboard</h1>
                <p className="text-slate-500 font-bold mt-1">Monitor all system activities, users, and finances in real-time.</p>
            </div>

            {/* Filter Strip */}
            <div className="bg-white border-2 border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.04)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Menu size={14} className="text-[#0066FF]" /> Filter Set
                    </span>
                    <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
                        {['Monthly', 'Weekly', 'Last 15 Days', 'Custom Date'].map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setFilterType(t);
                                    if (t !== 'Custom Date') {
                                        setCustomStart('');
                                        setCustomEnd('');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${
                                    filterType === t
                                        ? 'bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white shadow-lg shadow-blue-500/30 scale-105'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    {filterType === 'Custom Date' && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-blue-200 animate-in fade-in zoom-in duration-200">
                            <input 
                                type="date" 
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500" 
                            />
                            <span className="text-slate-400 font-bold">to</span>
                            <input 
                                type="date" 
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500" 
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <div className="bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2">
                        <CalendarIcon size={14} className="text-blue-500" />
                        <span>{getDateRangeDisplay(filterType)}</span>
                    </div>

                    <button className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-900/20 cursor-pointer">
                        Apply Filter
                    </button>

                    <button 
                        onClick={() => {
                            setFilterType('Monthly');
                            setCustomStart('');
                            setCustomEnd('');
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-rose-100"
                    >
                        <RotateCcw size={14} /> Clear
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard 
                    title="Total Customers" 
                    value={stats.users.customers} 
                    icon={Users} 
                    gradientClass="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900"
                />
                <StatCard 
                    title="Total Guests" 
                    value={stats.users.guests} 
                    icon={UserCheck} 
                    gradientClass="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900"
                    subtitle="Unique Guest Enquiries"
                />
                <StatCard 
                    title="Total Vendors" 
                    value={stats.users.vendors} 
                    icon={ShoppingBag} 
                    gradientClass="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900"
                    subtitle={`${stats.users.pendingVendors} Pending Approval`}
                />
                <StatCard 
                    title="Total Enquiries" 
                    value={stats.enquiries.total} 
                    icon={FileText} 
                    gradientClass="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800"
                    subtitle={`${stats.enquiries.accepted} Accepted`}
                />
                <StatCard 
                    title="Finance Apps" 
                    value={stats.finance.total} 
                    icon={IndianRupee} 
                    gradientClass="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900"
                    subtitle={`${stats.finance.pending} Pending Review`}
                />
            </div>

            {/* Details Section Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Latest Enquiries (Span 8) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <FileText size={20} className="text-amber-600" />
                            </div>
                            Latest Enquiries
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {stats.recentActivity.enquiries && stats.recentActivity.enquiries.length === 0 ? (
                            <p className="text-sm font-bold text-slate-400 text-center py-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">No recent enquiries found.</p>
                        ) : (
                            stats.recentActivity.enquiries?.map((enq, i) => (
                                <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border-2 border-slate-50 bg-white hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="font-black text-slate-800 text-base">
                                                {enq.fromLocation} <span className="text-blue-500 mx-2">→</span> {enq.toLocation}
                                            </p>
                                            <span className="text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest bg-slate-900 text-white shadow-sm">
                                                {enq.type}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">
                                            By: <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded ml-1">{enq.client?.name || enq.guestName || 'Guest'}</span>
                                            {enq.vendor && <span className="ml-3 pl-3 border-l-2 border-slate-200">To: <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded ml-1">{enq.vendor.name}</span></span>}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs px-3 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm ${
                                            enq.status === 'Accepted' ? 'bg-emerald-500 text-white shadow-emerald-500/30' :
                                            enq.status === 'Declined' ? 'bg-rose-500 text-white shadow-rose-500/30' :
                                            'bg-amber-400 text-amber-950 shadow-amber-400/30'
                                        }`}>
                                            {enq.status}
                                        </span>
                                        <p className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            {new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Vendors & Bookings (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Recent Vendors */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <AlertCircle size={18} className="text-amber-600" />
                                </div>
                                Recent Vendors
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {stats.recentActivity.vendors.length === 0 ? (
                                <p className="text-sm font-bold text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No recent vendors.</p>
                            ) : (
                                stats.recentActivity.vendors.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-50 bg-white hover:border-amber-100 hover:bg-amber-50/30 transition-all shadow-sm">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{v.name}</p>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{v.company}</p>
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest ${
                                            v.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                                        }`}>
                                            {v.verificationStatus || (v.isVerified ? 'Approved' : 'Pending')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Accepted Bookings */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <ShoppingBag size={18} className="text-[#0066FF]" />
                                </div>
                                Recent Bookings
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {stats.recentActivity.bookings.length === 0 ? (
                                <p className="text-sm font-bold text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No recent accepted bookings.</p>
                            ) : (
                                stats.recentActivity.bookings.map((b, i) => (
                                    <div key={i} className="flex flex-col gap-2 p-4 rounded-xl border-2 border-slate-50 bg-white hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <p className="font-black text-slate-800 text-xs">
                                                {b.fromLocation} <span className="text-indigo-400 mx-1">→</span> {b.toLocation}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[10px] font-bold text-slate-500">
                                                Client: <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{b.client?.name || b.guestName || 'Unknown'}</span>
                                            </p>
                                            <p className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                {b.price ? `₹${b.price}` : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboardMain;
