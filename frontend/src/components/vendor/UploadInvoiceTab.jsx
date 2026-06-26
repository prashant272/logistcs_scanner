import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, XCircle, FileText, Loader2, IndianRupee, Clock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UploadInvoiceTab = () => {
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        lsId: user?.lsId || '',
        vendorName: user?.company || user?.name || '',
        accountNo: '',
        ifscCode: '',
        branchName: '',
        accountName: '',
        amount: ''
    });
    
    const [invoiceFile, setInvoiceFile] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Modal State
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [actionType, setActionType] = useState('view');
    const [repayProofFile, setRepayProofFile] = useState(null);
    const [repaySubmitting, setRepaySubmitting] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchMyInvoices();
    }, []);

    const fetchMyInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoices(res.data || []);
        } catch (err) {
            console.error('Fetch invoices error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!invoiceFile) {
            setError('Please attach the invoice document.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('userToken');
            
            // Upload file to backend
            const formDataUpload = new FormData();
            formDataUpload.append('file', invoiceFile);

            const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formDataUpload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const uploadedFileUrl = uploadRes.data.url;
            
            const payload = {
                lsId: formData.lsId,
                vendorName: formData.vendorName,
                bankDetails: {
                    accountNo: formData.accountNo,
                    ifscCode: formData.ifscCode,
                    branchName: formData.branchName,
                    accountName: formData.accountName
                },
                amount: parseFloat(formData.amount),
                invoiceFile: uploadedFileUrl
            };

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Invoice submitted successfully!');
            setFormData({ ...formData, accountNo: '', amount: '' });
            setInvoiceFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            fetchMyInvoices();
        } catch (err) {
            console.error('Invoice submit error:', err);
            setError(err.response?.data?.message || 'Failed to submit invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRepaySubmit = async (e) => {
        e.preventDefault();
        if (!repayProofFile) {
            alert('Please upload a repayment proof screenshot');
            return;
        }

        try {
            setRepaySubmitting(true);
            const token = localStorage.getItem('userToken');

            // Upload proof to R2
            const formDataUpload = new FormData();
            formDataUpload.append('file', repayProofFile);
            
            const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formDataUpload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const uploadedProofUrl = uploadRes.data.url;

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice/${selectedInvoice._id}/repay`, {
                repaymentProofFile: uploadedProofUrl
            }, { headers: { Authorization: `Bearer ${token}` }});

            setSelectedInvoice(null);
            setRepayProofFile(null);
            fetchMyInvoices();
            setSuccess('Repayment submitted! Waiting for Admin verification.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error('Repay submit error:', err);
            alert(err.response?.data?.message || 'Failed to submit repayment');
        } finally {
            setRepaySubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'Approved': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Paid': return 'bg-green-50 text-green-600 border-green-200';
            case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Upload Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <UploadCloud size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#0B1E43]">Upload Invoice</h2>
                        <p className="text-sm font-semibold text-slate-500">Submit your invoice for payment processing</p>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2"><XCircle size={16} />{error}</div>}
                {success && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Vendor LS ID</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" name="lsId" value={formData.lsId} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="Enter LS ID" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Vendor Name</label>
                            <input type="text" name="vendorName" value={formData.vendorName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="Autofilled Vendor Name" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Account Number</label>
                            <input type="text" name="accountNo" value={formData.accountNo} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="e.g. 1234567890" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">IFSC Code</label>
                            <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors uppercase" placeholder="e.g. HDFC0001234" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Branch Name</label>
                            <input type="text" name="branchName" value={formData.branchName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="e.g. Andheri West" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Account Name</label>
                            <input type="text" name="accountName" value={formData.accountName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="Name on account" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Invoice Amount (₹)</label>
                            <div className="relative">
                                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="0.00" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700">Attach Invoice (PDF/Image)</label>
                            <div className="relative">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0066FF]/10 file:text-[#0066FF] hover:file:bg-[#0066FF]/20" accept=".pdf,image/*" required />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={submitting} className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-md shadow-[#0066FF]/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            {submitting ? 'Submitting...' : 'Submit Invoice'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Submitted Invoices Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#0B1E43]">Submitted Invoices</h2>
                        <p className="text-sm font-semibold text-slate-500">Track the status of your uploaded invoices</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Invoice Doc</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Timeline / Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        <span className="text-sm font-bold">Loading invoices...</span>
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FileText className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <span className="text-sm font-bold block">No invoices submitted yet.</span>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={inv.invoiceFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-bold">
                                                <FileText className="w-4 h-4" /> View Doc
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-[#0B1E43] flex items-center">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                                {inv.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                            {inv.status === 'Rejected' && inv.rejectionReason && (
                                                <p className="text-xs text-red-500 mt-1 font-semibold max-w-[200px] truncate" title={inv.rejectionReason}>
                                                    {inv.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inv.status === 'Approved' && inv.timelineDate && (
                                                <span className="text-xs font-bold text-slate-600">
                                                    Due: {new Date(inv.timelineDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {inv.status === 'Paid' && inv.paymentProofFile && (
                                                <a href={inv.paymentProofFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-black uppercase tracking-wider mt-1 transition-colors w-fit">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Proof
                                                </a>
                                            )}
                                            {inv.status === 'Pending' && (
                                                <span className="text-xs text-slate-400 font-semibold italic">Awaiting Review</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedInvoice(inv);
                                                        setActionType('view');
                                                    }}
                                                    className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2"
                                                >
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

            {/* View & Repay Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                {actionType === 'view' ? <span className="bg-[#0B1E43] text-white px-3 py-1 rounded-lg text-sm">Invoice Details</span> : 'Repay Invoice'}
                            </h3>
                            <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shadow-sm">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {actionType === 'view' ? (
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Bank Details</h4>
                                            <p className="text-sm font-bold text-[#0B1E43]">{selectedInvoice.bankDetails?.accountName}</p>
                                            <p className="text-xs font-semibold text-slate-600">A/C: {selectedInvoice.bankDetails?.accountNo}</p>
                                            <p className="text-xs font-semibold text-slate-600">IFSC: {selectedInvoice.bankDetails?.ifscCode}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Amounts</h4>
                                            <p className="text-sm font-semibold text-slate-600">Requested: <span className="font-black text-[#0B1E43]">₹{selectedInvoice.amount.toLocaleString()}</span></p>
                                            {selectedInvoice.approvedAmount && (
                                                <p className="text-sm font-semibold text-green-600">Approved: <span className="font-black">₹{selectedInvoice.approvedAmount.toLocaleString()}</span></p>
                                            )}
                                            {selectedInvoice.processingFee > 0 && (
                                                <p className="text-sm font-semibold text-amber-600">Processing Fee: <span className="font-black">₹{selectedInvoice.processingFee.toLocaleString()}</span></p>
                                            )}
                                            {selectedInvoice.penaltyAmount > 0 && (
                                                <p className="text-sm font-semibold text-red-600">Penalty: <span className="font-black">₹{selectedInvoice.penaltyAmount.toLocaleString()}</span></p>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Documents</h4>
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
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> View Your Repayment Proof
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Current Status</span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getStatusColor(selectedInvoice.status)}`}>
                                            {selectedInvoice.status}
                                        </span>
                                    </div>
                                    {selectedInvoice.timelineDate && (
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Repayment Deadline</span>
                                            <span className="text-sm font-bold text-[#0B1E43]">
                                                {new Date(selectedInvoice.timelineDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 pt-6 flex flex-wrap gap-3">
                                    {(selectedInvoice.status === 'Approved' || selectedInvoice.status === 'Paid') && (
                                        <button onClick={() => setActionType('repay')} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-colors hover:bg-amber-700">
                                            Repay Invoice
                                        </button>
                                    )}
                                    {['Pending', 'Repayment Pending', 'Cleared', 'Rejected'].includes(selectedInvoice.status) && (
                                        <p className="text-sm font-bold text-slate-400 italic">No further actions required.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                        <form onSubmit={handleRepaySubmit} className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 text-center">
                                <p className="text-sm font-bold text-slate-500">Please transfer the amount to:</p>
                                <p className="text-lg font-black text-[#0B1E43]">Logistics Scanner Pvt Ltd</p>
                                <p className="text-sm font-black text-slate-700">A/C: 1234567890123</p>
                                <p className="text-sm font-black text-slate-700 mb-2">IFSC: HDFC0001234</p>
                                <div className="pt-2 border-t border-slate-200">
                                    <span className="text-xs font-bold text-slate-500">Amount to Pay</span>
                                    <span className="text-xl font-black text-amber-600 flex items-center justify-center">
                                        <IndianRupee className="w-5 h-5 mr-0.5" />
                                        {((selectedInvoice.approvedAmount || selectedInvoice.amount) + selectedInvoice.penaltyAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Attach Payment Screenshot</label>
                                <input
                                    type="file"
                                    onChange={(e) => setRepayProofFile(e.target.files[0])}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                    accept="image/*,.pdf"
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActionType('view')}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Back to Details
                                </button>
                                <button
                                    type="submit"
                                    disabled={repaySubmitting}
                                    className="flex-1 bg-amber-600 text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-amber-700 flex items-center justify-center gap-2"
                                >
                                    {repaySubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Submit Repayment
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

export default UploadInvoiceTab;
