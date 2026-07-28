import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle2, XCircle, Clock, Loader2, IndianRupee, ExternalLink } from 'lucide-react';

const AdminRechargeRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modals state
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approve', 'reject'
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/recharge-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data || []);
        } catch (err) {
            console.error('Fetch recharge requests error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionSubmit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const token = sessionStorage.getItem('adminToken');
            
            const payload = { status: actionType === 'approve' ? 'Approved' : 'Rejected' };
            if (actionType === 'reject') {
                payload.rejectionReason = rejectionReason;
            }

            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/recharge-requests/${selectedRequest._id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSelectedRequest(null);
            setRejectionReason('');
            fetchRequests();
            alert(`Request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            console.error('Action error:', err);
            alert(err.response?.data?.message || 'Failed to process request');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Recharge Requests</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Manage vendor wallet top-up requests</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proof</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {requests.length > 0 ? (
                                requests.map((req) => (
                                    <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-slate-600 font-medium">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                            <div className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{req.vendor?.organizationName}</div>
                                            <div className="text-xs text-slate-500">LSID: {req.vendor?.lsid}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                                                {req.paymentMethod === 'Bank' ? <CreditCard size={12}/> : <Clock size={12}/>}
                                                {req.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-4 font-black text-slate-800">
                                            <div className="flex items-center">
                                                <IndianRupee size={14} className="text-slate-400 mr-0.5"/>
                                                {req.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {req.screenshot ? (
                                                <a href={req.screenshot} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                    <ExternalLink size={14} /> View Proof
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-medium">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            {req.status === 'Rejected' && req.rejectionReason && (
                                                <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate mx-auto" title={req.rejectionReason}>
                                                    {req.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'Pending' && req.paymentMethod === 'Bank' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setActionType('approve'); }}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setActionType('reject'); }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                                        No recharge requests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-[#0B1E43] capitalize">
                                {actionType} Request
                            </h3>
                            <button 
                                onClick={() => { setSelectedRequest(null); setRejectionReason(''); }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleActionSubmit} className="p-6">
                            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vendor Details</p>
                                <p className="font-bold text-slate-800">{selectedRequest.vendor?.organizationName}</p>
                                <p className="text-sm text-slate-600 mt-1 flex items-center">
                                    Amount: <IndianRupee size={12} className="ml-1 mr-0.5"/> 
                                    <span className="font-black text-slate-800">{selectedRequest.amount.toLocaleString()}</span>
                                </p>
                            </div>

                            {actionType === 'reject' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Rejection Reason
                                    </label>
                                    <textarea
                                        required
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all"
                                        placeholder="Why is this request being rejected?"
                                        rows="3"
                                    />
                                </div>
                            )}

                            {actionType === 'approve' && (
                                <p className="text-sm font-bold text-slate-600 mb-6 text-center">
                                    Are you sure you want to approve this request? This will instantly add funds to the vendor's wallet.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedRequest(null); setRejectionReason(''); }}
                                    className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`w-full text-white px-4 py-3 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2 ${
                                        actionType === 'approve' 
                                            ? 'bg-green-600 hover:bg-green-700' 
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirm {actionType}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRechargeRequests;
