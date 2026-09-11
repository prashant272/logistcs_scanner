import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, CheckCircle2, XCircle, FileText, Loader2, IndianRupee, Clock, Search, Download, Eye } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from '../shared/InvoiceTemplate';
import { useAuth } from '../../context/AuthContext';

const UploadInvoiceTab = () => {
    const { user, reloadUserProfile } = useAuth();
    const location = useLocation();
    
    // Parse URL query params
    const queryParams = new URLSearchParams(location.search);
    const filterParam = queryParams.get('filter');
    const [formData, setFormData] = useState({
        lsId: '',
        vendorName: '',
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
    const [responseLoading, setResponseLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Invoice PDF Download State
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [pdfInvoiceData, setPdfInvoiceData] = useState(null);
    const invoicePdfRef = useRef(null);
    
    const fileInputRef = useRef(null);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            if (!filterParam) return true;
            if (filterParam === 'upcoming') {
                return inv.status === 'Approved';
            }
            if (filterParam === 'due_5_days') {
                if (inv.status !== 'Approved' || !inv.timelineDate) return false;
                const nowTime = Date.now();
                return (new Date(inv.timelineDate).getTime() - nowTime) <= 5 * 24 * 60 * 60 * 1000;
            }
            return true;
        });
    }, [invoices, filterParam]);

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

    const handleLsIdBlur = async () => {
        if (!formData.lsId) return;
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/lookup?type=vendor&lsid=${formData.lsId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.name) {
                setFormData(prev => ({
                    ...prev,
                    vendorName: res.data.company || res.data.name
                }));
            }
        } catch (err) {
            console.error('Lookup error:', err);
            // Optionally set error message or leave alone
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user?.walletBalance || user.walletBalance <= 0) {
            alert('Your wallet is not approved yet (Balance is zero or not set). You cannot submit an invoice.');
            return;
        }
        
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

    const handleVendorResponse = async (invoiceId, action, rejectionReason = '') => {
        try {
            setResponseLoading(true);
            setError('');
            setSuccess('');
            const token = localStorage.getItem('userToken');

            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/finance/invoice/${invoiceId}/vendor-response`,
                { action, rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSelectedInvoice(null);
            setShowRejectInput(false);
            setRejectReason('');
            fetchMyInvoices();
            if (typeof reloadUserProfile === 'function') {
                reloadUserProfile();
            }

            setSuccess(res.data.message || (action === 'approve' ? 'Invoice approved successfully!' : 'Invoice proposal rejected.'));
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Vendor response error:', err);
            setError(err.response?.data?.message || 'Failed to process response');
        } finally {
            setResponseLoading(false);
        }
    };

    const handleDownloadInvoice = (invReq) => {
        if (!invReq) return;
        setDownloadingInvoiceId(invReq._id);
        
        let targetInvoice = invReq.generatedInvoice;
        if (!targetInvoice || typeof targetInvoice !== 'object' || !targetInvoice.invoiceNo) {
            const finalAmount = parseFloat(invReq.approvedAmount) || parseFloat(invReq.amount) || 0;
            const fee = parseFloat(invReq.processingFee) || 0;
            const gstAmount = Math.round(fee * 0.18);
            const totalAmount = finalAmount + fee + gstAmount;
            const targetVendorName = invReq.vendorName || invReq.lsId || 'Vendor';
            const resolvedAddress = [user?.address, user?.city, user?.state, user?.pincode].filter(Boolean).join(', ');
            const isDelhi = [user?.address, user?.city, user?.state].filter(Boolean).join(' ').toLowerCase().includes('delhi');

            targetInvoice = {
                invoiceNo: `LS${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getFullYear()).slice(-2)}28`,
                date: new Date(),
                dueDate: invReq.timelineDate ? new Date(invReq.timelineDate) : null,
                companyName: user?.company || user?.name || 'Vendor',
                address: resolvedAddress,
                country: user?.country || 'India',
                currency: 'INR',
                gstNo: user?.gst || '',
                panNo: user?.pan || '',
                planName: `Invoice Financing & Documentation Charges - ${targetVendorName}`,
                sacCode: '9956',
                gstRate: 18,
                baseAmount: finalAmount + fee,
                approvedAmount: finalAmount,
                processingFee: fee,
                items: [
                    {
                        description: `Reimbursement of Vendor Invoice (${targetVendorName})`,
                        subtitle: `Invoice disbursement & settlement for target vendor ${targetVendorName}`,
                        sacCode: '9956',
                        gstRate: 0,
                        amount: finalAmount
                    },
                    {
                        description: `Documentation & Processing Charges`,
                        subtitle: `Platform verification, legal & documentation processing charges`,
                        sacCode: '9956',
                        gstRate: 18,
                        amount: fee
                    }
                ],
                igstAmount: isDelhi ? 0 : gstAmount,
                cgstAmount: isDelhi ? gstAmount / 2 : 0,
                sgstAmount: isDelhi ? gstAmount / 2 : 0,
                totalAmount,
                paymentMethod: 'Wallet Deduction',
                paymentReferenceNo: `IR-${invReq._id.toString().slice(-6).toUpperCase()}`
            };
        }

        setPdfInvoiceData(targetInvoice);

        setTimeout(() => {
            const element = invoicePdfRef.current;
            if (!element) {
                setDownloadingInvoiceId(null);
                setPdfInvoiceData(null);
                return;
            }

            const opt = {
                margin: [6, 6, 6, 6],
                filename: `Invoice_${targetInvoice.invoiceNo || 'Financing'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                setDownloadingInvoiceId(null);
                setPdfInvoiceData(null);
            }).catch((err) => {
                console.error('PDF generation error:', err);
                setDownloadingInvoiceId(null);
                setPdfInvoiceData(null);
            });
        }, 400);
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Pending Vendor Approval': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'Approved': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'Paid': return 'bg-green-50 text-green-600 border-green-200';
            case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
            case 'Repayment Pending': return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'Cleared': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
                                <input type="text" name="lsId" value={formData.lsId} onChange={handleInputChange} onBlur={handleLsIdBlur} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors" placeholder="Enter LS ID" required />
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
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Target Vendor</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Invoice Doc</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Timeline / Proof</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                <span className="text-sm font-bold">Loading invoices...</span>
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <FileText className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <span className="text-sm font-bold block">
                                                    {filterParam ? 'No invoices found for this filter.' : 'No invoices submitted yet.'}
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((inv) => (
                                            <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-[#0B1E43] uppercase">{inv.vendorName || 'N/A'}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{inv.lsId}</span>
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
                                                 {inv.status === 'Pending Vendor Approval' ? '⚡ ACTION REQUIRED (OFFER READY)' : 
                                                  (inv.status === 'Paid' || inv.status === 'Approved') ? 'APPROVED INVOICE' : 
                                                  (inv.status === 'Repayment Pending' ? 'VERIFICATION PENDING' : inv.status)}
                                             </span>
                                             {inv.status === 'Rejected' && inv.rejectionReason && (
                                                 <p className="text-xs text-red-500 mt-1 font-semibold max-w-[200px] truncate" title={inv.rejectionReason}>
                                                     {inv.rejectionReason}
                                                 </p>
                                             )}
                                         </td>
                                         <td className="px-6 py-4">
                                             {(inv.status === 'Approved' || inv.status === 'Pending Vendor Approval') && inv.timelineDate && (
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
                                                 <span className="text-xs text-slate-400 font-semibold italic">Awaiting Admin Review</span>
                                             )}
                                         </td>
                                         <td className="p-4 text-center">
                                             <div className="flex justify-center">
                                                 {inv.status === 'Pending Vendor Approval' ? (
                                                     <button 
                                                         onClick={() => {
                                                             setSelectedInvoice(inv);
                                                             setActionType('view');
                                                             setShowRejectInput(false);
                                                         }}
                                                         className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-[#0066FF]/20"
                                                     >
                                                         ⚡ Review &amp; Approve
                                                     </button>
                                                 ) : (
                                                     <button 
                                                         onClick={() => {
                                                             setSelectedInvoice(inv);
                                                             setActionType('view');
                                                             setShowRejectInput(false);
                                                         }}
                                                         className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2"
                                                     >
                                                         <FileText className="w-4 h-4" /> View Details
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

            {/* View, Review Proposal & Repay Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-4 overflow-hidden">
                    <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-3.5 px-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="text-base md:text-lg font-black text-[#0B1E43] flex items-center gap-2">
                                {actionType === 'view' ? (
                                     selectedInvoice.status === 'Pending Vendor Approval' ? (
                                         <span className="bg-[#0066FF] text-white px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5">
                                             ⚡ Financing Proposal Review
                                         </span>
                                     ) : (
                                         <span className="bg-[#0B1E43] text-white px-2.5 py-1 rounded-lg text-xs font-black">Invoice Details</span>
                                     )
                                 ) : 'Repay Invoice'}
                            </h3>
                            <button onClick={() => { setSelectedInvoice(null); setShowRejectInput(false); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shadow-sm">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {actionType === 'view' ? (
                            <div className="p-4 md:p-5 space-y-3.5 overflow-y-auto flex-1">
                                 {/* Special Proposal Review Box for Pending Vendor Approval */}
                                 {selectedInvoice.status === 'Pending Vendor Approval' && (() => {
                                     const base = parseFloat(selectedInvoice.approvedAmount) || parseFloat(selectedInvoice.amount) || 0;
                                     const fee = parseFloat(selectedInvoice.processingFee) || 0;
                                     const gst = Math.round(fee * 0.18);
                                     const total = base + fee + gst;
                                     const currentBal = parseFloat(user?.walletBalance) || 0;
                                     const hasEnoughBalance = currentBal >= total;

                                     return (
                                         <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-3.5 md:p-4 rounded-2xl border-2 border-[#0066FF]/20 space-y-3 shadow-sm">
                                             <div className="flex items-center gap-2 text-[#0066FF]">
                                                 <Clock className="w-4 h-4 animate-spin" />
                                                 <h4 className="text-xs font-black uppercase tracking-wider">Financing Offer &amp; Invoice Breakdown</h4>
                                             </div>
                                             
                                             <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                                                 Review the breakdown below. On clicking <b>Accept &amp; Approve</b>, <b>₹{total.toLocaleString('en-IN')}</b> will be deducted from your wallet and Tax Invoice generated.
                                             </p>

                                             <div className="bg-white p-3 rounded-xl border border-blue-100 space-y-1.5 text-xs">
                                                 <div className="flex justify-between font-semibold text-slate-600">
                                                     <span>1. Base Reimbursement ({selectedInvoice.vendorName || 'Vendor'}):</span>
                                                     <span className="font-bold text-[#0B1E43]">₹{base.toLocaleString('en-IN')}</span>
                                                 </div>
                                                 <div className="flex justify-between font-semibold text-slate-600">
                                                     <span>2. Documentation Charges:</span>
                                                     <span className="font-bold text-[#0B1E43]">₹{fee.toLocaleString('en-IN')}</span>
                                                 </div>
                                                 <div className="flex justify-between font-semibold text-slate-600">
                                                     <span>3. GST on Doc Charges (18%):</span>
                                                     <span className="font-bold text-blue-600">+ ₹{gst.toLocaleString('en-IN')}</span>
                                                 </div>
                                                 <div className="border-t border-slate-100 pt-1.5 flex justify-between font-black text-[#0B1E43] text-sm">
                                                     <span>Total Invoice Amount:</span>
                                                     <span className="text-base text-[#0066FF]">₹{total.toLocaleString('en-IN')}</span>
                                                 </div>
                                                 {selectedInvoice.timelineDate && (
                                                     <div className="flex justify-between font-bold text-slate-500 pt-1 border-t border-slate-50 text-[11px]">
                                                         <span>Repayment Due Date:</span>
                                                         <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-black">
                                                             {new Date(selectedInvoice.timelineDate).toLocaleDateString()}
                                                         </span>
                                                     </div>
                                                 )}
                                             </div>

                                             <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100/60 flex items-center justify-between text-[11px] font-bold">
                                                 <div className="text-slate-600">
                                                     Wallet Balance: <span className="font-black text-[#0B1E43]">₹{currentBal.toLocaleString('en-IN')}</span>
                                                 </div>
                                                 <div className={hasEnoughBalance ? 'text-green-600' : 'text-red-600'}>
                                                     Balance After: <span className="font-black">₹{(currentBal - total).toLocaleString('en-IN')}</span>
                                                 </div>
                                             </div>

                                             {!hasEnoughBalance && (
                                                 <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-1.5">
                                                     <XCircle size={14} /> Insufficient Wallet Balance. Please recharge wallet.
                                                 </div>
                                             )}

                                             {/* Download & Review Official Invoice Button */}
                                             <div className="pt-0.5">
                                                 <button
                                                     type="button"
                                                     onClick={() => handleDownloadInvoice(selectedInvoice)}
                                                     disabled={downloadingInvoiceId === selectedInvoice._id}
                                                     className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                                 >
                                                     {downloadingInvoiceId === selectedInvoice._id ? (
                                                         <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                     ) : (
                                                         <Download className="w-3.5 h-3.5" />
                                                     )}
                                                     <span>📄 Download &amp; Review Invoice ({selectedInvoice.generatedInvoice?.invoiceNo || 'Tax Invoice'})</span>
                                                 </button>
                                             </div>

                                             {/* Vendor Accept / Reject Actions */}
                                             {!showRejectInput ? (
                                                 <div className="pt-1 flex gap-2.5">
                                                     <button
                                                         onClick={() => {
                                                             if (window.confirm(`Are you sure you want to approve this invoice? ₹${total.toLocaleString('en-IN')} will be deducted from your wallet balance.`)) {
                                                                 handleVendorResponse(selectedInvoice._id, 'approve');
                                                             }
                                                         }}
                                                         disabled={responseLoading || !hasEnoughBalance}
                                                         className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                     >
                                                         {responseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                         Accept &amp; Approve (Deduct ₹{total.toLocaleString('en-IN')})
                                                     </button>
                                                     <button
                                                         onClick={() => setShowRejectInput(true)}
                                                         disabled={responseLoading}
                                                         className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black transition-colors"
                                                     >
                                                         Reject
                                                     </button>
                                                 </div>
                                             ) : (
                                                 <div className="p-3 bg-white rounded-xl border border-red-200 space-y-2">
                                                     <label className="text-[11px] font-black text-slate-700 block">Reason for Rejection (Optional):</label>
                                                     <textarea
                                                         value={rejectReason}
                                                         onChange={(e) => setRejectReason(e.target.value)}
                                                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-500 resize-none h-16"
                                                         placeholder="Why are you rejecting this proposal?"
                                                     />
                                                     <div className="flex gap-2 justify-end">
                                                         <button
                                                             onClick={() => setShowRejectInput(false)}
                                                             className="px-3 py-1.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200"
                                                         >
                                                             Cancel
                                                         </button>
                                                         <button
                                                             onClick={() => handleVendorResponse(selectedInvoice._id, 'reject', rejectReason)}
                                                             disabled={responseLoading}
                                                             className="px-3 py-1.5 bg-red-600 text-white font-black text-xs rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                         >
                                                             {responseLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                                             Confirm Reject
                                                         </button>
                                                     </div>
                                                 </div>
                                             )}
                                         </div>
                                     );
                                 })()}

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                                     <div className="space-y-3">
                                         <div>
                                             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Target Vendor Bank Details</h4>
                                             <p className="text-xs font-bold text-[#0B1E43]">{selectedInvoice.bankDetails?.accountName}</p>
                                             <p className="text-[11px] font-semibold text-slate-600">A/C: {selectedInvoice.bankDetails?.accountNo}</p>
                                             <p className="text-[11px] font-semibold text-slate-600">IFSC: {selectedInvoice.bankDetails?.ifscCode}</p>
                                         </div>
                                     </div>
                                     <div className="space-y-3">
                                         <div>
                                             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Requested Amount</h4>
                                             <p className="text-xs font-semibold text-slate-600">Original Invoice Amount: <span className="font-black text-[#0B1E43]">₹{selectedInvoice.amount.toLocaleString()}</span></p>
                                         </div>
                                         <div>
                                             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Documents</h4>
                                             <a href={selectedInvoice.invoiceFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1">
                                                 <FileText className="w-3 h-3" /> View Uploaded Invoice
                                             </a>
                                             {selectedInvoice.paymentProofFile && (
                                                 <a href={selectedInvoice.paymentProofFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1 mt-1">
                                                  <CheckCircle2 className="w-3 h-3" /> View Admin Payment Proof
                                                 </a>
                                             )}
                                             {selectedInvoice.repaymentProofFile && (
                                                 <a href={selectedInvoice.repaymentProofFile} target="_blank" rel="noreferrer" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 mt-1">
                                                     <CheckCircle2 className="w-3 h-3" /> View Your Repayment Proof
                                                 </a>
                                             )}
                                         </div>
                                     </div>
                                 </div>

                                 <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                                     <div>
                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Current Status</span>
                                         <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${getStatusColor(selectedInvoice.status)}`}>
                                             {selectedInvoice.status === 'Pending Vendor Approval' ? 'OFFER PENDING YOUR APPROVAL' :
                                              (selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Approved') ? 'APPROVED INVOICE' : 
                                              (selectedInvoice.status === 'Repayment Pending' ? 'VERIFICATION PENDING' : selectedInvoice.status)}
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

                                 <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2.5">
                                     {(selectedInvoice.status === 'Approved' || selectedInvoice.status === 'Paid') && (
                                         <button onClick={() => setActionType('repay')} className="bg-amber-600 text-white px-5 py-2 rounded-xl text-xs font-black transition-colors hover:bg-amber-700">
                                             Repay Invoice
                                         </button>
                                     )}
                                     {['Pending', 'Repayment Pending', 'Cleared', 'Rejected'].includes(selectedInvoice.status) && (
                                         <p className="text-xs font-bold text-slate-400 italic">No further actions required.</p>
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

            {/* Hidden Invoice Template for PDF Generation */}
            <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
                {pdfInvoiceData && (
                    <InvoiceTemplate invoice={pdfInvoiceData} forwardRef={invoicePdfRef} />
                )}
            </div>
        </div>
    );
};

export default UploadInvoiceTab;
