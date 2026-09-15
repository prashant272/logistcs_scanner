import React, { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CustomerHeader = ({ isSidebarOpen, setSidebarOpen, user, logout }) => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const fetchBalance = async () => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) return;
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/wallet/ledger`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalance(res.data.balance);
        } catch (err) {
            console.error('Failed to fetch balance in header', err);
        }
    };

    useEffect(() => {
        fetchBalance();
        window.addEventListener('walletUpdated', fetchBalance);
        return () => window.removeEventListener('walletUpdated', fetchBalance);
    }, []);

    return (
        <header className="relative bg-white/80 backdrop-blur-xl border-b border-white/40 h-20 flex items-center justify-between px-6 md:px-8 z-50 shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Left: Sidebar Toggle and Dashboard Title */}
            <div className="flex items-center gap-5">
                <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)} 
                    className="p-2.5 bg-white hover:bg-slate-50 rounded-xl text-slate-700 transition-all border border-slate-200/50 shadow-sm hover:shadow-md cursor-pointer group"
                >
                    <Menu size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                </button>
                <div className="flex flex-col justify-center">
                    <h1 className="text-[17px] font-black bg-gradient-to-br from-[#0B1E43] via-[#0B1E43] to-[#0066FF] bg-clip-text text-transparent leading-none tracking-tight flex items-center gap-2">
                        Customer Dashboard
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse"></div>
                    </h1>
                    <p className="text-[9.5px] text-slate-400 mt-1.5 font-extrabold tracking-[0.2em] uppercase">Logistics Client Panel</p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-5">
                {/* Premium Wallet Balance Chip */}
                <button 
                    onClick={() => navigate('/customer/wallet-ledger')}
                    className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-700 rounded-2xl hover:from-emerald-100/80 hover:to-teal-100/80 transition-all border border-emerald-100/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
                >
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm shadow-emerald-200/50">
                        <Wallet size={13} className="text-emerald-500" />
                    </div>
                    <div className="flex flex-col items-start leading-none pr-1">
                        <span className="text-[9px] text-emerald-600/70 font-black uppercase tracking-[0.15em] mb-1">Wallet</span>
                        <span className="font-black text-[14px] tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                            ₹{Number(balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2.5 bg-white hover:bg-[#0066FF]/5 rounded-xl text-slate-600 hover:text-[#0066FF] transition-all border border-slate-200/60 shadow-sm hover:shadow-md hover:border-[#0066FF]/20 cursor-pointer group"
                    >
                        <Bell size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-0 right-0 flex h-2.5 w-2.5 -mt-0.5 -mr-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                        </span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-white z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-extrabold text-slate-800 text-[13px]">Notifications</h3>
                                <span className="text-[9px] font-black bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-[#0066FF]/30">1 New</span>
                            </div>
                            <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                                <div className="p-4 hover:bg-slate-50/80 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 m-1">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20 p-[1px]">
                                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="pt-0.5">
                                            <p className="text-[13px] font-bold text-slate-800 leading-tight">Welcome to Logistics Scanner!</p>
                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">Complete your profile to unlock all features and start booking freight.</p>
                                            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Just now</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

                {/* User Avatar */}
                <div className="flex items-center gap-3.5 cursor-pointer group">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00b2fe] p-[2px] group-hover:shadow-[0_0_15px_rgba(0,102,255,0.3)] transition-all group-hover:scale-105">
                            <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[#0066FF] font-black text-xl overflow-hidden">
                                {user?.profilePhoto ? (
                                    <img 
                                        src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${user.profilePhoto}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    user?.name ? user.name.charAt(0).toUpperCase() : 'C'
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full"></div>
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[13.5px] font-black text-slate-800 leading-none group-hover:text-[#0066FF] transition-colors">
                            {user?.name || 'Customer'}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-[0.1em] mt-1.5">
                            {user?.company || 'Personal Account'}
                        </span>
                    </div>
                </div>

                {/* Revert as Admin Button (If Admin Token exists) */}
                {sessionStorage.getItem('adminToken') && (
                    <button
                        onClick={() => {
                            localStorage.removeItem('userToken');
                            window.location.href = '/admin/customers';
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white hover:from-amber-500 hover:to-amber-600 text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer uppercase tracking-widest ml-2 hover:-translate-y-0.5"
                    >
                        Revert Admin
                    </button>
                )}

                {/* Logout button */}
                <button 
                    onClick={logout}
                    className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full transition-all cursor-pointer border border-slate-200 hover:border-red-200 shadow-sm hover:shadow-md ml-1"
                    title="Logout"
                >
                    <LogOut size={16} strokeWidth={2.5} className="ml-0.5" />
                </button>
            </div>
        </header>
    );
};

export default CustomerHeader;
