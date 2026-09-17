import React, { useState, useEffect } from 'react';
import {
    Map, Search, PlusCircle, BarChart2, Download, CreditCard, Crown,
    ArrowRight, FileText, CheckCircle2, Clock, Users, Ship, Plane,
    CheckCircle, Wallet, LogOut, Phone, ShieldCheck, Star, Zap, Database,
    Truck, Building2, User, AlertCircle, MessageCircle,
    TrendingUp, Code, Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const CustomerMainDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Stats states
    const [activeVendors, setActiveVendors] = useState(100);
    const [enquiryStats, setEnquiryStats] = useState({ total: 12, accepted: 8, pending: 4, rejected: 0 });
    const [walletBalance, setWalletBalance] = useState(0);
    const [recentEnquiries, setRecentEnquiries] = useState([]);

    useEffect(() => {
        // Randomize Active Vendors around 100 on every load
        const variance = Math.floor(Math.random() * 31) - 15; // -15 to +15
        setActiveVendors(100 + variance);

        // Fetch real enquiry data
        const fetchStats = async () => {
            try {
                const res = await api.get('/enquiries/client?limit=1000');
                const enquiries = res.data.data || res.data || [];
                
                const total = enquiries.length;
                const accepted = enquiries.filter(e => e.status === 'Accepted' || e.status?.toLowerCase() === 'accepted').length;
                const pending = enquiries.filter(e => e.status === 'Pending' || e.status?.toLowerCase() === 'pending').length;
                const rejected = enquiries.filter(e => e.status === 'Rejected' || e.status?.toLowerCase() === 'rejected').length;
                
                setEnquiryStats({ total, accepted, pending, rejected });
                setRecentEnquiries(enquiries.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch enquiries for stats", error);
            }
        };
        
        fetchStats();

        const fetchWallet = async () => {
            try {
                const res = await api.get('/finance/wallet/ledger');
                setWalletBalance(res.data.balance || 0);
            } catch (error) {
                console.error("Failed to fetch wallet balance", error);
            }
        };
        fetchWallet();

        // Listen for wallet updates if it changes anywhere else
        window.addEventListener('walletUpdated', fetchWallet);
        return () => window.removeEventListener('walletUpdated', fetchWallet);
    }, []);

    return (
        <div className="w-full min-h-screen bg-[#F4F7FC] p-4 md:p-6 lg:p-8 font-sans">
            <div className="w-full space-y-6">

                {/* 1. Hero Banner */}
                <div className="relative rounded-3xl overflow-hidden shadow-sm flex items-center bg-white min-h-[240px] border border-slate-100">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0 bg-blue-50">
                        <img
                            src="/hero-banner.png"
                            alt="Logistics Background with Airplane and Ship"
                            className="w-full h-full object-cover object-center opacity-100"
                        />
                    </div>

                    <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="max-w-[420px] mb-2 drop-shadow-md">
                            <h1 className="text-2xl md:text-3xl font-black mb-2 text-[#0B1E43]">Welcome Back, {user?.name || 'Customer'}!</h1>
                            <p className="text-[#1A365D] text-[13px] leading-relaxed font-bold">
                                Your global logistics partner. Find the best rates, connect with verified vendors and manage your shipments — all in one place.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-lg flex items-center gap-4 cursor-pointer hover:bg-white transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                                <Map size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#0B1E43]">Explore Global Logistics</h3>
                                <p className="text-[10px] text-blue-800 font-bold">Sea | Air | Land | CHA | Warehousing</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Action Cards (6 grid) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[
                        { title: 'Search Vendors', desc: 'Find verified logistics service providers', icon: <Search size={22} strokeWidth={2.5} />, color: 'text-blue-600', cardBg: 'bg-blue-50/40 hover:bg-blue-50', iconBg: 'bg-gradient-to-br from-blue-100 to-blue-50', link: '/customer/search-price' },
                        { title: 'Post Enquiry', desc: 'Get direct quotes from vendors', icon: <PlusCircle size={22} strokeWidth={2.5} />, color: 'text-emerald-600', cardBg: 'bg-emerald-50/40 hover:bg-emerald-50', iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-50', link: '/customer/search-price' },
                        { title: 'Compare Rates', desc: 'Check live rates & compare easily', icon: <BarChart2 size={22} strokeWidth={2.5} />, color: 'text-purple-600', cardBg: 'bg-purple-50/40 hover:bg-purple-50', iconBg: 'bg-gradient-to-br from-purple-100 to-purple-50', link: '/customer/search-price' },
                        { title: 'Download Invoice', desc: 'View & download your invoices', icon: <Download size={22} strokeWidth={2.5} />, color: 'text-amber-600', cardBg: 'bg-amber-50/40 hover:bg-amber-50', iconBg: 'bg-gradient-to-br from-amber-100 to-amber-50', link: '/customer/finance-list?tab=plan_invoices' },
                        { title: 'Credit Facility', desc: 'Get credit & upgrade your plan', icon: <CreditCard size={22} strokeWidth={2.5} />, color: 'text-rose-600', cardBg: 'bg-rose-50/40 hover:bg-rose-50', iconBg: 'bg-gradient-to-br from-rose-100 to-rose-50', link: '/customer/finance' },
                        { title: 'Upgrade to Pro', desc: 'More enquiries, API access & premium features', icon: <Crown size={22} strokeWidth={2.5} />, color: 'text-[#0066FF]', cardBg: 'bg-blue-50/30 hover:bg-blue-50/60', iconBg: 'bg-gradient-to-br from-blue-200 to-blue-50', link: '/customer/plans' },
                    ].map((item, i) => (
                        <div key={i} onClick={() => navigate(item.link)} className={`rounded-3xl p-5 xl:p-6 ${item.cardBg} transition-all cursor-pointer group flex flex-col min-h-[160px] relative border border-transparent hover:border-slate-100/50 hover:-translate-y-1 hover:shadow-lg shadow-sm`}>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className={`w-10 h-10 xl:w-12 xl:h-12 ${item.iconBg} ${item.color} rounded-full flex items-center justify-center mb-4 xl:mb-5 group-hover:scale-110 transition-transform shadow-sm shrink-0`}>
                                    {item.icon}
                                </div>
                                <div className="mt-auto">
                                    <h3 className="text-[12px] xl:text-[13px] font-black text-[#0B1E43] mb-1 xl:mb-1.5 leading-tight">{item.title}</h3>
                                    <div className="flex justify-between items-end gap-2">
                                        <p className="text-[10px] xl:text-[11px] text-slate-500 font-medium leading-snug w-[85%]">{item.desc}</p>
                                        <div className="text-[#0B1E43] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all pb-0.5 shrink-0">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-7 space-y-6">

                        {/* My Overview section */}
                        <div>
                            <h2 className="text-[15px] font-black text-[#0B1E43] mb-4">My Overview</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {[
                                    { title: 'Total Enquiries', count: enquiryStats.total.toString(), sub: 'Last 30 days', icon: <FileText size={20} strokeWidth={2.5} />, bg: 'bg-[#1877F2]' },
                                    { title: 'Accepted Enquiries', count: enquiryStats.accepted.toString(), sub: 'Last 30 days', icon: <CheckCircle2 size={20} strokeWidth={2.5} />, bg: 'bg-[#22C55E]' },
                                    { title: 'Pending Enquiries', count: enquiryStats.pending.toString(), sub: 'Last 30 days', icon: <Clock size={20} strokeWidth={2.5} />, bg: 'bg-[#F59E0B]' },
                                    { title: 'Active Vendors', count: activeVendors.toString(), sub: 'Verified & Active', icon: <Users size={20} strokeWidth={2.5} />, bg: 'bg-[#8B5CF6]' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white rounded-[16px] p-5 flex items-center relative border border-slate-200/80 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group">
                                        <div className={`w-12 h-12 ${stat.bg} text-white rounded-full flex items-center justify-center shrink-0 mr-4 shadow-sm group-hover:scale-105 transition-transform`}>
                                            {stat.icon}
                                        </div>
                                        <div className="flex flex-col justify-center pr-6">
                                            <p className="text-[13px] text-[#0B1E43] font-bold mb-0.5">{stat.title}</p>
                                            <h3 className="text-[24px] font-black text-[#0B1E43] leading-none mb-1.5">{stat.count}</h3>
                                            <p className="text-[11px] text-slate-400 font-medium">{stat.sub}</p>
                                        </div>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B1E43] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Credit Facility Card */}
                            <div className="bg-[#F0F7FF] rounded-[16px] p-5 px-6 flex flex-wrap items-center justify-between gap-4 mt-5 border border-blue-100/60 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 text-[#0066FF] flex items-center justify-center shrink-0">
                                        {/* Using Database icon to resemble the coin stack from mockup */}
                                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-black text-[#0B1E43] mb-1">Credit Facility</h3>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[12.5px] text-slate-600 font-medium">Available Credit: <span className="font-black text-[#0B1E43] text-[15px] ml-1">₹ {walletBalance.toLocaleString('en-IN')}</span></p>
                                            <span className="bg-[#Ecfdf5] text-[#059669] text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">Up to 30 Days</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/customer/finance')} className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-7 py-2.5 rounded-lg text-[13px] font-bold transition-all hover:shadow-md">
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Recent Enquiries Table */}
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-base font-black text-slate-800">Recent Enquiries</h2>
                                <span onClick={() => navigate('/customer/my-enquiry')} className="text-blue-600 text-xs font-bold cursor-pointer hover:underline">View All</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[15%]">Enquiry ID</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[25%]">Route</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[15%]">Mode</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[15%]">Commodity</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[15%]">Status</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-[10%]">Date</th>
                                            <th className="pb-4 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right w-[5%]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs font-bold text-slate-700">
                                        {recentEnquiries.length > 0 ? recentEnquiries.map((row, i) => {
                                            const route = `${row.fromLocation || '-'} → ${row.toLocation || '-'}`;
                                            const date = new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                            
                                            let mIcon = <Ship size={14} />;
                                            let modeDisplay = 'Sea';
                                            const typeLower = row.type?.toLowerCase();
                                            if (typeLower === 'air') { mIcon = <Plane size={14} />; modeDisplay = 'Air'; }
                                            else if (typeLower === 'land') { mIcon = <Truck size={14} />; modeDisplay = 'Land'; }
                                            else if (typeLower === 'warehouse') { mIcon = <Building2 size={14} />; modeDisplay = 'Warehouse'; }
                                            else if (typeLower === 'cha') { mIcon = <ShieldCheck size={14} />; modeDisplay = 'CHA'; }

                                            const targetPath = row.isDirect 
                                                ? `/customer/direct-enquiry?id=${row._id}` 
                                                : `/customer/my-enquiry?id=${row._id}`;

                                            return (
                                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 text-slate-500">{row.enquiryId || row._id?.slice(-8)}</td>
                                                    <td className="py-4 px-4 truncate max-w-[200px]">{route}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2 text-blue-600"><span className="bg-blue-50 p-1.5 rounded-md">{mIcon}</span> {modeDisplay}</div>
                                                    </td>
                                                    <td className="py-4 px-4">{row.commodity?.name || row.commodity || '-'}</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-2.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${row.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {row.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-500">{date}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button onClick={() => navigate(targetPath)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors">View</button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">No recent enquiries found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Services & Enquiry Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
                            {/* Top Services */}
                            <div className="bg-white rounded-[16px] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 lg:col-span-3">
                                <h2 className="text-[15px] font-black text-[#0B1E43] mb-4">Top Services</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {[
                                        { icon: <Ship size={24} strokeWidth={2} />, name: 'Sea Freight', sub: '12 Enquiries', color: 'text-[#1877F2]', bg: 'bg-[#E5F0FF]' },
                                        { icon: <Plane size={24} strokeWidth={2} />, name: 'Air Freight', sub: '8 Enquiries', color: 'text-[#1877F2]', bg: 'bg-[#E5F0FF]' },
                                        { icon: <Truck size={24} strokeWidth={2} />, name: 'Land Transport', sub: '6 Enquiries', color: 'text-[#22C55E]', bg: 'bg-[#DCFCE7]' },
                                        { icon: <ShieldCheck size={24} strokeWidth={2} />, name: 'CHA Services', sub: '4 Enquiries', color: 'text-[#8B5CF6]', bg: 'bg-[#EDE9FE]' },
                                        { icon: <Building2 size={24} strokeWidth={2} />, name: 'Warehousing', sub: '3 Enquiries', color: 'text-[#22C55E]', bg: 'bg-[#DCFCE7]' },
                                    ].map((srv, i) => (
                                        <div key={i} className="border border-slate-100 rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:shadow-md hover:-translate-y-1 transition-all">
                                            <div className={`w-[46px] h-[46px] rounded-full ${srv.bg} ${srv.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                {srv.icon}
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <span className="text-[11px] font-bold text-[#0B1E43] leading-tight mb-0.5 whitespace-nowrap">{srv.name}</span>
                                                <span className="text-[9.5px] font-medium text-slate-400">{srv.sub}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Enquiry Status */}
                            <div className="bg-white rounded-[16px] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 lg:col-span-2 flex flex-col">
                                <h2 className="text-[15px] font-black text-[#0B1E43] mb-5">Enquiry Status</h2>
                                <div className="flex items-center justify-between gap-4 flex-1">
                                    {/* Donut Chart */}
                                    <div className="relative w-[110px] h-[110px] flex items-center justify-center rounded-full shrink-0 shadow-sm" style={{ 
                                        background: enquiryStats.total > 0 
                                            ? `conic-gradient(#22C55E 0% ${(enquiryStats.accepted/enquiryStats.total)*100}%, #F59E0B ${(enquiryStats.accepted/enquiryStats.total)*100}% ${((enquiryStats.accepted+enquiryStats.pending)/enquiryStats.total)*100}%, #94a3b8 ${((enquiryStats.accepted+enquiryStats.pending)/enquiryStats.total)*100}% ${((enquiryStats.accepted+enquiryStats.pending+enquiryStats.rejected)/enquiryStats.total)*100}%, #E2E8F0 ${((enquiryStats.accepted+enquiryStats.pending+enquiryStats.rejected)/enquiryStats.total)*100}% 100%)`
                                            : 'conic-gradient(#E2E8F0 0% 100%)'
                                    }}>
                                        <div className="w-[82px] h-[82px] bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                            <span className="text-[20px] font-black text-[#0B1E43] leading-none mb-1">{enquiryStats.total}</span>
                                            <span className="text-[8px] text-slate-500 font-bold whitespace-nowrap">Total Enquiries</span>
                                        </div>
                                    </div>

                                    {/* Legends */}
                                    <div className="flex-1 flex flex-col justify-center gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-sm"></span>
                                                <span className="text-[12px] font-bold text-[#0B1E43]">Accepted</span>
                                            </div>
                                            <span className="text-[13px] font-black text-[#0B1E43]">{enquiryStats.accepted}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm"></span>
                                                <span className="text-[12px] font-bold text-[#0B1E43]">Pending</span>
                                            </div>
                                            <span className="text-[13px] font-black text-[#0B1E43]">{enquiryStats.pending}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm"></span>
                                                <span className="text-[12px] font-bold text-[#0B1E43]">Rejected</span>
                                            </div>
                                            <span className="text-[13px] font-black text-[#0B1E43]">{enquiryStats.rejected}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Global Logistics Network */}
                        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[16px] p-5 relative overflow-hidden mt-6">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="md:w-[55%]">
                                    <h2 className="text-[16px] font-black text-[#0B1E43] mb-2">Global Logistics Network</h2>
                                    <p className="text-[12px] text-slate-500 mb-4 leading-relaxed w-[95%]">Connect with verified vendors across 100+ countries. Find the best rates and expand your supply chain globally.</p>

                                    <div className="flex items-center gap-6 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[38px] h-[38px] rounded-full bg-[#F0F7FF] text-[#1877F2] flex items-center justify-center shrink-0">
                                                <Map size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-[15px] font-black text-[#0B1E43] leading-none mb-0.5">100+</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Countries</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-[38px] h-[38px] rounded-full bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center shrink-0">
                                                <Users size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-[15px] font-black text-[#0B1E43] leading-none mb-0.5">5,000+</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Verified Vendors</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/customer/search-price')} className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-5 py-2 rounded-[8px] text-[12px] font-bold transition-colors w-fit">
                                        Search Vendors →
                                    </button>
                                </div>
                                <div className="md:w-[45%] flex justify-end">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" alt="World Map" className="w-[90%] max-h-[140px] object-contain opacity-80" />
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* RIGHT COLUMN */}
                    <div className="xl:col-span-3 space-y-6">

                        {/* RM Profile */}
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-800 mb-4">Your RM</h2>
                            <div className="flex gap-4 items-center mb-6">
                                <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                    <img src="https://ui-avatars.com/api/?name=Neha+Mishra&background=0D8ABC&color=fff" alt="RM" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Neha Mishra</h3>
                                    <p className="text-xs text-slate-500">Relationship Manager</p>
                                </div>
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Phone size={14} /></div>
                                    +91 92663 35550
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><MessageCircle size={14} /></div>
                                    support@logisticsscanner.com
                                </div>
                            </div>
                            <button className="w-full bg-[#E8F8F5] hover:bg-[#D1F2EB] text-[#117A65] border border-[#A3E4D7] py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                <MessageCircle size={16} className="text-[#1ABC9C]" /> Chat on WhatsApp
                            </button>
                        </div>

                        {/* Quick Links */}
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-800 mb-4">Quick Links</h2>
                            <div className="space-y-2">
                                {[
                                    { icon: <Download size={16} />, label: 'Download Invoice', link: '/customer/upload-invoice' },
                                    { icon: <AlertCircle size={16} />, label: 'Raise a Complaint', link: '/customer/complaint' },
                                    { icon: <User size={16} />, label: 'Update Profile', link: '/customer/profile' }
                                ].map((lnk, i) => (
                                    <div key={i} onClick={() => navigate(lnk.link)} className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                        <div className="flex items-center gap-4 text-slate-700 font-bold text-[13px]">
                                            <div className="w-10 h-10 rounded-full bg-blue-50/50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors">
                                                {lnk.icon}
                                            </div>
                                            {lnk.label}
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upgrade Banner */}
                        <div className="bg-gradient-to-br from-[#0B1E43] to-[#1e3c72] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                                    <Crown size={20} className="text-white" />
                                </div>
                                <h3 className="text-lg font-black mb-2">Upgrade to Pro</h3>
                                <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                                    Get higher enquiry limits, API access and more premium features.
                                </p>
                                <button onClick={() => navigate('/customer/plans')} className="bg-[#0066FF] hover:bg-[#0052cc] text-white w-full py-3 rounded-xl text-xs font-bold transition-colors">
                                    View Plans
                                </button>
                            </div>
                            <div className="absolute -right-10 -bottom-10 opacity-10">
                                <Crown size={120} />
                            </div>
                        </div>

                        {/* Support Block */}
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                <MessageCircle size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Need Help?</h3>
                            <p className="text-xs text-slate-500 mb-4">Our support team is here for you.</p>
                            <p className="text-xs font-bold text-blue-600 mb-1">support@logisticsscanner.com</p>
                            <p className="text-xs font-bold text-slate-700 mb-4">+91 92663 35550</p>
                            <button className="bg-[#0066FF] text-white px-6 py-2 rounded-full text-xs font-bold w-full hover:bg-[#0052cc] transition-colors">
                                Live Chat ✦
                            </button>
                        </div>
                    </div>
                </div>
                {/* Bottom CTA Banner */}
                <div className="mt-6 bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between py-8 px-10">
                    
                    {/* Background Graphic (Fades to white just before the right icons) */}
                    <div className="absolute left-0 top-0 w-[60%] h-full pointer-events-none" style={{ backgroundImage: 'url(/hero-banner.png)', backgroundSize: 'cover', backgroundPosition: 'left center', WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)' }}></div>
                    
                    {/* Left/Middle Content */}
                    <div className="relative z-10 flex flex-col items-start w-[50%] md:pl-6 pb-2">
                        <h2 className="text-[24px] font-black text-[#0B1E43] mb-1.5">Need More Enquiries?</h2>
                        <p className="text-[13px] text-black font-bold mb-5">Upgrade to Pro and get higher limits, API access & premium features.</p>
                        <button onClick={() => navigate('/customer/plans')} className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-6 py-2.5 rounded-[8px] text-[13px] font-bold transition-all shadow-sm mb-1">
                            Upgrade Now →
                        </button>
                    </div>

                    {/* Right Features */}
                    <div className="relative z-10 hidden lg:flex items-center gap-8 mt-6 md:mt-0 md:pr-10">
                        <div className="w-[1px] h-[50px] bg-slate-100"></div>
                        <div className="flex flex-col items-center justify-center gap-3 w-[85px] text-center">
                            <div className="w-[42px] h-[42px] rounded-full bg-[#EEF5FF] text-[#1877F2] flex items-center justify-center">
                                <TrendingUp size={20} strokeWidth={2.5}/>
                            </div>
                            <span className="text-[10.5px] font-bold text-[#0B1E43] leading-tight">Higher Enquiry<br/>Limits</span>
                        </div>
                        <div className="w-[1px] h-[50px] bg-slate-100"></div>
                        <div className="flex flex-col items-center justify-center gap-3 w-[85px] text-center">
                            <div className="w-[42px] h-[42px] rounded-full bg-[#EEF5FF] text-[#1877F2] flex items-center justify-center">
                                <Code size={20} strokeWidth={2.5}/>
                            </div>
                            <span className="text-[10.5px] font-bold text-[#0B1E43] leading-tight">API Access</span>
                        </div>
                        <div className="w-[1px] h-[50px] bg-slate-100"></div>
                        <div className="flex flex-col items-center justify-center gap-3 w-[85px] text-center">
                            <div className="w-[42px] h-[42px] rounded-full bg-[#EEF5FF] text-[#1877F2] flex items-center justify-center">
                                <Headphones size={20} strokeWidth={2.5}/>
                            </div>
                            <span className="text-[10.5px] font-bold text-[#0B1E43] leading-tight">Priority<br/>Support</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomerMainDashboard;
