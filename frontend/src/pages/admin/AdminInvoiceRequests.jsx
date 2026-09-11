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
        processingFee: '',
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
            const token = sessionStorage.getItem('adminToken');
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
            const token = sessionStorage.getItem('adminToken');
            
            if (actionType === 'reject') {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/status`, {
                    status: 'Rejected',
                    rejectionReason: formData.rejectionReason
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else if (actionType === 'approve') {
                // Send proposal to vendor for review and approval
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/finance/admin/invoices/${selectedInvoice._id}/status`, {
                    status: 'Pending Vendor Approval',
                    approvedAmount: parseFloat(formData.approvedAmount),
                    processingFee: parseFloat(formData.processingFee) || 0,
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
            setFormData({ rejectionReason: '', approvedAmount: '', processingFee: '', timelineDate: '', paymentProofFile: '', penaltyAmount: '' });
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
            setFormData({ 
                ...formData, 
                approvedAmount: invoice.approvedAmount || invoice.amount, 
                processingFee: invoice.processingFee !== undefined ? invoice.processingFee : '',
                timelineDate: invoice.timelineDate ? invoice.timelineDate.split('T')[0] : ''
            });
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'bg-amber-100 text-amber-700';
            case 'Pending Vendor Approval': return 'bg-purple-100 text-purple-700 border border-purple-200';
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
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uploaded By</span>
                                                    <span className="text-sm font-black text-[#0B1E43]">{inv.vendor?.company || inv.vendor?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-slate-500 font-semibold">{inv.vendor?.email}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-[#0066FF] uppercase tracking-widest">Target Vendor</span>
                                                    <span className="text-sm font-bold text-[#0B1E43]">{inv.vendorName || 'N/A'}</span>
                                                    <span className="text-[10px] text-slate-500 font-semibold">LS ID: {inv.lsId}</span>
                                                </div>
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
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-[#0066FF] flex items-center" title="Requested Amount">
                                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                    {inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                                {inv.approvedAmount > 0 && (
                                                    <>
                                                        <span className="text-[10px] font-bold text-green-600 flex items-center" title="Approved Amount">
                                                            Appr: ₹{inv.approvedAmount.toLocaleString('en-IN')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-600 flex items-center" title="Disbursed (Paid) Amount">
                                                            Paid: ₹{(inv.approvedAmount - (inv.processingFee || 0)).toLocaleString('en-IN')}
                                                        </span>
                                                    </>
                                                )}
                                                <a href={inv.invoiceFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#0066FF] hover:text-[#0052cc] text-[10px] font-black uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md w-fit mt-1">
                                                    <FileText className="w-3 h-3" /> View Doc
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                                                {inv.status === 'Repayment Pending' ? 'Repayment Approval Pending' : (inv.status === 'Approved' ? 'DUE' : inv.status)}
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
                                            <div className="flex justify-center">
                                                <button onClick={() => openModal(inv, 'view')} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2">
                                                    <FileText className="w-4 h-4" /> View Details
                                                </button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-4 overflow-hidden">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-3.5 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-base md:text-lg font-black text-[#0B1E43] flex items-center gap-2">
                                {actionType === 'view' && <span className="bg-[#0B1E43] text-white px-2.5 py-1 rounded-lg text-xs font-black">Invoice Details</span>}
                                {actionType === 'approve' && 'Approve & Set Financing Terms'}
                                {actionType === 'reject' && 'Reject Invoice'}
                                {actionType === 'penalty' && 'Apply Penalty'}
                                {actionType === 'approve_repayment' && (selectedInvoice.repaymentProofFile ? 'Verify Repayment & Clear Invoice' : 'Direct Clear & Settle Invoice')}
                                {actionType === 'pay' && 'Upload Payment Proof'}
                            </h3>
                            <button onClick={() => setSelectedInvoice(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shadow-sm">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {actionType === 'view' ? (
                            <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Vendor Info</h4>
                                            <div className="flex flex-col gap-2">
                                                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Uploaded By</span>
                                                    <p className="text-xs font-bold text-[#0B1E43]">{selectedInvoice.vendor?.company || selectedInvoice.vendor?.name || 'Unknown'}</p>
                                                    <p className="text-[11px] font-semibold text-slate-500">{selectedInvoice.vendor?.email}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400">Phone: {selectedInvoice.vendor?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="bg-[#0066FF]/5 rounded-lg p-2.5 border border-[#0066FF]/10">
                                                    <span className="text-[8px] font-black text-[#0066FF] uppercase tracking-widest block mb-0.5">Target Vendor</span>
                                                    <p className="text-xs font-bold text-[#0B1E43]">{selectedInvoice.vendorName || 'N/A'}</p>
                                                    <p className="text-[11px] font-semibold text-[#0066FF]/70">LS ID: {selectedInvoice.lsId}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Bank Details</h4>
                                            <p className="text-xs font-bold text-[#0B1E43]">{selectedInvoice.bankDetails?.accountName}</p>
                                            <p className="text-[11px] font-semibold text-slate-600">A/C: {selectedInvoice.bankDetails?.accountNo}</p>
                                            <p className="text-[11px] font-semibold text-slate-600">IFSC: {selectedInvoice.bankDetails?.ifscCode}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Amounts</h4>
                                            <p className="text-xs font-semibold text-slate-600">Requested: <span className="font-black text-[#0B1E43]">₹{selectedInvoice.amount.toLocaleString()}</span></p>
                                            {selectedInvoice.approvedAmount && (
                                                <p className="text-xs font-semibold text-green-600">Approved: <span className="font-black">₹{selectedInvoice.approvedAmount.toLocaleString()}</span></p>
                                            )}
                                            {selectedInvoice.processingFee > 0 && (
                                                <p className="text-xs font-semibold text-amber-600">Processing Fee: <span className="font-black">₹{selectedInvoice.processingFee.toLocaleString()}</span></p>
                                            )}
                                            {selectedInvoice.penaltyAmount > 0 && (
                                                <p className="text-xs font-semibold text-red-600">Penalty: <span className="font-black">₹{selectedInvoice.penaltyAmount.toLocaleString()}</span></p>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Documents</h4>
                                            <a href={selectedInvoice.invoiceFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" /> View Original Invoice
                                            </a>
                                            {selectedInvoice.paymentProofFile && (
                                                <a href={selectedInvoice.paymentProofFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1 mt-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> View Admin Payment Proof
                                                </a>
                                            )}
                                            {selectedInvoice.repaymentProofFile && (
                                                <a href={selectedInvoice.repaymentProofFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 mt-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> View Vendor Repayment Proof
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Timeline */}
                                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Current Status</span>
                                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${getStatusColor(selectedInvoice.status)}`}>
                                            {selectedInvoice.status === 'Repayment Pending' ? 'VERIFY PAYMENT REQUEST' : (selectedInvoice.status === 'Approved' ? 'DUE' : selectedInvoice.status)}
                                        </span>
                                    </div>
                                    {selectedInvoice.timelineDate && (
                                        <div className="text-right">
                                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Repayment Deadline</span>
                                            <span className="text-xs font-bold text-[#0B1E43]">
                                                {new Date(selectedInvoice.timelineDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2.5">
                                    {(selectedInvoice.status === 'Pending' || selectedInvoice.status === 'Pending Vendor Approval') && (
                                        <>
                                            <button onClick={() => setActionType('approve')} className="bg-[#0066FF] text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-[#0052cc]">
                                                {selectedInvoice.status === 'Pending Vendor Approval' ? 'Update Proposal Terms' : 'Approve & Set Terms'}
                                            </button>
                                            <button onClick={() => setActionType('reject')} className="bg-red-50 text-red-600 px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-red-100">
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {selectedInvoice.status === 'Approved' && (
                                        <>
                                            <button onClick={() => setActionType('pay')} className="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-green-700">
                                                Upload Pay Proof
                                            </button>
                                            <button onClick={() => setActionType('penalty')} className="bg-amber-100 text-amber-700 px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-amber-200">
                                                Apply Penalty
                                            </button>
                                            <button onClick={() => setActionType('approve_repayment')} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Cleared &amp; Settle
                                            </button>
                                        </>
                                    )}
                                    {selectedInvoice.status === 'Paid' && (
                                        <button onClick={() => setActionType('approve_repayment')} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Cleared &amp; Settle
                                        </button>
                                    )}
                                    {selectedInvoice.status === 'Repayment Pending' && (
                                        <button onClick={() => setActionType('approve_repayment')} className="bg-[#0066FF] text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-[#0052cc] flex items-center gap-1.5 shadow-sm">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verify Vendor Repayment &amp; Clear
                                        </button>
                                    )}
                                    {['Cleared', 'Rejected'].includes(selectedInvoice.status) && (
                                        <p className="text-xs font-bold text-slate-400 italic">No further actions required.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                        <form onSubmit={handleAction} className="p-4 md:p-5 space-y-3.5 overflow-y-auto flex-1">
                            {actionType === 'reject' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Rejection Reason</label>
                                    <textarea
                                        value={formData.rejectionReason}
                                        onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-red-500 transition-colors resize-none h-20"
                                        placeholder="Why are you rejecting this invoice?"
                                        required
                                    />
                                </div>
                            )}

                            {actionType === 'approve' && (() => {
                                const base = parseFloat(formData.approvedAmount) || 0;
                                const fee = parseFloat(formData.processingFee) || 0;
                                const gst = Math.round(fee * 0.18);
                                const total = base + fee + gst;

                                return (
                                    <>
                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 flex flex-col gap-0.5 mb-2">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Requested Amount</span>
                                            <span className="text-base font-black text-[#0B1E43] flex items-center">
                                                <IndianRupee className="w-4 h-4 mr-0.5 text-blue-400" />
                                                {selectedInvoice.amount.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Approved Base Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.approvedAmount}
                                                onChange={(e) => setFormData({...formData, approvedAmount: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Documentation / Processing Fee (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.processingFee}
                                                onChange={(e) => setFormData({...formData, processingFee: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                                                placeholder="e.g. 5000"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-700">Repayment Due Date</label>
                                            <input
                                                type="date"
                                                value={formData.timelineDate}
                                                onChange={(e) => setFormData({...formData, timelineDate: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                                                required
                                            />
                                        </div>

                                        {/* Real-time Invoice Breakdown Box */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Invoice &amp; Wallet Deduction Summary</span>
                                            <div className="flex justify-between font-semibold text-slate-600">
                                                <span>Base Reimbursement:</span>
                                                <span className="font-bold text-[#0B1E43]">₹{base.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-slate-600">
                                                <span>Doc / Processing Fee:</span>
                                                <span className="font-bold text-[#0B1E43]">₹{fee.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-slate-600">
                                                <span>GST on Doc Fee (18%):</span>
                                                <span className="font-bold text-blue-600">+ ₹{gst.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-[#0B1E43] text-xs">
                                                <span>Total Invoice / Deductible:</span>
                                                <span className="text-[#0066FF] text-sm font-black">₹{total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {actionType === 'pay' && (
                                <>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 mb-2 text-xs">
                                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                                            <span className="font-bold text-slate-500">Pay to Account</span>
                                            <span className="font-black text-[#0B1E43]">{selectedInvoice.bankDetails?.accountNo}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                                            <span className="font-bold text-slate-500">IFSC Code</span>
                                            <span className="font-black text-[#0B1E43]">{selectedInvoice.bankDetails?.ifscCode}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-500">Amount</span>
                                            <span className="font-black text-green-600 flex items-center">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                {selectedInvoice.approvedAmount?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Attach Payment Proof</label>
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                setFormData({...formData, paymentProofFile: e.target.files[0]})
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-green-500 transition-colors file:mr-3 file:py-0.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                                            accept=".pdf,image/*"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {actionType === 'penalty' && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Penalty Amount (Deducted from Wallet)</label>
                                    <input
                                        type="number"
                                        value={formData.penaltyAmount}
                                        onChange={(e) => setFormData({...formData, penaltyAmount: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Enter penalty amount"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1 font-semibold">This amount will be deducted directly from the vendor's wallet balance.</p>
                                </div>
                            )}

                            {actionType === 'approve_repayment' && (
                                <div className="space-y-3">
                                    {selectedInvoice.repaymentProofFile ? (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                                            <p className="text-xs font-bold text-slate-600 mb-1.5">Vendor Uploaded Payment Proof</p>
                                            <a href={selectedInvoice.repaymentProofFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-black text-xs hover:bg-blue-100 transition-colors">
                                                <FileText className="w-3.5 h-3.5" /> View Screenshot
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-center">
                                            <p className="text-xs font-black text-blue-800">Direct Admin Settlement</p>
                                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                Vendor has not submitted a repayment proof yet. Proceeding will directly mark this invoice as <span className="font-bold text-slate-700">Cleared</span> and restore wallet limit.
                                            </p>
                                        </div>
                                    )}
                                    <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 text-center">
                                        <p className="text-xs font-bold text-emerald-800">
                                            Confirming will mark invoice <span className="font-black">{selectedInvoice.lsId}</span> as <span className="font-black uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">Cleared</span> and restore <span className="font-black text-emerald-900">₹{((selectedInvoice.approvedAmount || selectedInvoice.amount || 0) + (selectedInvoice.processingFee || 0) + (selectedInvoice.penaltyAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> to the vendor's wallet balance.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setActionType('view')}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Back to Details
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-black text-xs text-white transition-colors flex items-center justify-center gap-1.5 ${
                                        actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        actionType === 'pay' ? 'bg-green-600 hover:bg-green-700' :
                                        actionType === 'penalty' ? 'bg-amber-600 hover:bg-amber-700' :
                                        actionType === 'approve_repayment' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        'bg-[#0066FF] hover:bg-[#0052cc]'
                                    }`}
                                >
                                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {actionType === 'reject' ? 'Confirm Reject' : actionType === 'pay' ? 'Confirm Paid' : actionType === 'penalty' ? 'Apply Penalty' : actionType === 'approve_repayment' ? (selectedInvoice.repaymentProofFile ? 'Confirm & Clear Invoice' : 'Direct Settle & Clear Invoice') : actionType === 'approve' ? 'Send Proposal to Vendor' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInvoiceRequests;
