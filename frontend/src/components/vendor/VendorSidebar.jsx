import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Truck, Landmark, FileText, MessageSquare, 
    Calendar, DollarSign, Wallet, FileSpreadsheet, 
    User, LogOut, Search, AlertCircle
} from 'lucide-react';

const VendorSidebar = ({ isSidebarOpen, logout, user }) => {
    const location = useLocation();

    const isPending = user && user.role !== 'admin' && user.verificationStatus !== 'Approved';

    const handleNavClick = (e, item) => {
        if (isPending && item.name !== 'View Profile' && item.name !== 'Dashboard') {
            e.preventDefault();
            alert('Please upload required document and if your profile is approved then these tabs will be enabled.');
        }
    };

    // Sidebar navigation items with routes
    const navItems = [
        { name: 'Dashboard', path: '/vendor/dashboard', icon: <Landmark size={18} /> },
        { name: 'Live Price', path: '/vendor/search-price', icon: <Search size={18} /> },
        { name: 'My Enquiries', path: '/vendor/my-enquiries', icon: <FileText size={18} /> },
        { name: 'Direct Enquiries', path: '/vendor/direct-enquiries', icon: <MessageSquare size={18} /> },
        { name: 'Direct Booking', path: '/vendor/direct-booking', icon: <Truck size={18} /> },
        { name: 'My Bookings', path: '/vendor/my-bookings', icon: <Calendar size={18} /> },
        { name: 'My Pricing', path: '/vendor/my-pricing', icon: <DollarSign size={18} /> },
        { name: 'Finance Form', path: '/vendor/finance', icon: <Wallet size={18} /> },
        { name: 'Finance List', path: '/vendor/finance-list', icon: <FileSpreadsheet size={18} /> },
        { name: 'Upload Invoice', path: '/vendor/upload-invoice', icon: <FileText size={18} /> },
        { name: 'Bulk Import', path: '/vendor/bulk-import', icon: <FileSpreadsheet size={18} /> },
        { name: 'View Profile', path: '/vendor/view-profile', icon: <User size={18} /> },
        { name: 'Complaint', path: '/vendor/complaint', icon: <AlertCircle size={18} /> }
    ];

    return (
        <aside className={`bg-gradient-to-b from-[#0B1E43] via-[#081633] to-[#050f24] text-white ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'} transition-all duration-300 flex flex-col shrink-0 h-screen fixed left-0 top-0 overflow-y-auto z-20 border-r border-white/5`}>
            {/* Logo Section */}
            <div className="p-5 flex items-center justify-between border-b border-white/5 h-20 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00b2fe] flex items-center justify-center shrink-0 shadow-lg shadow-[#0066FF]/25">
                        <Truck className="text-white w-5 h-5" />
                    </div>
                    <div className={`flex flex-col ${!isSidebarOpen && 'md:hidden'}`}>
                        <span className="font-extrabold tracking-wider text-sm text-white">LOGISTICS</span>
                        <span className="text-[10px] tracking-[0.25em] text-[#00b2fe] font-black">SCANNER</span>
                    </div>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const isLivePrice = item.name === 'Live Price';
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={(e) => handleNavClick(e, item)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 relative group ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white shadow-lg shadow-[#0066FF]/20 translate-x-0.5'
                                    : isLivePrice
                                        ? 'bg-[#0066FF]/15 text-[#00b2fe] border border-[#0066FF]/25 hover:bg-[#0066FF]/25 hover:translate-x-0.5'
                                        : isPending && item.name !== 'View Profile' && item.name !== 'Dashboard'
                                            ? 'opacity-50 cursor-not-allowed text-white/50'
                                            : 'text-white/95 hover:bg-white/[0.04] hover:text-white hover:translate-x-0.5'
                            }`}
                        >
                            {/* Left indicator bar */}
                            {isActive && (
                                <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />
                            )}
                            <span className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : isLivePrice ? 'text-[#00b2fe]' : 'text-white/80 group-hover:text-white'}`}>
                                {item.icon}
                            </span>
                            <span className={`tracking-wide transition-opacity duration-200 ${!isSidebarOpen ? 'md:hidden' : ''}`}>{item.name}</span>
                            
                            {/* Red Blinking Live Dot */}
                            {isLivePrice && (
                                <div className={`absolute right-4 flex h-2 w-2 ${!isSidebarOpen ? 'md:hidden' : ''}`}>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Sidebar Footer / Logout */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-0.5"
                >
                    <LogOut size={18} />
                    <span className={!isSidebarOpen ? 'md:hidden' : ''}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default VendorSidebar;
