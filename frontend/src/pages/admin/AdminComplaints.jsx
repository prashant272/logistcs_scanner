import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Search } from 'lucide-react';
import api from '../../api/axios';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllComplaints = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await api.get('/complaints/admin/all', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            setComplaints(res.data || []);
        } catch (err) {
            console.error('Error fetching admin complaints:', err);
            setError('Failed to fetch complaints list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllComplaints();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setStatusUpdating(id);
            setError('');
            setSuccess('');
            const token = localStorage.getItem('adminToken');
            
            const res = await api.put(`/complaints/admin/${id}/status`, { status: newStatus }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            setComplaints(prev => prev.map(c => c._id === id ? res.data : c));
            setSuccess(`Complaint status updated to ${newStatus} successfully.`);
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Failed to update complaint status.');
        } finally {
            setStatusUpdating(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        return { date: formattedDate, time: formattedTime };
    };

    const filteredComplaints = complaints.filter((c) => {
        const term = searchTerm.toLowerCase();
        const complaintId = (c.complaintId || '').toLowerCase();
        const clientName = (c.client?.name || '').toLowerCase();
        const clientCompany = (c.client?.company || '').toLowerCase();
        const vendorName = (c.vendor?.name || '').toLowerCase();
        const vendorCompany = (c.vendor?.company || '').toLowerCase();
        const subject = (c.subject || '').toLowerCase();
        const priority = (c.priority || '').toLowerCase();
        const status = (c.status || '').toLowerCase();
        const clientRole = (c.client?.role || 'customer').toLowerCase();
        const vendorRole = (c.vendor?.role || 'vendor').toLowerCase();

        return (
            complaintId.includes(term) ||
            clientName.includes(term) ||
            clientCompany.includes(term) ||
            vendorName.includes(term) ||
            vendorCompany.includes(term) ||
            subject.includes(term) ||
            priority.includes(term) ||
            status.includes(term) ||
            clientRole.includes(term) ||
            vendorRole.includes(term)
        );
    });

    return (
        <div className="space-y-6 font-sans">
            {/* Header section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-2">
                        <AlertCircle size={22} className="text-[#0066FF]" />
                        <span>All Complaints & Disputes</span>
                    </h2>
                    <p className="text-slate-600 font-extrabold text-xs mt-1">Review, audit, and resolve disputes between carriers and shippers.</p>
                </div>
                <button 
                    onClick={fetchAllComplaints} 
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border-2 border-slate-350 text-slate-900 text-xs font-black px-4.5 py-3 rounded-xl cursor-pointer transition-colors"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>REFRESH TABLE</span>
                </button>
            </div>

            {/* Search and Filters Control bar */}
            <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-[0_6px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-700">
                        <Search size={18} className="stroke-[3]" />
                    </span>
                    <input
                        type="text"
                        placeholder="SEARCH BY ID, NAME, SUBJECT, PRIORITY OR STATUS..."
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

            {/* Banner Notifications */}
            {error && (
                <div className="bg-red-100 text-red-950 text-xs font-black p-4 rounded-xl border border-red-200 shadow-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-100 text-green-950 text-xs font-black p-4 rounded-xl border border-green-200 shadow-sm">
                    {success}
                </div>
            )}

            {/* Complaints Management Table Container */}
            <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-[0_12px_45px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-200 border-b-2 border-slate-400 text-slate-950 text-[12px] font-black uppercase tracking-wider">
                                <th className="py-4 px-6 border-r-2 border-slate-300">Complaint No</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Complaint By</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Complaint Against</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Subject</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Priority</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Status</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">File</th>
                                <th className="py-4 px-6 border-r-2 border-slate-300">Date</th>
                                <th className="py-4 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-300">
                            {loading && complaints.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-16 text-center text-[#0B1E43] font-black text-base uppercase tracking-widest">
                                        Loading Complaints...
                                    </td>
                                </tr>
                            ) : filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-16 text-center text-slate-900 font-black text-sm uppercase">
                                        No matching complaints found.
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((c) => {
                                    const clientRole = c.client?.role || 'customer';
                                    const vendorRole = c.vendor?.role || 'vendor';
                                    const dateInfo = formatDate(c.createdAt);

                                    return (
                                        <tr key={c._id} className="hover:bg-slate-100/80 transition-colors text-xs font-black text-slate-950">
                                            {/* Complaint No */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 font-black text-[#0B1E43] text-sm bg-slate-50/50">
                                                {c.complaintId || 'CMP-00000'}
                                            </td>

                                            {/* Complaint By */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded text-white ${
                                                        clientRole === 'vendor' 
                                                            ? 'bg-[#0055ff]' 
                                                            : 'bg-[#218838]'
                                                    }`}>
                                                        {clientRole === 'vendor' ? 'Vendor' : 'Customer'}
                                                    </span>
                                                    <span className="text-[#0B1E43] font-black text-[14px] leading-tight block">{c.client?.company || c.client?.name || 'Unknown'}</span>
                                                </div>
                                            </td>

                                            {/* Complaint Against */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <span className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded text-white ${
                                                        vendorRole === 'vendor' 
                                                            ? 'bg-[#c82333]' 
                                                            : 'bg-[#218838]'
                                                    }`}>
                                                        {vendorRole === 'vendor' ? 'Vendor' : 'Customer'}
                                                    </span>
                                                    <span className="text-[#0B1E43] font-black text-[14px] leading-tight block">{c.vendor?.company || c.vendor?.name || 'Unknown'}</span>
                                                </div>
                                            </td>

                                            {/* Subject */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 text-[#0B1E43] font-black text-[13px] max-w-[200px] whitespace-normal break-words">
                                                {c.subject}
                                            </td>

                                            {/* Priority */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 text-center">
                                                <span className={`inline-block text-[11px] font-black uppercase px-3 py-1.5 rounded-xl text-white min-w-[85px] text-center shadow-sm ${
                                                    c.priority === 'High' 
                                                        ? 'bg-[#c82333]'
                                                        : c.priority === 'Medium'
                                                        ? 'bg-[#e0a800] text-black'
                                                        : 'bg-[#17a2b8]'
                                                }`}>
                                                    {c.priority || 'Medium'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 text-center">
                                                <span className={`inline-block text-[11px] font-black uppercase px-3 py-1.5 rounded-xl text-white min-w-[85px] text-center shadow-sm ${
                                                    c.status === 'Resolved' 
                                                        ? 'bg-[#218838]'
                                                        : c.status === 'Rejected'
                                                        ? 'bg-[#c82333]'
                                                        : 'bg-[#e0a800] text-black'
                                                }`}>
                                                    {c.status || 'Pending'}
                                                </span>
                                            </td>

                                            {/* File */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 text-center">
                                                {c.screenshot ? (
                                                    <a 
                                                        href={c.screenshot} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-[#0055ff] hover:text-[#003bb3] underline font-black uppercase text-[11px] hover:scale-105 inline-block transition-transform"
                                                    >
                                                        View File
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-500 font-black uppercase text-[10px]">No File</span>
                                                )}
                                            </td>

                                            {/* Date */}
                                            <td className="py-4 px-6 border-r-2 border-slate-350 text-slate-950 font-black whitespace-nowrap text-[12px]">
                                                <div className="font-black text-slate-950">{dateInfo.date}</div>
                                                <div className="text-slate-600 font-extrabold text-[10px] mt-0.5">{dateInfo.time}</div>
                                            </td>

                                            {/* Action Status Updater Dropdown */}
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center">
                                                    <select
                                                        disabled={statusUpdating === c._id}
                                                        value={c.status || 'Pending'}
                                                        onChange={(e) => handleStatusUpdate(c._id, e.target.value)}
                                                        className="bg-[#f0f4f8] border-2 border-slate-400 rounded-xl py-2.5 px-3 text-xs font-black text-slate-950 focus:outline-none cursor-pointer focus:ring-2 focus:ring-[#0055ff] transition-all hover:bg-slate-200"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Resolved">Resolved</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminComplaints;
