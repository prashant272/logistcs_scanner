import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle2, XCircle, Clock, Loader2, IndianRupee, Wallet } from 'lucide-react';

const AdminInvoiceRequests = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modals state
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'pay', 'penalty', 'approve_repayment'
    const [formData, setFormData] = useState({
        rejectionReason: '',
        approvedAmount: '',
        timelineDate: '',
        paymentProofFile: '',
        penaltyAmount: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoices(res.data || []);
        } catch (err) {
            console.error('Fetch invoices error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const token = localStorage.getItem('adminToken');
            
            if (actionType === 'reject') {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/status`, {
                    status: 'Rejected',
                    rejectionReason: formData.rejectionReason
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else if (actionType === 'approve') {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/status`, {
                    status: 'Approved',
                    approvedAmount: parseFloat(formData.approvedAmount),
                    timelineDate: formData.timelineDate
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else if (actionType === 'pay') {
                if (!formData.paymentProofFile) {
                    throw new Error('Payment proof file is required');
                }

                // Upload file to backend
                const formDataUpload = new FormData();
                formDataUpload.append('file', formData.paymentProofFile);

                const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formDataUpload, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const uploadedProofUrl = uploadRes.data.url;
                
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/pay`, {
                    paymentProofFile: uploadedProofUrl
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else if (actionType === 'penalty') {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/penalty`, {
                    penaltyAmount: parseFloat(formData.penaltyAmount)
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else if (actionType === 'approve_repayment') {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/approve-repayment`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Close modal & refresh
            setSelectedInvoice(null);
            setActionType('');
            setFormData({ rejectionReason: '', approvedAmount: '', timelineDate: '', paymentProofFile: '', penaltyAmount: '' });
            fetchInvoices();
        } catch (err) {
            console.error('Action error:', err);
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const openModal = (invoice, type) => {
        setSelectedInvoice(invoice);
        setActionType(type);
        if (type === 'approve') {
            setFormData({ ...formData, approvedAmount: invoice.amount });
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Approved': return 'bg-blue-100 text-blue-700';
            case 'Paid': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Repayment Pending': return 'bg-orange-100 text-orange-700';
            case 'Cleared': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Invoice Requests</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Review, approve, and pay vendor invoices</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600">
                        <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6">Vendor Details</th>
                                <th className="p-4">Bank Details</th>
                                <th className="p-4">Amount / Invoice</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4">Timeline / Details</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading requests...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No invoice requests found.</td></tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#0B1E43]">{inv.vendorName || inv.vendor?.name}</span>
                                                <span className="text-[10px] text-slate-500 font-semibold mt-0.5">LS ID: {inv.lsId}</span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{inv.vendor?.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-700">{inv.bankDetails?.accountName}</span>
                                                <span className="text-slate-500">Acc: {inv.bankDetails?.accountNo}</span>
                                                <span className="text-slate-500 uppercase">IFSC: {inv.bankDetails?.ifscCode}</span>
                                                <span className="text-slate-400 text-[9px]">{inv.bankDetails?.branchName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm font-black text-[#0066FF] flex items-center">
                                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                    {inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                                <a href={inv.invoiceFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#0066FF] hover:text-[#0052cc] text-[10px] font-black uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md w-fit">
                                                    <FileText className="w-3 h-3" /> View Doc
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {inv.status === 'Approved' && inv.timelineDate && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-slate-700 font-black">Timeline:</span>
                                                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                                                        {new Date(inv.timelineDate).toLocaleDateString()}
                                                    </span>
                                                    {inv.penaltyAmount > 0 && (
                                                        <span className="text-[10px] text-red-600 font-bold mt-1">Penalty: ₹{inv.penaltyAmount}</span>
                                                    )}
                                                </div>
                                            )}
                                            {inv.status === 'Paid' && inv.paymentProofFile && (
                                                <a href={inv.paymentProofFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-black uppercase tracking-wider mt-1 transition-colors w-fit">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Proof
                                                </a>
                                            )}
                                            {inv.status === 'Rejected' && inv.rejectionReason && (
                                                <div className="text-[10px] text-red-500 max-w-[150px] truncate" title={inv.rejectionReason}>
                                                    Reason: {inv.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-2 items-center">
                                                {inv.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => openModal(inv, 'approve')} className="w-full bg-[#0066FF] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#0052cc] transition-colors">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => openModal(inv, 'reject')} className="w-full bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors">
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {inv.status === 'Approved' && (
                                                    <>
                                                        <button onClick={() => openModal(inv, 'pay')} className="w-full bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20">
                                                            Upload Pay Proof
                                                        </button>
                                                        <button onClick={() => openModal(inv, 'penalty')} className="w-full bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-amber-200 transition-colors mt-1">
                                                            Apply Penalty
                                                        </button>
                                                    </>
                                                )}
                                                {inv.status === 'Repayment Pending' && (
                                                    <button onClick={() => openModal(inv, 'approve_repayment')} className="w-full bg-[#0066FF] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#0052cc] transition-colors shadow-sm shadow-blue-600/20">
                                                        Verify Repayment
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-[#0B1E43]">
                                {actionType === 'approve' ? 'Approve Invoice' : actionType === 'reject' ? 'Reject Invoice' : actionType === 'penalty' ? 'Apply Penalty' : actionType === 'approve_repayment' ? 'Verify Repayment' : 'Upload Payment Proof'}
                            </h3>
                            <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAction} className="p-6 space-y-5">
                            {actionType === 'reject' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Rejection Reason</label>
                                    <textarea
                                        value={formData.rejectionReason}
                                        onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-red-500 transition-colors resize-none h-24"
                                        placeholder="Why are you rejecting this invoice?"
                                        required
                                    />
                                </div>
                            )}

                            {actionType === 'approve' && (
                                <>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex flex-col gap-1 mb-4">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Requested Amount</span>
                                        <span className="text-xl font-black text-[#0B1E43] flex items-center">
                                            <IndianRupee className="w-5 h-5 mr-0.5 text-blue-400" />
                                            {selectedInvoice.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Approved Amount (Deducted from Wallet)</label>
                                        <input
                                            type="number"
                                            value={formData.approvedAmount}
                                            onChange={(e) => setFormData({...formData, approvedAmount: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Timeline / Deadline Date</label>
                                        <input
                                            type="date"
                                            value={formData.timelineDate}
                                            onChange={(e) => setFormData({...formData, timelineDate: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {actionType === 'pay' && (
                                <>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                            <span className="text-xs font-bold text-slate-500">Pay to Account</span>
                                            <span className="text-sm font-black text-[#0B1E43]">{selectedInvoice.bankDetails.accountNo}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                            <span className="text-xs font-bold text-slate-500">IFSC Code</span>
                                            <span className="text-sm font-black text-[#0B1E43]">{selectedInvoice.bankDetails.ifscCode}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">Amount</span>
                                            <span className="text-sm font-black text-green-600 flex items-center">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                {selectedInvoice.approvedAmount?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Attach Payment Proof</label>
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                setFormData({...formData, paymentProofFile: e.target.files[0]})
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-green-500 transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                                            accept=".pdf,image/*"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {actionType === 'penalty' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Penalty Amount (Deducted from Wallet)</label>
                                    <input
                                        type="number"
                                        value={formData.penaltyAmount}
                                        onChange={(e) => setFormData({...formData, penaltyAmount: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Enter penalty amount"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-2 font-semibold">This amount will be deducted directly from the vendor's wallet balance.</p>
                                </div>
                            )}

                            {actionType === 'approve_repayment' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                        <p className="text-sm font-bold text-slate-600 mb-2">Vendor Uploaded Payment Proof</p>
                                        <a href={selectedInvoice.repaymentProofFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-black text-xs hover:bg-blue-100 transition-colors">
                                            <FileText className="w-4 h-4" /> View Screenshot
                                        </a>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-700 text-center">
                                            Confirming this will mark the invoice as <span className="font-black uppercase">Cleared</span> and restore <span className="font-black">₹{((selectedInvoice.approvedAmount || selectedInvoice.amount) + selectedInvoice.penaltyAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> to the vendor's wallet.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(null)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-3 rounded-xl font-black text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                                        actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        actionType === 'pay' ? 'bg-green-600 hover:bg-green-700' :
                                        actionType === 'penalty' ? 'bg-amber-600 hover:bg-amber-700' :
                                        actionType === 'approve_repayment' ? 'bg-[#0066FF] hover:bg-[#0052cc]' :
                                        'bg-[#0066FF] hover:bg-[#0052cc]'
                                    }`}
                                >
                                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {actionType === 'reject' ? 'Confirm Reject' : actionType === 'pay' ? 'Confirm Paid' : actionType === 'penalty' ? 'Apply Penalty' : actionType === 'approve_repayment' ? 'Confirm Verification' : 'Confirm Approve'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInvoiceRequests;
