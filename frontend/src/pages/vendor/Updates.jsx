import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Bell, Clock, Megaphone, Settings, Gift, Star, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const getTypeConfig = (type) => {
    switch(type) {
        case 'Announcement':
            return { 
                icon: <Megaphone size={24} className="text-blue-500" />, 
                bg: 'bg-blue-50', 
                badgeBg: 'bg-blue-100', 
                badgeText: 'text-blue-600' 
            };
        case 'System Update':
            return { 
                icon: <Settings size={24} className="text-green-500" />, 
                bg: 'bg-green-50', 
                badgeBg: 'bg-green-100', 
                badgeText: 'text-green-600' 
            };
        case 'Feature Update':
            return { 
                icon: <Gift size={24} className="text-purple-500" />, 
                bg: 'bg-purple-50', 
                badgeBg: 'bg-purple-100', 
                badgeText: 'text-purple-600' 
            };
        case 'Important':
            return { 
                icon: <Star size={24} className="text-orange-500" />, 
                bg: 'bg-orange-50', 
                badgeBg: 'bg-orange-100', 
                badgeText: 'text-orange-600' 
            };
        default:
            return { 
                icon: <Megaphone size={24} className="text-blue-500" />, 
                bg: 'bg-blue-50', 
                badgeBg: 'bg-blue-100', 
                badgeText: 'text-blue-600' 
            };
    }
};

const VendorUpdates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All Updates');
    const [sortOrder, setSortOrder] = useState('Newest First');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/system-updates/vendor`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUpdates(res.data);
            } catch (error) {
                console.error('Error fetching updates', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUpdates();
    }, []);

    const isNew = (dateString) => {
        const updateDate = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - updateDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 3;
    };

    const filteredUpdates = useMemo(() => {
        let filtered = updates;
        if (activeTab !== 'All Updates') {
            filtered = updates.filter(u => u.type === activeTab || (activeTab === 'Announcements' && u.type === 'Announcement'));
        }
        
        if (sortOrder === 'Oldest First') {
            filtered = [...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
            filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        return filtered;
    }, [updates, activeTab, sortOrder]);

    const totalPages = Math.ceil(filteredUpdates.length / itemsPerPage) || 1;
    const currentUpdates = filteredUpdates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-[#0066FF] rounded-full border-t-transparent animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 w-full space-y-6 bg-slate-50 min-h-screen font-sans">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-white px-8 py-10 rounded-[1.5rem] shadow-sm flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-5 z-10">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                        <Bell size={28} className="text-[#0066FF]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">
                            Updates & Announcements
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Stay informed about the latest platform news and important updates.
                        </p>
                    </div>
                </div>
                
                {/* 3D Illustration placeholder (using Lucide icons layered to mimic the mockup) */}
                <div className="hidden md:flex relative z-10 mr-10">
                    <div className="w-24 h-24 bg-blue-100/50 rounded-full absolute -top-4 -right-4 blur-xl"></div>
                    <Megaphone size={80} className="text-[#0066FF] drop-shadow-xl transform -rotate-12" />
                    <Bell size={32} className="text-yellow-400 absolute bottom-0 right-0 transform translate-x-4 translate-y-2 drop-shadow-md" fill="currentColor" />
                    <div className="absolute top-0 left-0 w-4 h-4 bg-blue-300 rounded-full blur-sm transform -translate-x-8 -translate-y-4"></div>
                    <div className="absolute top-1/2 right-0 w-3 h-3 bg-yellow-200 rounded-full blur-sm transform translate-x-12"></div>
                </div>
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                <div className="flex bg-white rounded-full p-1 shadow-sm border border-slate-100">
                    {['All Updates', 'Announcements', 'System Updates'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-blue-50 text-[#0066FF]' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="relative">
                    <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-full pl-5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
                    >
                        <option value="Newest First">Newest First</option>
                        <option value="Oldest First">Oldest First</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Updates List */}
            {filteredUpdates.length === 0 ? (
                <div className="bg-white p-16 rounded-[1.5rem] shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No updates found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">There are no updates matching your current filters.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {currentUpdates.map((update, idx) => {
                        const typeStr = update.type || 'Announcement';
                        const config = getTypeConfig(typeStr);
                        const isFirstCard = idx === 0 && currentPage === 1 && sortOrder === 'Newest First';
                        
                        return (
                            <div 
                                key={update._id} 
                                className={`relative bg-white p-6 rounded-[1.2rem] shadow-sm border ${isFirstCard ? 'border-l-4 border-l-[#0066FF] border-y-slate-100 border-r-slate-100' : 'border-slate-100'} hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start`}
                            >
                                {/* Icon */}
                                <div className={`w-16 h-16 ${config.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                    {config.icon}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h3 className="text-xl font-black text-slate-800 mb-1 truncate">
                                        {update.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm font-medium mb-4 line-clamp-2">
                                        {update.content}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full ${config.badgeBg} ${config.badgeText}`}>
                                            {typeStr}
                                        </span>
                                        {isNew(update.createdAt) && (
                                            <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-[#0066FF] text-white">
                                                New
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Date */}
                                <div className="flex items-center gap-2 text-slate-500 md:ml-auto shrink-0 pt-2">
                                    <Clock size={14} />
                                    <div className="flex flex-col text-right">
                                        <span className="text-sm font-bold">
                                            {new Date(update.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="text-xs font-medium">
                                            {new Date(update.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200/60 text-sm font-medium text-slate-500">
                    <div className="mb-4 sm:mb-0">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUpdates.length)} of {filteredUpdates.length} updates
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            &laquo;
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                        currentPage === i + 1 
                                        ? 'bg-[#0066FF] text-white' 
                                        : 'hover:bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            &raquo;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorUpdates;
