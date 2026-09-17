import React from 'react';
import { Building2, Calendar, ArrowRight } from 'lucide-react';

const CrmLeadCard = ({ 
    lead, 
    onViewClick,
    onContactClick,
    getModeIcon, 
    getModeBg, 
    getStatusColor, 
    formatDateStr 
}) => {
    const mode = lead.logisticsDetails?.mode || '';
    
    return (
        <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group flex items-center gap-6 lg:gap-8 relative">
            
            {/* Mode Icon Left */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getModeBg(mode)}`}>
                {getModeIcon(mode, 28)}
            </div>
            
            {/* Client Info */}
            <div className="w-1/4 min-w-[200px]">
                <h3 className="text-lg font-black text-[#0B1E43] tracking-tight truncate group-hover:text-blue-700 transition-colors mb-1">
                    {lead.clientInfo?.name || 'Unknown Client'}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mb-3 truncate flex items-center gap-1.5">
                    <Building2 size={12}/> {lead.clientInfo?.company || 'Individual'}
                </p>
                <span className="inline-block px-3 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
                    Lead ID: #{lead.enquiryRefId}
                </span>
            </div>
            
            {/* Route Details */}
            <div className="w-[40%] flex flex-col justify-center min-w-[200px] flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-[#f4f7fc] border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm">IN</span>
                        <span className="text-sm font-black text-[#0B1E43] truncate" title={lead.logisticsDetails?.fromLocation}>
                            {lead.logisticsDetails?.fromLocation}
                        </span>
                    </div>
                    <div className="text-slate-300 shrink-0">
                        <ArrowRight size={16} strokeWidth={3} />
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 shrink-0 rounded-full bg-[#f4f7fc] border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm">AE</span>
                        <span className="text-sm font-black text-[#0B1E43] truncate" title={lead.logisticsDetails?.toLocation}>
                            {lead.logisticsDetails?.toLocation}
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-[#f4f7fc] text-blue-700 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-blue-100/50 whitespace-nowrap shrink-0">
                        {getModeIcon(mode, 12)} {mode ? `${mode} Freight` : 'Freight'}
                    </span>
                    {lead.logisticsDetails?.commodity && (
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold border border-slate-150 shadow-sm whitespace-normal break-words max-w-full leading-relaxed">
                            {lead.logisticsDetails.commodity}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Status, Date & Actions */}
            <div className="flex items-center justify-between gap-5 min-w-[280px] shrink-0">
                <div className="flex flex-col items-end">
                    <div className={`inline-block px-3.5 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase mb-2 shadow-sm ${getStatusColor(lead.status)}`}>
                        {lead.status}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Calendar size={12} /> {formatDateStr(lead.createdAt)}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onViewClick(lead)} 
                        className="px-5 py-2.5 rounded-xl border-2 border-blue-100 text-blue-600 font-extrabold text-xs hover:bg-blue-50 transition-all text-center focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                        View
                    </button>
                    <button 
                        onClick={() => onContactClick(lead)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                    >
                        Contact <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmLeadCard;
