import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Search, Calendar, User, Building, Mail, CheckCircle, XCircle, AlertCircle, Eye, X } from 'lucide-react';
import api from '../../api/axios';

const AdminInquiryListing = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.get('/contact/admin/messages', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            setMessages(res.data || []);
        } catch (err) {
            console.error('Error fetching contact messages:', err);
            setError('Failed to fetch messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setStatusUpdating(id);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.put(`/contact/admin/${id}/status`, { status: newStatus }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            setMessages(prev => prev.map(m => m._id === id ? res.data : m));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status.');
        } finally {
            setStatusUpdating(null);
        }
    };

    const filteredMessages = messages.filter((m) => {
        const term = searchTerm.toLowerCase();
        return (
            (m.name || '').toLowerCase().includes(term) ||
            (m.organization || '').toLowerCase().includes(term) ||
            (m.email || '').toLowerCase().includes(term) ||
            (m.topic || '').toLowerCase().includes(term) ||
            (m.message || '').toLowerCase().includes(term) ||
            (m.userType || '').toLowerCase().includes(term)
        );
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-2">
                        <MessageSquare size={22} className="text-[#0066FF]" />
                        <span>Inquiry Listing</span>
                    </h2>
                    <p className="text-slate-600 font-extrabold text-xs mt-1">Review and manage messages submitted via the Contact page.</p>
                </div>
                <button 
                    onClick={fetchMessages} 
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border-2 border-slate-350 text-slate-900 text-xs font-black px-4.5 py-3 rounded-xl cursor-pointer transition-colors"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>REFRESH TABLE</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-[0_6px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                        <Search size={18} className="stroke-[3]" />
                    </span>
                    <input
                        type="text"
                        placeholder="SEARCH BY NAME, EMAIL, COMPANY, TOPIC OR MESSAGE..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#f8fafc] border-2 border-slate-300 rounded-xl text-xs font-black text-slate-950 uppercase placeholder-slate-500 focus:outline-none focus:border-[#0055ff] focus:ring-2 focus:ring-[#0055ff]/15 transition-all"
                    />
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-black rounded-xl border-2 border-slate-300 transition-colors uppercase cursor-pointer"
                    >
                        Clear Search
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 text-red-950 text-xs font-black p-4 rounded-xl border border-red-200 shadow-sm">
                    {error}
                </div>
            )}

            {/* Messages Table Container */}
            <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-[0_12px_45px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-200 border-b-2 border-slate-400 text-slate-950 text-[12px] font-black uppercase tracking-wider">
                                <th className="py-4 px-6 border-r-2 border-slate-300">Date</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Sender Info</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Topic</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Message</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300 text-center">Status</th>
                                <th className="py-4 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-300">
                            {loading && messages.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-[#0B1E43] font-black text-base uppercase tracking-widest">
                                        Loading Messages...
                                    </td>
                                </tr>
                            ) : filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-slate-900 font-black text-sm uppercase">
                                        No matching messages found.
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((m) => (
                                    <tr key={m._id} className="hover:bg-slate-100/80 transition-colors text-xs font-black text-slate-950">
                                        {/* Date */}
                                        <td className="py-4 px-6 border-r-2 border-slate-350 whitespace-nowrap text-slate-700">
                                            {formatDate(m.createdAt)}
                                        </td>

                                        {/* Sender Info */}
                                        <td className="py-4 px-6 border-r-2 border-slate-350">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${
                                                        m.userType === 'Vendor' ? 'bg-[#0055ff]' : 
                                                        m.userType === 'Client' ? 'bg-[#218838]' : 'bg-slate-600'
                                                    }`}>
                                                        {m.userType}
                                                    </span>
                                                    <span className="text-[#0B1E43] font-black text-[14px]">{m.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Building size={12} />
                                                    <span>{m.organization}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Mail size={12} />
                                                    <a href={`mailto:${m.email}`} className="hover:text-blue-600 transition-colors">{m.email}</a>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Topic */}
                                        <td className="py-4 px-6 border-r-2 border-slate-350 text-[#0066FF] font-bold">
                                            {m.topic === 'start' ? 'Start Shipping' : 
                                             m.topic === 'quote' ? 'Request Quote' : 
                                             m.topic === 'other' ? 'Other' : m.topic}
                                        </td>

                                        {/* Message */}
                                        <td className="py-4 px-6 border-r-2 border-slate-350 max-w-xs whitespace-normal break-words text-slate-700 leading-relaxed">
                                            {m.message ? (
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="line-clamp-2">{m.message}</span>
                                                    <button onClick={() => setSelectedMessage(m)} className="text-[#0066FF] hover:text-[#004acc] p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0 transition-colors shadow-sm" title="View Full Message">
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="italic text-slate-400">No message provided</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6 border-r-2 border-slate-350 text-center">
                                            <span className={`inline-block text-[11px] font-black uppercase px-3 py-1.5 rounded-xl text-white min-w-[85px] text-center shadow-sm ${
                                                m.status === 'Resolved' ? 'bg-[#218838]' : 
                                                m.status === 'Dismissed' ? 'bg-slate-500' : 'bg-[#e0a800] text-black'
                                            }`}>
                                                {m.status || 'Pending'}
                                            </span>
                                        </td>

                                        {/* Action Dropdown */}
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center">
                                                <select
                                                    disabled={statusUpdating === m._id}
                                                    value={m.status || 'Pending'}
                                                    onChange={(e) => handleStatusUpdate(m._id, e.target.value)}
                                                    className="bg-[#f0f4f8] border-2 border-slate-400 rounded-xl py-2.5 px-3 text-xs font-black text-slate-950 focus:outline-none cursor-pointer focus:ring-2 focus:ring-[#0055ff] transition-all hover:bg-slate-200"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Dismissed">Dismissed</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare size={18} className="text-[#0066FF]" />
                                Full Message
                            </h3>
                            <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-md shadow-sm border border-slate-200">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">From</span>
                                <div className="font-bold text-slate-900 mt-1">{selectedMessage.name}</div>
                                <div className="text-xs text-slate-500">{selectedMessage.email}</div>
                                <div className="text-xs text-slate-500">{selectedMessage.organization}</div>
                            </div>
                            <div className="mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Topic</span>
                                <div className="font-bold text-[#0066FF] mt-1">{selectedMessage.topic === 'start' ? 'Start Shipping' : selectedMessage.topic === 'quote' ? 'Request Quote' : selectedMessage.topic === 'other' ? 'Other' : selectedMessage.topic}</div>
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Message</span>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-1">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInquiryListing;
