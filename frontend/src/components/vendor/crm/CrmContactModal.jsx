import React, { useState } from 'react';
import { 
    X, Phone, Mail, MapPin, Building, Building2, Package, 
    Weight, Calendar, FileText, Check, ArrowRight, Activity, Clock, FileInput, CheckCircle2, MessageSquare, Briefcase, Info, List, Plus, PlayCircle, Edit3, PhoneCall, MessageCircle, AlertCircle, Phone as PhoneIcon
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

const CrmContactModal = ({
    selectedContactLead,
    setSelectedContactLead,
    statuses,
    isUpdating,
    handleUpdateStatus,
    newNote,
    setNewNote,
    handleAddNote,
    handleScheduleFollowUp
}) => {
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');

    if (!selectedContactLead) return null;

    const initials = (selectedContactLead.clientInfo?.name || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const getStatusColor = (status) => {
        switch(status) {
            case 'New': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Contacted': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Negotiating': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Closed-Won': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Closed-Lost': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const handleSchedule = () => {
        if (!followUpDate || !followUpTime) return;
        const dateTimeStr = `${followUpDate}T${followUpTime}`;
        const dateObj = new Date(dateTimeStr);
        handleScheduleFollowUp(selectedContactLead._id, dateObj.toISOString());
        setFollowUpDate('');
        setFollowUpTime('');
    };



    const handleWhatsAppClick = () => {
        const phone = selectedContactLead.clientInfo?.phone;
        if (phone) {
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    };

    const handleCallClick = () => {
        const phone = selectedContactLead.clientInfo?.phone;
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    const handleEmailClick = () => {
        const email = selectedContactLead.clientInfo?.email;
        if (email) {
            window.location.href = `mailto:${email}`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setSelectedContactLead(null)}
            ></div>
            
            {/* Panel */}
            <div className="relative w-full max-w-3xl bg-[#f8f9fb] shadow-2xl h-full overflow-hidden flex flex-col animate-slideInRight">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <PhoneIcon size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#0B1E43] tracking-tight">Contact Lead</h2>
                            <p className="text-sm font-medium text-slate-500">Reach out to the customer and manage this lead</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedContactLead(null)} 
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
                                        {selectedContactLead.clientInfo?.name || 'Unknown Client'}
                                    </h3>
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                        #{selectedContactLead.enquiryRefId}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedContactLead.clientInfo?.company && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Building2 size={14} className="text-blue-500" />
                                            {selectedContactLead.clientInfo.company}
                                        </div>
                                    )}
                                    {selectedContactLead.clientInfo?.phone && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Phone size={14} className="text-emerald-500" />
                                            {selectedContactLead.clientInfo.phone}
                                        </div>
                                    )}
                                    {selectedContactLead.clientInfo?.email && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
                                            <Mail size={14} className="text-purple-500" />
                                            {selectedContactLead.clientInfo.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 sm:items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stage</span>
                            <div className="relative group">
                                <select 
                                    value={selectedContactLead.status}
                                    onChange={(e) => handleUpdateStatus(selectedContactLead._id, e.target.value)}
                                    disabled={isUpdating}
                                    className={`appearance-none outline-none font-bold text-sm px-4 py-2 pr-10 rounded-xl cursor-pointer transition-colors uppercase tracking-wide border ${getStatusColor(selectedContactLead.status)}`}
                                >
                                    {statuses.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                                    <Edit3 size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-sm font-bold text-[#0B1E43] mb-3 flex items-center gap-2">
                            <PhoneCall size={16} className="text-blue-600" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button 
                                onClick={handleWhatsAppClick}
                                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-emerald-100 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                    <FaWhatsapp size={22} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-emerald-700">Chat on WhatsApp</p>
                                    <p className="text-xs text-emerald-600/80">Open WhatsApp</p>
                                </div>
                            </button>
                            <button 
                                onClick={handleCallClick}
                                className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-blue-100 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                    <Phone size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-blue-700">Call Customer</p>
                                    <p className="text-xs text-blue-600/80">{selectedContactLead.clientInfo?.phone || 'No Number'}</p>
                                </div>
                            </button>
                            <button 
                                onClick={handleEmailClick}
                                className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-purple-100 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                    <Mail size={20} />
                                </div>
                                <div className="text-left truncate">
                                    <p className="text-sm font-bold text-purple-700">Send Email</p>
                                    <p className="text-xs text-purple-600/80 truncate w-24">{selectedContactLead.clientInfo?.email || 'No Email'}</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Status & Follow up */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Update */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0B1E43] mb-1 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600" /> Lead Status
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">Update the current status of this lead</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={selectedContactLead.status}
                                    onChange={(e) => handleUpdateStatus(selectedContactLead._id, e.target.value)}
                                    disabled={isUpdating}
                                    className="w-full appearance-none outline-none font-bold text-sm text-[#0B1E43] bg-white border border-slate-200 px-4 py-3 pr-10 rounded-xl cursor-pointer hover:border-slate-300 transition-colors uppercase"
                                >
                                    {statuses.map(st => (
                                        <option key={st} value={st}>{st}</option>
                                    ))}
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600"></div>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Follow up */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-[#0B1E43] mb-1 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-600" /> Schedule Follow-up
                            </h3>
                            <p className="text-xs text-slate-500 mb-4">Set a follow-up date and time</p>
                            
                            <div className="flex gap-3 mb-3">
                                <div className="flex-1 relative">
                                    <input 
                                        type="date"
                                        value={followUpDate}
                                        onChange={(e) => setFollowUpDate(e.target.value)}
                                        className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <input 
                                        type="time"
                                        value={followUpTime}
                                        onChange={(e) => setFollowUpTime(e.target.value)}
                                        className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleSchedule}
                                disabled={!followUpDate || !followUpTime || isUpdating}
                                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Calendar size={16} /> Schedule Follow-up
                            </button>
                        </div>
                    </div>

                    {/* Add Note */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-[#0B1E43] mb-1 flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" /> Add Note
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Add any information about the conversation, requirement or next steps</p>
                        <div className="flex gap-4">
                            <textarea 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Type your note here..."
                                className="flex-1 min-h-[80px] bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 resize-none"
                            ></textarea>
                            <button 
                                onClick={handleAddNote}
                                disabled={!newNote.trim() || isUpdating}
                                className="w-32 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 font-bold text-sm rounded-xl transition-colors flex flex-col items-center justify-center gap-2"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                    <Plus size={14} strokeWidth={3} />
                                </div>
                                Add Note
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-bold text-[#0B1E43] mb-1 flex items-center gap-2">
                            <Clock size={16} className="text-blue-600" strokeWidth={2.5} /> Activity Timeline
                        </h3>
                        <p className="text-xs text-slate-500 mb-8">Recent activities for this lead</p>

                        <div className="pr-4 relative before:absolute before:inset-y-0 before:left-[9px] before:w-0.5 before:bg-slate-200">
                            {selectedContactLead.timeline?.map((event, idx) => (
                                <div key={idx} className="relative pl-8 mb-6 last:mb-0 group">
                                    <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${event.type === 'followup' ? 'bg-amber-500' : event.type === 'note' ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-sm font-bold text-[#0B1E43]">{event.title}</h4>
                                            <span className="text-xs font-medium text-slate-500">
                                                {new Date(event.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                            {/* Empty state visual */}
                            <div className="relative pl-8 mt-6">
                                <div className="absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm bg-slate-300 z-10"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#0B1E43] mb-1">No further activity yet</h4>
                                    <p className="text-sm text-slate-500">Actions like <strong className="font-semibold">call</strong>, <strong className="font-semibold">message</strong>, or <strong className="font-semibold">follow-up</strong> will appear here.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between z-10">
                    <button 
                        onClick={() => setSelectedContactLead(null)}
                        className="bg-[#f0f2f5] hover:bg-slate-200 text-slate-700 font-bold text-sm px-8 py-3 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => handleUpdateStatus(selectedContactLead._id, 'Closed-Lost')}
                            disabled={isUpdating}
                            className="bg-white border-2 border-rose-100 hover:border-rose-200 disabled:opacity-50 text-rose-600 font-bold text-sm px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <X size={16} /> Mark as Lost
                        </button>
                        <button 
                            onClick={() => handleUpdateStatus(selectedContactLead._id, 'Closed-Won')}
                            disabled={isUpdating}
                            className="bg-[#0052FF] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-colors flex items-center gap-2"
                        >
                            <Check size={16} strokeWidth={3} /> Mark as Converted
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChevronDownIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

export default CrmContactModal;
