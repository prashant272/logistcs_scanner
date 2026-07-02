import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, LogOut } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

const VendorHeader = ({ isSidebarOpen, setSidebarOpen, user, logout, searchQuery, setSearchQuery }) => {
    const navigate = useNavigate();

    return (
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-6 md:px-8 z-10 shrink-0">
            {/* Left: Sidebar Toggle and Dashboard Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-slate-50 rounded-xl !text-slate-500 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                >
                    <Menu size={18} />
                </button>
                <div>
                    <h1 className="text-base font-extrabold !text-[#0B1E43] leading-none tracking-tight">Vendor Dashboard</h1>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-5">


                {/* Notification Bell */}
                <NotificationBell />

                {/* Available Wallet Balance */}
                {user?.role === 'vendor' && (
                    <div
                        onClick={() => navigate('/vendor/wallet')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors hover:shadow-sm ${user.walletBalance && user.walletBalance > 0
                                ? 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                : 'bg-red-50 border-red-100 hover:bg-red-100'
                            }`}
                        title="Click to view wallet ledger"
                    >
                        <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider">Available Wallet:</span>
                        <span className={`text-xs font-black ${user.walletBalance && user.walletBalance > 0 ? 'text-emerald-600' : 'text-red-650'
                            }`}>
                            {user.walletBalance && user.walletBalance > 0 ? `₹${user.walletBalance.toLocaleString('en-IN')}` : 'Not Approved'}
                        </span>
                    </div>
                )}

                {/* User Avatar */}
                <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066FF]/10 to-[#00b2fe]/10 flex items-center justify-center !text-[#0066FF] font-black border border-[#0066FF]/10 shadow-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-xs font-black !text-slate-800 leading-tight">
                            {user?.name || 'Sandeep'}
                        </span>
                        <span className="text-[9px] !text-[#0066FF] font-extrabold tracking-wider uppercase mt-0.5">
                            {user?.company || 'PIRAMAL LOGISTICS'}
                        </span>
                    </div>
                </div>

                {/* Vendor Network Button */}
                <button 
                    onClick={() => navigate('/vendor-network')}
                    className="hidden md:block border-2 border-[#0066FF] text-[#0066FF] hover:bg-[#0066FF] hover:text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                >
                    Vendor Network
                </button>

                {/* View Profile Button */}
                <button 
                    onClick={() => navigate('/vendor/view-profile')}
                    className="hidden md:block bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer uppercase tracking-wider"
                >
                    Profile
                </button>

                {/* Revert as Admin Button (If Admin Token exists) */}
                {localStorage.getItem('adminToken') && (
                    <button
                        onClick={() => {
                            localStorage.removeItem('userToken');
                            window.location.href = '/admin/vendors';
                        }}
                        className="flex items-center gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer uppercase tracking-wider"
                    >
                        Revert as Admin
                    </button>
                )}

                {/* Logout button */}
                <button
                    onClick={logout}
                    className="flex items-center gap-1.5 text-xs font-bold !text-red-500 hover:bg-red-50 px-3.5 py-2.5 rounded-xl border border-transparent hover:border-red-100 transition-all cursor-pointer"
                >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default VendorHeader;
