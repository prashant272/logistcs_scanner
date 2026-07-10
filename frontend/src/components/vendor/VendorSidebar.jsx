import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Truck, Landmark, FileText, MessageSquare, 
    Calendar, DollarSign, Wallet, FileSpreadsheet, 
    User, LogOut, Search, AlertCircle, Building2, ChevronDown
} from 'lucide-react';

const VendorSidebar = ({ isSidebarOpen, logout, user }) => {
    const location = useLocation();

    const isPending = user && user.role !== 'admin' && user.verificationStatus !== 'Approved' && user.verificationStatus !== 'Pre Approved';

    const handleNavClick = (e, item) => {
        if (isPending && item.name !== 'View Profile' && item.name !== 'Dashboard') {
            e.preventDefault();
            alert('Please upload required document and if your profile is approved then these tabs will be enabled.');
        }
    };

    const [openGroups, setOpenGroups] = React.useState({
        'Avail 30 Day Credit': true
    });

    const toggleGroup = (label) => {
        setOpenGroups(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Sidebar navigation items with routes
    const navItems = [
        { type: 'link', name: 'Dashboard', path: '/vendor/dashboard', icon: <Landmark size={18} /> },
        { type: 'link', name: 'Live Price', path: '/vendor/search-price', icon: <Search size={18} /> },
        { 
            type: 'group', 
            label: 'Booking',
            items: [
                { name: 'My Bookings', path: '/vendor/my-bookings', icon: <Calendar size={18} /> },
                { name: 'PTL Bookings', path: '/vendor/ptl-bookings', icon: <Truck size={18} /> },
                { name: 'Direct Booking', path: '/vendor/direct-booking', icon: <Truck size={18} /> }
            ]
        },
        { 
            type: 'group', 
            label: 'Enquiry',
            items: [
                { name: 'My Enquiries', path: '/vendor/my-enquiries', icon: <FileText size={18} /> },
                { name: 'Direct Enquiries', path: '/vendor/direct-enquiries', icon: <MessageSquare size={18} /> },
                { name: 'B2B Enquiries', path: '/vendor/b2b-enquiries', icon: <Building2 size={18} /> }
            ]
        },
        { 
            type: 'group', 
            label: 'Avail 30 Day Credit',
            isSpecial: true,
            items: [
                { name: 'Apply Now', path: '/vendor/finance', icon: <Wallet size={18} /> },
                { name: 'Apply List & Status', path: '/vendor/finance-list', icon: <FileSpreadsheet size={18} /> },
                { name: 'Upload Invoice', path: '/vendor/upload-invoice', icon: <FileText size={18} /> },
                { name: 'Credit Invoices', path: '/vendor/credit-invoices', icon: <DollarSign size={18} /> }
            ]
        },
        { 
            type: 'group', 
            label: 'My Pricing',
            items: [
                { name: 'My Pricing', path: '/vendor/my-pricing', icon: <DollarSign size={18} /> },
                { name: 'Bulk Import', path: '/vendor/bulk-import', icon: <FileSpreadsheet size={18} /> }
            ]
        },
        { 
            type: 'group', 
            label: 'Profile & Rating',
            items: [
                { name: 'Contact Vendor List', path: '/vendor/contact-vendor-list', icon: <MessageSquare size={18} /> },
                { name: 'Complaint', path: '/vendor/complaint', icon: <AlertCircle size={18} /> },
                { name: 'View Profile', path: '/vendor/view-profile', icon: <User size={18} /> }
            ]
        }
    ];

    return (
        <aside className={`bg-gradient-to-b from-[#0B1E43] via-[#081633] to-[#050f24] text-white transition-all duration-300 flex flex-col shrink-0 h-screen fixed left-0 top-0 overflow-y-auto z-40 border-r border-white/5 ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
            {/* Logo Section */}
            <Link to="/" className="block border-b border-white/5 h-20 overflow-hidden w-full flex items-center justify-center bg-white p-3 hover:opacity-90 transition-opacity">
                {isSidebarOpen ? (
                    <img src="/logo.png" alt="Logistics Scanner Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                    <img src="/logo.png" alt="Logistics Scanner Logo" className="h-10 w-10 object-contain p-1" />
                )}
            </Link>

            {/* Sidebar Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((group, idx) => {
                    if (group.type === 'group') {
                        const isOpen = openGroups[group.label];
                        return (
                            <div key={`group-${idx}`} className="mb-2">
                                <button
                                    onClick={() => toggleGroup(group.label)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 mt-3 cursor-pointer transition-colors ${!isSidebarOpen ? 'hidden' : 'flex'} bg-[#0066FF]/10 hover:bg-[#0066FF]/20 border border-[#0066FF]/20 rounded-lg`}
                                >
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${group.isSpecial ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`}>
                                        {group.label}
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        {group.isSpecial && (
                                            <div className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </div>
                                        )}
                                        <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-1">
                                        {group.items.map(item => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    to={item.path}
                                                    onClick={(e) => handleNavClick(e, item)}
                                                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 relative group ${
                                                        isActive
                                                            ? 'bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white shadow-lg shadow-[#0066FF]/20 translate-x-0.5'
                                                            : isPending && item.name !== 'View Profile' && item.name !== 'Dashboard'
                                                                ? 'opacity-50 cursor-not-allowed text-white'
                                                                : 'text-white hover:bg-white/[0.04] hover:translate-x-0.5'
                                                    }`}
                                                >
                                                    {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />}
                                                    <span className={`transition-transform duration-200 group-hover:scale-105 text-white`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className={`tracking-wide transition-opacity duration-200 ${!isSidebarOpen ? 'md:hidden' : ''}`}>{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Single links (Dashboard, Live Price)
                    const isActive = location.pathname === group.path;
                    const isLivePrice = group.name === 'Live Price';
                    return (
                        <Link
                            key={group.name}
                            to={group.path}
                            onClick={(e) => handleNavClick(e, group)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 relative group ${
                                isActive
                                    ? 'bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white shadow-lg shadow-[#0066FF]/20 translate-x-0.5'
                                    : isLivePrice
                                        ? 'bg-[#0066FF]/15 text-[#00b2fe] border border-[#0066FF]/25 hover:bg-[#0066FF]/25 hover:translate-x-0.5'
                                        : isPending && group.name !== 'View Profile' && group.name !== 'Dashboard'
                                            ? 'opacity-50 cursor-not-allowed text-white'
                                            : 'text-white hover:bg-white/[0.04] hover:translate-x-0.5'
                            }`}
                        >
                            {isActive && <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />}
                            <span className={`transition-transform duration-200 group-hover:scale-105 ${isLivePrice ? 'text-[#00b2fe]' : 'text-white'}`}>
                                {group.icon}
                            </span>
                            <span className={`tracking-wide transition-opacity duration-200 ${!isSidebarOpen ? 'md:hidden' : ''}`}>{group.name}</span>
                            
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
