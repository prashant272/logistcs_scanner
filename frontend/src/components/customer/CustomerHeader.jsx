import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';

const CustomerHeader = ({ isSidebarOpen, setSidebarOpen, user, logout }) => {
    return (
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-6 md:px-8 z-10 shrink-0">
            {/* Left: Sidebar Toggle and Dashboard Title */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(!isSidebarOpen)} 
                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                >
                    <Menu size={18} />
                </button>
                <div>
                    <h1 className="text-base font-extrabold text-[#0B1E43] leading-none tracking-tight">Customer Dashboard</h1>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-bold tracking-wider uppercase">Logistics Client Panel</p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-5">
                {/* Notification Bell */}
                <button className="relative p-2.5 bg-[#f4f7fc] hover:bg-slate-100 rounded-xl text-slate-600 transition-all border border-transparent hover:border-slate-200/50 cursor-pointer">
                    <Bell size={16} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[9px] font-black text-white flex items-center justify-center rounded-full border border-white animate-pulse">
                        1
                    </span>
                </button>

                {/* User Avatar */}
                <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066FF]/10 to-[#00b2fe]/10 flex items-center justify-center text-[#0066FF] font-black border border-[#0066FF]/10 shadow-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-xs font-black text-slate-800 leading-tight">
                            {user?.name || 'Customer'}
                        </span>
                        <span className="text-[9px] text-[#0066FF] font-extrabold tracking-wider uppercase mt-0.5">
                            {user?.company || 'Personal Account'}
                        </span>
                    </div>
                </div>

                {/* Logout button */}
                <button 
                    onClick={logout}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-3.5 py-2.5 rounded-xl border border-transparent hover:border-red-100 transition-all cursor-pointer"
                >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default CustomerHeader;
