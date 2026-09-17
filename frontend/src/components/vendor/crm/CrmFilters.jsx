import React from 'react';
import { Search, ChevronDown, List, Grid } from 'lucide-react';

const CrmFilters = ({ 
    searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter,
    modeFilter, setModeFilter,
    regionFilter, setRegionFilter,
    sortFilter, setSortFilter,
    statuses 
}) => {
    return (
        <div className="overflow-x-auto hide-scrollbar mb-6 pb-2">
            <div className="flex items-center justify-between gap-4 min-w-[950px]">
                {/* Search Bar */}
                <div className="relative w-80 shrink-0">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search leads by company, route, or city..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-3 shrink-0 flex-1 justify-end">
                <div className="relative shrink-0">
                    <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer min-w-[130px] shadow-sm hover:border-slate-300 transition-colors"
                    >
                        <option>All Status</option>
                        {statuses.map(st => <option key={st}>{st}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative shrink-0">
                    <select 
                        value={modeFilter}
                        onChange={e => setModeFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer min-w-[150px] shadow-sm hover:border-slate-300 transition-colors"
                    >
                        <option>All Transport Mode</option>
                        <option>Air Freight</option>
                        <option>Sea Freight</option>
                        <option>Land Transport</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative shrink-0">
                    <select 
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer min-w-[120px] shadow-sm hover:border-slate-300 transition-colors"
                    >
                        <option>All Regions</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative shrink-0">
                    <select 
                        value={sortFilter}
                        onChange={e => setSortFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer min-w-[120px] shadow-sm hover:border-slate-300 transition-colors"
                    >
                        <option>Sort by: Newest</option>
                        <option>Sort by: Oldest</option>
                        <option>Sort by: Status</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                
                {/* View Toggles */}
                <div className="flex items-center bg-slate-100 p-1.5 rounded-xl ml-1 shrink-0 border border-slate-200/60">
                    <button className="p-2 bg-blue-600 text-white rounded-lg shadow-sm"><List size={16} strokeWidth={3} /></button>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><Grid size={16} strokeWidth={2} /></button>
                </div>
                </div>
            </div>
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default CrmFilters;
