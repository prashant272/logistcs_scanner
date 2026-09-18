import React, { useState } from 'react';
import { Clock, AlertCircle, PhoneCall, Calendar, MapPin, X, ArrowRight } from 'lucide-react';

const FollowupDashboardCards = ({ todaysFollowUps = [], missedFollowUps = [], onContactClick }) => {
    const [activeModal, setActiveModal] = useState(null); // 'today' | 'missed' | null

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const renderListModal = () => {
        if (!activeModal) return null;

        const isToday = activeModal === 'today';
        const leads = isToday ? todaysFollowUps : missedFollowUps;
        const title = isToday ? "Today's Follow-ups" : "Missed Follow-ups";
        const icon = isToday ? <Clock className="text-blue-600" size={24} /> : <AlertCircle className="text-rose-600" size={24} />;
        const bgIcon = isToday ? 'bg-blue-50' : 'bg-rose-50';

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
                <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full ${bgIcon} flex items-center justify-center`}>
                                {icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#0B1E43]">{title}</h2>
                                <p className="text-sm font-medium text-slate-500">{leads.length} leads found</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-4">
                        {leads.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-400 font-medium text-lg">No leads in this list.</p>
                            </div>
                        ) : (
                            leads.map(lead => (
                                <div key={lead._id} className={`border p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:shadow-md ${isToday ? 'bg-slate-50 border-slate-200 hover:border-blue-300' : 'bg-rose-50/30 border-rose-100 hover:border-rose-300'}`}>
                                    <div>
                                        <h4 className="font-bold text-[#0B1E43] text-base mb-1.5">{lead.clientInfo?.company || lead.clientInfo?.name}</h4>
                                        <div className={`flex items-center gap-2 text-xs font-bold ${isToday ? 'text-slate-500' : 'text-rose-500'}`}>
                                            {isToday ? <Calendar size={14} className="text-blue-500" /> : <Clock size={14} />}
                                            <span>{isToday ? formatDate(lead.followUpDate) : `Overdue since ${formatDate(lead.followUpDate)}`}</span>
                                            
                                            {isToday && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                                                    <MapPin size={14} className="text-emerald-500" />
                                                    <span className="truncate max-w-[150px]">{lead.logisticsDetails?.toLocation}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setActiveModal(null);
                                            onContactClick(lead);
                                        }}
                                        className={`font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-2 ${isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-rose-600 text-white hover:bg-rose-700'}`}
                                    >
                                        {isToday ? 'Contact Now' : 'Action Required'} <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Today's Follow-ups Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Clock className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#0B1E43] mb-0.5">Today's Follow-ups</h3>
                        <p className="text-sm font-bold text-slate-500">
                            <span className="text-blue-600 text-base">{todaysFollowUps.length}</span> Pending
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveModal('today')}
                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-sm flex items-center gap-2"
                >
                    View List <ArrowRight size={16} />
                </button>
            </div>

            {/* Missed Follow-ups Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-300 transition-all relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-50 rounded-full opacity-50 pointer-events-none"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <AlertCircle className="text-rose-600" size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#0B1E43] mb-0.5">Missed Follow-ups</h3>
                        <p className="text-sm font-bold text-slate-500">
                            <span className="text-rose-600 text-base">{missedFollowUps.length}</span> Overdue
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveModal('missed')}
                    className="p-3 relative z-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold text-sm flex items-center gap-2"
                >
                    View List <ArrowRight size={16} />
                </button>
            </div>
            
            {renderListModal()}

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

export default FollowupDashboardCards;
