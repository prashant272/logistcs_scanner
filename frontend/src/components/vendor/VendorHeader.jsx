import React from 'react';
import { Menu, Search, Bell, LogOut } from 'lucide-react';

const VendorHeader = ({ isSidebarOpen, setSidebarOpen, user, logout, searchQuery, setSearchQuery }) => {
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
                    <p className="text-[10px] !text-slate-400 mt-1.5 font-bold tracking-wider uppercase">PIRAMAL LOGISTICS PARTNER</p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-5">
                {/* Search Input */}
                <div className="relative hidden lg:block w-64">
                    <input
                        type="text"
                        placeholder="Search enquiries, bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#f4f7fc] border border-transparent rounded-xl pl-4 pr-10 py-2.5 text-xs !text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all placeholder:!text-slate-400 font-bold"
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 !text-slate-400 w-4 h-4" />
                </div>

                {/* Notification Bell */}
                <button className="relative p-2.5 bg-[#f4f7fc] hover:bg-slate-100 rounded-xl !text-slate-600 transition-all border border-transparent hover:border-slate-200/50 cursor-pointer">
                    <Bell size={16} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center rounded-full border border-white animate-pulse">
                        3
                    </span>
                </button>

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

                {/* View Profile Button */}
                <button className="hidden md:block bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer uppercase tracking-wider">
                    Profile
                </button>

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
