import React from 'react';
import { X, Building2, Phone, Mail, Package, MapPin, Calendar, Clock, Edit3, Check, MessageSquare, Eye, Info } from 'lucide-react';

const CrmDetailModal = ({
    selectedLead,
    setSelectedLead,
    statuses,
    isUpdating,
    handleUpdateStatus,
    getStatusColor,
    getModeBg,
    getModeIcon,
    onContactClick
}) => {
    if (!selectedLead) return null;

    const initials = (selectedLead.clientInfo?.name || 'Unknown Client').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedLead(null)}
            ></div>
            
            {/* Panel */}
            <div className="relative w-full max-w-3xl bg-[#f8f9fb] shadow-2xl h-full overflow-hidden flex flex-col animate-slideInRight">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Eye size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#0B1E43] tracking-tight">View Lead</h2>
                            <p className="text-sm font-medium text-slate-500">Lead details and activity information</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedLead(null)} 
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
                    
                    {/* Client Info Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 font-bold text-xl flex items-center justify-center shrink-0">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-[#0B1E43]">
                                        {selectedLead.clientInfo?.name || 'Unknown Client'}
                                    </h3>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                        #{selectedLead.enquiryRefId}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedLead.clientInfo?.company && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Building2 size={14} className="text-blue-500" />
                                            {selectedLead.clientInfo.company}
                                        </div>
                                    )}
                                    {selectedLead.clientInfo?.phone && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Phone size={14} className="text-emerald-500" />
                                            {selectedLead.clientInfo.phone}
                                        </div>
                                    )}
                                    {selectedLead.clientInfo?.email && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Mail size={14} className="text-purple-500" />
                                            {selectedLead.clientInfo.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stage</span>
                            <div className="relative group">
                                <select 
                                    value={selectedLead.status}
                                    onChange={(e) => handleUpdateStatus(selectedLead._id, e.target.value)}
                                    disabled={isUpdating}
                                    className="appearance-none outline-none font-bold text-sm text-blue-600 bg-white border border-blue-200 px-4 py-2 pr-10 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors uppercase tracking-wide"
                                >
                                    {statuses.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                                    <Edit3 size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Requirement Details */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E43] mb-6 flex items-center gap-2">
                            <Package size={16} className="text-blue-500" strokeWidth={2.5} /> Requirement Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Route */}
                            <div className="bg-[#f8f9fb] p-5 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Route</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-[#0B1E43] flex items-center gap-3">
                                        <MapPin size={18} className="text-blue-500 shrink-0" />
                                        <span className="truncate">{selectedLead.logisticsDetails?.fromLocation}</span>
                                    </p>
                                    <div className="h-6 border-l-2 border-dotted border-slate-300 ml-[9px] my-1"></div>
                                    <p className="text-sm font-bold text-[#0B1E43] flex items-center gap-3">
                                        <MapPin size={18} className="text-emerald-500 shrink-0" />
                                        <span className="truncate">{selectedLead.logisticsDetails?.toLocation}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#f8f9fb] p-5 rounded-2xl flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mode</p>
                                    <p className="text-sm font-bold text-[#0B1E43] flex items-center gap-2">
                                        {getModeIcon(selectedLead.logisticsDetails?.mode, 18)}
                                        <span className="capitalize">{selectedLead.logisticsDetails?.mode || 'N/A'}</span>
                                    </p>
                                </div>
                                <div className="bg-[#f8f9fb] p-5 rounded-2xl flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Commodity</p>
                                    <p className="text-sm font-bold text-[#0B1E43] truncate">{selectedLead.logisticsDetails?.commodity || '-'}</p>
                                </div>
                                <div className="bg-[#f8f9fb] p-5 rounded-2xl flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Weight/Qty</p>
                                    <p className="text-sm font-bold text-[#0B1E43] truncate">{selectedLead.logisticsDetails?.weight || '-'}</p>
                                </div>
                                <div className="bg-[#f8f9fb] p-5 rounded-2xl flex flex-col justify-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Target Date</p>
                                    <p className="text-sm font-bold text-[#0B1E43] flex items-center gap-2 truncate">
                                        <Calendar size={16} className="text-blue-500 shrink-0" />
                                        {selectedLead.logisticsDetails?.dateOfShipment || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex-1 flex flex-col">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E43] mb-8 flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" strokeWidth={2.5} /> Activity Timeline
                        </h3>

                        <div className="flex-1 pr-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-blue-500">
                            {selectedLead.timeline?.map((event, idx) => (
                                <div key={idx} className="relative pl-10 mb-8 last:mb-0 group">
                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${event.type === 'followup' ? 'bg-amber-500' : event.type === 'note' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <h4 className="text-sm font-bold text-[#0B1E43]">{event.title}</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                                                {new Date(event.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 bg-[#f8f9fb] px-5 py-4 rounded-xl border border-slate-100">
                                            {event.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Info Alert */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-blue-700">
                        <Info size={20} className="shrink-0" />
                        <span className="text-sm font-medium">Only available information is shown for this lead.</span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between z-10">
                    <button 
                        onClick={() => setSelectedLead(null)}
                        className="bg-[#f0f2f5] hover:bg-slate-200 text-slate-700 font-bold text-sm px-8 py-3 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => {
                            const lead = selectedLead;
                            setSelectedLead(null);
                            onContactClick(lead);
                        }}
                        className="bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2"
                    >
                        <Edit3 size={18} />
                        Edit Lead
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmDetailModal;
