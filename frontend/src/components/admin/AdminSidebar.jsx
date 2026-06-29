import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, User, Truck, DollarSign, PlusCircle, MapPin, 
    Percent, FileText, UserPlus, Users, FileSpreadsheet, Globe, 
    TrendingUp, AlertCircle, Settings, ChevronDown, ChevronRight, LogOut
} from 'lucide-react';

const AdminSidebar = ({ isSidebarOpen, logout }) => {
    const location = useLocation();

    // Track which accordion categories are expanded
    const [expandedCategories, setExpandedCategories] = useState({
        'Reports': true,
        'Location Master': true
    });

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Beautiful menu structure exactly matching user requests
    const menuStructure = [
        {
            category: 'Dashboard',
            items: [
                { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> }
            ]
        },
        {
            category: 'Manage Customers',
            items: [
                { name: 'Manage Customer', path: '/admin/customers', icon: <User size={16} /> }
            ]
        },
        {
            category: 'Manage Users',
            items: [
                { name: 'Manage Vendor', path: '/admin/vendors', icon: <Truck size={16} /> }
            ]
        },
        {
            category: 'Manage Enquiries',
            items: [
                { name: 'All Enquiries', path: '/admin/enquiries', icon: <FileText size={16} /> }
            ]
        },
        {
            category: 'Reports',
            isCollapsible: true,
            items: [
                { name: 'Vendor Pricing', path: '/admin/reports/vendor-pricing', icon: <DollarSign size={16} /> },
                { name: 'Add Pricing', path: '/admin/reports/add-pricing', icon: <PlusCircle size={16} /> },
                { name: 'Add Via Pricing', path: '/admin/reports/add-via-pricing', icon: <MapPin size={16} /> },
                { name: 'Add Plan', path: '/admin/reports/add-plan', icon: <PlusCircle size={16} /> },
                { name: 'Add Coupon', path: '/admin/reports/add-coupon', icon: <Percent size={16} /> },
                { name: 'Inquiry listing', path: '/admin/reports/inquiry-listing', icon: <FileText size={16} /> },
                { name: 'Add RM', path: '/admin/reports/add-rm', icon: <UserPlus size={16} /> },
                { name: 'Assign RM', path: '/admin/reports/assign-rm', icon: <Users size={16} /> },
                { name: 'Bulk Import', path: '/admin/reports/bulk-import', icon: <FileSpreadsheet size={16} /> }
            ]
        },
        {
            category: 'Location Master',
            isCollapsible: true,
            items: [
                { name: 'Location Master', path: '/admin/location-master', icon: <Globe size={16} /> },
                { name: 'Finance Enquiry List', path: '/admin/finance-enquiry-list', icon: <FileSpreadsheet size={16} /> }
            ]
        },
        {
            category: 'Invoice Request',
            items: [
                { name: 'Invoice Request', path: '/admin/invoice-request', icon: <FileText size={16} /> }
            ]
        },
        {
            category: 'Upgrade Requests',
            items: [
                { name: 'Upgrade Requests', path: '/admin/upgrade-requests', icon: <TrendingUp size={16} /> }
            ]
        },
        {
            category: 'adminComplaints',
            items: [
                { name: 'All Complaints', path: '/admin/complaints', icon: <AlertCircle size={16} /> }
            ]
        },
        {
            category: 'CMS Settings',
            items: [
                { name: 'CMS Settings', path: '/admin/cms-settings', icon: <Settings size={16} /> }
            ]
        }
    ];

    return (
        <aside className={`bg-gradient-to-b from-[#0B1E43] via-[#081633] to-[#050f24] text-white transition-all duration-300 flex flex-col shrink-0 h-screen fixed left-0 top-0 overflow-y-auto z-40 border-r border-white/5 ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
            {/* Logo Section */}
            <div className="p-5 flex items-center justify-between border-b border-white/5 h-20 overflow-hidden shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00b2fe] flex items-center justify-center shrink-0 shadow-lg shadow-[#0066FF]/25">
                        <Truck className="text-white w-5 h-5" />
                    </div>
                    <div className={`flex flex-col ${!isSidebarOpen && 'md:hidden'}`}>
                        <span className="font-extrabold tracking-wider text-sm text-white">LOGISTICS</span>
                        <span className="text-[10px] tracking-[0.25em] text-[#00b2fe] font-black">ADMIN</span>
                    </div>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-3 overflow-y-auto custom-scrollbar">
                {menuStructure.map((group) => {
                    const isExpanded = expandedCategories[group.category];

                    if (group.isCollapsible) {
                        return (
                            <div key={group.category} className="space-y-1">
                                {/* Header Toggle */}
                                <button
                                    onClick={() => toggleCategory(group.category)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black tracking-wider text-[#00b2fe] hover:bg-white/[0.02] uppercase text-left transition-all ${!isSidebarOpen ? 'md:justify-center' : ''}`}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            <span>{group.category}</span>
                                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                        </>
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00b2fe]" title={group.category} />
                                    )}
                                </button>

                                {/* Child Items */}
                                {(isExpanded || !isSidebarOpen) && (
                                    <div className="space-y-1 pl-1">
                                        {group.items.map((item) => {
                                            const isActive = location.pathname === item.path;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    to={item.path}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 relative group ${
                                                        isActive
                                                            ? 'bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white shadow-md shadow-[#0066FF]/10'
                                                            : 'text-white/90 hover:bg-white/[0.03] hover:text-white'
                                                    }`}
                                                >
                                                    {isActive && (
                                                        <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-white rounded-r-full" />
                                                    )}
                                                    <span className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className={`tracking-wide ${!isSidebarOpen ? 'md:hidden' : ''}`}>{item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Standard Non-collapsible Category Group
                    return (
                        <div key={group.category} className="space-y-1">
                            {isSidebarOpen && (
                                <div className="px-3 py-1 text-[9px] font-black tracking-wider text-slate-400 uppercase select-none">
                                    {group.category}
                                </div>
                            )}
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 relative group ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#0066FF] to-[#00b2fe] text-white shadow-md shadow-[#0066FF]/10'
                                                : 'text-white/90 hover:bg-white/[0.03] hover:text-white'
                                        }`}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-white rounded-r-full" />
                                        )}
                                        <span className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                            {item.icon}
                                        </span>
                                        <span className={`tracking-wide ${!isSidebarOpen ? 'md:hidden' : ''}`}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Sidebar Footer / Logout */}
            <div className="p-4 border-t border-white/5 shrink-0">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer"
                >
                    <LogOut size={16} />
                    <span className={!isSidebarOpen ? 'md:hidden' : ''}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
