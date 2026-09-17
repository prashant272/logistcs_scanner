import React from 'react';
import { Truck, Plane } from 'lucide-react';

const CrmHeader = ({ leadsCount }) => {
    return (
        <div className="bg-[#f8f9fa] rounded-[2rem] p-8 md:p-10 mb-4 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden border border-slate-100 shadow-sm">
            <div className="relative z-10 max-w-xl text-center lg:text-left mb-4 lg:mb-0">
                <span className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 shadow-sm border border-slate-100">CRM Module</span>
                <h1 className="text-3xl md:text-4xl font-black text-[#0B1E43] tracking-tight mb-4">CRM Pipeline</h1>
                <p className="text-sm md:text-base font-medium text-slate-500 leading-relaxed">
                    Manage and track all your active leads from around the world. Build better relationships and close deals faster.
                </p>
            </div>
            
            {/* Stats Card */}
            <div className="relative z-10 flex items-center bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-[240px]">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mr-5 shrink-0">
                    <Truck className="text-blue-600" size={28} />
                </div>
                <div>
                    <div className="text-3xl font-black text-[#0B1E43] leading-none mb-1">{leadsCount}</div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Leads</div>
                    <div className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                        <span className="text-lg leading-none">↑</span> +2 This Week
                    </div>
                </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute right-1/3 top-1/2 -translate-y-1/2 w-72 h-72 opacity-[0.03] pointer-events-none hidden xl:block">
                <div className="w-full h-full rounded-full border-4 border-[#0B1E43] border-dashed animate-[spin_30s_linear_infinite]"></div>
                <div className="absolute inset-8 rounded-full border-4 border-[#0B1E43] border-dotted animate-[spin_20s_linear_infinite_reverse]"></div>
                <Plane size={80} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0B1E43]" />
            </div>
        </div>
    );
};

export default CrmHeader;
