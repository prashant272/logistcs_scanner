import React, { useState, useEffect } from 'react';
import { Mail, User, Clock, MessageSquare, Search, ChevronRight, Inbox, Eye } from 'lucide-react';
import api from '../../api/axios';

const VendorContactListTab = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const res = await api.get('/auth/vendor-contact/my');
                setInquiries(res.data || []);
            } catch (err) {
                console.error('Error fetching vendor contacts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInquiries();
    }, []);

    const filteredInquiries = inquiries.filter(inq => 
        inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-[#0B1E43] tracking-tight uppercase">Customer Inquiries</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Inquiries submitted by customers via your public network profile</p>
                </div>
                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={16} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search inquiries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/10 transition-all bg-slate-50 focus:bg-white text-slate-800"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">No Inquiries Found</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wide">You haven't received any customer messages yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inquiry List */}
                    <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredInquiries.map((inq) => (
                            <div 
                                key={inq._id} 
                                onClick={() => setSelectedInquiry(inq)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                                    selectedInquiry?._id === inq._id 
                                        ? 'bg-gradient-to-r from-blue-50/55 to-[#0066FF]/5 border-[#0066FF]/40 shadow-sm shadow-blue-100' 
                                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-[#0B1E43] text-sm">{inq.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1"><Mail size={12} /> {inq.email}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(inq.createdAt).toLocaleDateString('en-GB')}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-semibold line-clamp-1 mt-2">
                                        {inq.message}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 shrink-0 self-center" />
                            </div>
                        ))}
                    </div>

                    {/* Inquiry Detail View Panel */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[350px]">
                        {selectedInquiry ? (
                            <div className="space-y-5">
                                <div className="border-b border-slate-100 pb-4">
                                    <h4 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">Inquiry Details</h4>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="bg-[#0066FF]/10 p-2.5 rounded-xl text-[#0066FF]">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-extrabold text-[#0B1E43]">{selectedInquiry.name}</p>
                                            <p className="text-xs text-[#0066FF] font-semibold">{selectedInquiry.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Message Body</span>
                                    <div className="bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-700 leading-relaxed max-h-[220px] overflow-y-auto border border-slate-100">
                                        {selectedInquiry.message}
                                    </div>
                                </div>

                                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                                    <Clock size={12} />
                                    <span>Received: {new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center my-auto text-center text-slate-400 py-10">
                                <MessageSquare size={36} className="text-slate-300 mb-3" />
                                <p className="text-xs font-extrabold uppercase tracking-wider">Select an inquiry to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorContactListTab;
