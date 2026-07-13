import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Search, Loader2, Trash2, Edit, AlertCircle, CheckCircle, FileText, ChevronLeft, ChevronRight, Save, X, Globe, UserCheck } from 'lucide-react';

const AdminEnquiriesTab = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const [editingEnq, setEditingEnq] = useState(null);
    const [editFormData, setEditFormData] = useState({ status: '', price: '' });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const observer = useRef();
    const lastEnquiryElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchEnquiries = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/enquiries?page=${page}&limit=10&search=${debouncedSearch}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (page === 1) {
                setEnquiries(res.data.enquiries);
            } else {
                setEnquiries(prev => [...prev, ...res.data.enquiries]);
            }
            setHasMore(res.data.page < res.data.pages);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch enquiries', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnquiries();
    }, [page, debouncedSearch]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) return;
        
        try {
            const token = sessionStorage.getItem('adminToken');
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/enquiries/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEnquiries();
        } catch (error) {
            alert('Failed to delete enquiry');
        }
    };

    const handleEditClick = (enq) => {
        setEditingEnq(enq._id);
        setEditFormData({ 
            status: enq.status || 'Pending',
            price: enq.price || ''
        });
    };

    const handleSaveEdit = async (id) => {
        try {
            const token = sessionStorage.getItem('adminToken');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/enquiries/${id}`, editFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingEnq(null);
            fetchEnquiries();
        } catch (error) {
            alert('Failed to update enquiry');
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Accepted': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">Accepted</span>;
            case 'Declined': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold">Declined</span>;
            case 'Completed': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">Completed</span>;
            default: return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">Pending</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manage Enquiries</h1>
                <p className="text-slate-500 font-bold mt-1">View, edit, and delete all enquiries across the platform.</p>
            </div>

            <div className="bg-white border-2 border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.04)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] outline-none text-sm font-bold text-slate-700 transition-all bg-slate-50"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Enquiry Info</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Route & Cargo</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status / Price</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {enquiries.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400 font-bold text-sm">No enquiries found.</td>
                                </tr>
                            ) : (
                                enquiries.map((enq, index) => {
                                    const isLast = index === enquiries.length - 1;
                                    return (
                                    <tr 
                                        key={enq._id} 
                                        ref={isLast ? lastEnquiryElementRef : null}
                                        className="hover:bg-blue-50/30 transition-colors"
                                    >
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                    <FileText size={14} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="mb-2">
                                                        {enq.isDirect ? (
                                                            <div className="inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg">
                                                                <Globe size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Marketplace Broadcast</span>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 bg-purple-50/80 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-lg">
                                                                <UserCheck size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]" title={enq.vendor?.name}>Targeted: {enq.vendor?.name || 'Unknown Vendor'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-black text-slate-800">{enq.guestName || enq.client?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-slate-500">{enq.guestEmail || enq.client?.email}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{new Date(enq.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-xs font-bold text-slate-700">
                                                <span className="text-[#0066FF]">{enq.fromLocation}</span> <span className="text-slate-400 mx-1">→</span> <span className="text-emerald-600">{enq.toLocation}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1">Cargo: {enq.type?.toUpperCase()} | Comm: {enq.commodity || 'N/A'}</p>
                                        </td>
                                        <td className="p-4 align-top">
                                            {editingEnq === enq._id ? (
                                                <div className="space-y-2">
                                                    <select 
                                                        value={editFormData.status} 
                                                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                                        className="w-full text-xs font-bold p-1.5 border border-slate-200 rounded-md outline-none"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Accepted">Accepted</option>
                                                        <option value="Declined">Declined</option>
                                                        <option value="Completed">Completed</option>
                                                    </select>
                                                    <input 
                                                        type="number"
                                                        placeholder="Price"
                                                        value={editFormData.price}
                                                        onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                                                        className="w-full text-xs font-bold p-1.5 border border-slate-200 rounded-md outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    {getStatusBadge(enq.status)}
                                                    {enq.price && <p className="text-xs font-black text-slate-700 mt-1.5">₹ {enq.price}</p>}
                                                    {enq.responses && enq.responses.filter(r => r.status === 'Accepted').length > 0 && (
                                                        <div className="mt-2 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                            <p className="font-bold text-slate-500 mb-1">Accepted by:</p>
                                                            {enq.responses.filter(r => r.status === 'Accepted').map((r, idx) => (
                                                                <p key={idx} className="font-black text-emerald-600 truncate max-w-[150px]" title={r.vendor?.name || 'Unknown Vendor'}>
                                                                    {r.vendor?.name || 'Unknown Vendor'}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-top text-right space-x-2">
                                            {editingEnq === enq._id ? (
                                                <>
                                                    <button onClick={() => handleSaveEdit(enq._id)} className="inline-flex p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-lg transition-colors" title="Save"><Save size={14} /></button>
                                                    <button onClick={() => setEditingEnq(null)} className="inline-flex p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors" title="Cancel"><X size={14} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditClick(enq)} className="inline-flex p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Edit"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(enq._id)} className="inline-flex p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center">
                                        <div className="flex justify-center"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
                                        <p className="text-slate-500 text-xs font-bold mt-2">Loading more enquiries...</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminEnquiriesTab;
