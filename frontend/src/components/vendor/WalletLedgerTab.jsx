import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wallet, ArrowDownRight, ArrowUpRight, Loader2, IndianRupee, Clock, History, CreditCard, XCircle, CheckCircle2, Zap, ShieldAlert, Award, AlertTriangle } from 'lucide-react';

const WalletLedgerTab = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [creditStats, setCreditStats] = useState({ totalPendingDues: 0, totalPenalties: 0, creditScore: 100, pendingCount: 0, scoreAudit: [] });
    const [scoreModalOpen, setScoreModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Repay Modal State
    const [repayModalOpen, setRepayModalOpen] = useState(false);
    const [selectedRepayInvoice, setSelectedRepayInvoice] = useState(null);
    const [repayProofFile, setRepayProofFile] = useState(null);
    const [repaySubmitting, setRepaySubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [payOnlineLoading, setPayOnlineLoading] = useState(false);
    const [showOnlineBreakdown, setShowOnlineBreakdown] = useState(false);

    // Recharge Wallet State
    const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [rechargeProofFile, setRechargeProofFile] = useState(null);
    const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
    const [rechargeOnlineLoading, setRechargeOnlineLoading] = useState(false);
    const [showRechargeOnlineBreakdown, setShowRechargeOnlineBreakdown] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayOnline = async () => {
        if (!selectedRepayInvoice) return;
        try {
            setPayOnlineLoading(true);
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert('Razorpay SDK failed to load. Please check your internet connection.');
                setPayOnlineLoading(false);
                return;
            }

            const token = localStorage.getItem('userToken');
            const baseAmount = selectedRepayInvoice.isAll 
                ? (creditStats.totalPendingDues || selectedRepayInvoice.approvedAmount || 0)
                : ((selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0));

            // 1. Create order
            const orderRes = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/payments/invoice-order`,
                { invoiceId: selectedRepayInvoice._id, amount: baseAmount },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { orderId, amount, currency, keyId } = orderRes.data;

            // 2. Open Razorpay
            const options = {
                key: keyId,
                amount: amount.toString(),
                currency: currency,
                name: 'Logistics Scanner',
                description: selectedRepayInvoice.isAll ? 'Full Repayment of All Pending Invoices' : `Invoice Repayment - ${selectedRepayInvoice.lsId || 'Credit'}`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await axios.post(
                            `${import.meta.env.VITE_API_BASE_URL}/payments/invoice-verify`,
                            {
                                invoiceId: selectedRepayInvoice._id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        setSuccess('Payment verified successfully! All cleared invoices updated.');
                        setRepayModalOpen(false);
                        setSelectedRepayInvoice(null);
                        setShowOnlineBreakdown(false);
                        fetchLedger();
                        alert('Payment Successful & Invoices Cleared!');
                    } catch (verifyErr) {
                        console.error('Payment verification error:', verifyErr);
                        alert(verifyErr.response?.data?.message || 'Payment verification failed.');
                    }
                },
                theme: { color: '#0066FF' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment failed or was cancelled.');
            });
            rzp.open();

        } catch (err) {
            console.error('Error initiating payment:', err);
            alert(err.response?.data?.message || 'Failed to initiate online payment.');
        } finally {
            setPayOnlineLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('userToken');
            const [ledgerRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/wallet/ledger`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/credit-stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: null }))
            ]);
            
            setBalance(ledgerRes.data?.balance || 0);
            setTransactions(ledgerRes.data?.transactions || []);

            if (statsRes.data) {
                setCreditStats({
                    totalPendingDues: statsRes.data.totalPendingDues || 0,
                    totalPenalties: statsRes.data.totalPenalties || 0,
                    creditScore: statsRes.data.creditScore ?? 100,
                    creditRating: statsRes.data.creditRating || 'Excellent',
                    pendingCount: statsRes.data.pendingCount || 0,
                    overdueCount: statsRes.data.overdueCount || 0,
                    clearedCount: statsRes.data.clearedCount || 0,
                    scoreAudit: statsRes.data.scoreAudit || [],
                    pendingInvoices: statsRes.data.pendingInvoices || []
                });
            }
        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLoading(false);
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

            if (selectedRepayInvoice.isAll || selectedRepayInvoice._id === 'all') {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice/repay-all`, {
                    repaymentProofFile: uploadedProofUrl
                }, { headers: { Authorization: `Bearer ${token}` }});
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice/${selectedRepayInvoice._id}/repay`, {
                    repaymentProofFile: uploadedProofUrl
                }, { headers: { Authorization: `Bearer ${token}` }});
            }

            setRepayModalOpen(false);
            setSelectedRepayInvoice(null);
            setRepayProofFile(null);
            setShowOnlineBreakdown(false);
            fetchLedger(); // Refresh transactions
            setSuccess('Repayment submitted! Waiting for Admin verification.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error('Repay submit error:', err);
            alert(err.response?.data?.message || 'Failed to submit repayment');
        } finally {
            setRepaySubmitting(false);
        }
    };

    const handleRechargeBank = async (e) => {
        e.preventDefault();
        if (!rechargeAmount || rechargeAmount <= 0) return alert('Enter valid amount');
        if (!rechargeProofFile) return alert('Please upload screenshot for Bank transfer');

        try {
            setRechargeSubmitting(true);
            const token = localStorage.getItem('userToken');
            
            const formDataUpload = new FormData();
            formDataUpload.append('file', rechargeProofFile);
            const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formDataUpload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const uploadedProofUrl = uploadRes.data.url;

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/recharge/bank`, {
                amount: rechargeAmount,
                screenshot: uploadedProofUrl
            }, { headers: { Authorization: `Bearer ${token}` }});

            setRechargeModalOpen(false);
            setRechargeAmount('');
            setRechargeProofFile(null);
            fetchLedger();
            setSuccess('Recharge request submitted! Waiting for Admin verification.');
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to submit recharge request');
        } finally {
            setRechargeSubmitting(false);
        }
    };

    const handleRechargeOnline = async () => {
        if (!rechargeAmount || rechargeAmount <= 0) return alert('Enter valid amount');
        try {
            setRechargeOnlineLoading(true);
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) return alert('Razorpay failed to load.');

            const token = localStorage.getItem('userToken');
            const orderRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/recharge/gateway/create-order`, 
                { amount: rechargeAmount }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const { orderId, amount, currency, keyId } = orderRes.data;

            const options = {
                key: keyId,
                amount: amount.toString(),
                currency: currency,
                name: 'Logistics Scanner',
                description: 'Wallet Recharge',
                order_id: orderId,
                handler: async function (response) {
                    try {
                        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/recharge/gateway/verify`, {
                            amount: rechargeAmount,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        
                        setSuccess('Wallet Recharged Successfully!');
                        setTimeout(() => setSuccess(''), 4000);
                        setRechargeModalOpen(false);
                        setRechargeAmount('');
                        fetchLedger();
                    } catch (err) {
                        alert(err.response?.data?.message || 'Verification failed');
                    }
                },
                theme: { color: '#00b2fe' }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed!');
            });
            rzp.open();
        } catch (err) {
            console.error(err);
            alert('Failed to initiate online recharge');
        } finally {
            setRechargeOnlineLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Credit System Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Wallet Balance Card */}
                <div className="bg-gradient-to-br from-[#0B1E43] to-[#1a3668] rounded-3xl p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div>
                        <div className="flex items-center gap-2 text-blue-200 mb-2">
                            <Wallet size={18} />
                            <span className="font-bold text-xs tracking-widest uppercase">Available Wallet Limit</span>
                        </div>
                        <div className="flex items-end gap-1.5 mt-2">
                            <IndianRupee className="w-6 h-6 mb-1 text-blue-300" />
                            <h2 className="text-3xl font-black tracking-tight">
                                {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button 
                            onClick={() => setRechargeModalOpen(true)}
                            className="w-full bg-[#00b2fe] hover:bg-[#009bdf] text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                            <ArrowUpRight className="w-4 h-4" /> Recharge
                        </button>
                        <button 
                            onClick={() => {
                                if (creditStats.totalPendingDues > 0 || (creditStats.pendingInvoices && creditStats.pendingInvoices.length > 0)) {
                                    setSelectedRepayInvoice({
                                        isAll: true,
                                        _id: 'all',
                                        lsId: `All Pending Invoices (${creditStats.pendingCount || creditStats.pendingInvoices?.length || 1})`,
                                        approvedAmount: creditStats.totalPendingDues,
                                        penaltyAmount: 0,
                                        processingFee: 0,
                                        totalDue: creditStats.totalPendingDues
                                    });
                                    setShowOnlineBreakdown(false);
                                    setRepayModalOpen(true);
                                } else {
                                    const pendingInvoiceTxns = transactions.filter(t => t.type === 'Debit' && t.referenceId && (t.referenceId.status === 'Approved' || t.referenceId.status === 'Paid' || t.referenceId.status === 'Repayment Pending'));
                                    if (pendingInvoiceTxns.length > 0) {
                                        setSelectedRepayInvoice(pendingInvoiceTxns[0].referenceId);
                                        setShowOnlineBreakdown(false);
                                        setRepayModalOpen(true);
                                    } else {
                                        alert('No pending invoices found to repay. All dues are clear!');
                                    }
                                }
                            }}
                            className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border border-white/20"
                        >
                            <CreditCard className="w-4 h-4" /> Repay
                        </button>
                    </div>
                </div>

                {/* 2. Pending Invoice Dues Card */}
                <div className="bg-gradient-to-br from-rose-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between border border-rose-500/20">
                    <div>
                        <div className="flex items-center justify-between text-rose-200 mb-2">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={18} className="text-rose-400" />
                                <span className="font-bold text-xs tracking-widest uppercase">Pending Invoice Dues</span>
                            </div>
                            {creditStats.pendingCount > 0 && (
                                <span className="bg-rose-500/30 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-400/30">
                                    {creditStats.pendingCount} Pending
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-1.5 mt-2">
                            <IndianRupee className="w-6 h-6 mb-1 text-rose-300" />
                            <h2 className="text-3xl font-black tracking-tight text-rose-100">
                                {creditStats.totalPendingDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-rose-200/80">
                        <span>Penalties Accrued:</span>
                        <span className="font-black text-rose-300 flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {creditStats.totalPenalties.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* 3. Credit Health & Auto-Deduct Status */}
                <div 
                    onClick={() => setScoreModalOpen(true)}
                    className={`bg-gradient-to-br ${creditStats.creditScore < 40 ? 'from-rose-950 to-slate-900 border-rose-500/30' : creditStats.creditScore < 80 ? 'from-amber-950 to-slate-900 border-amber-500/30' : 'from-emerald-950 to-slate-900 border-emerald-500/30'} rounded-3xl p-6 text-white relative overflow-hidden shadow-xl flex flex-col justify-between border cursor-pointer hover:scale-[1.01] transition-all group`}
                    title="Click to view detailed LS Score Audit & Summary"
                >
                    <div>
                        <div className="flex items-center justify-between text-emerald-200 mb-2">
                            <div className="flex items-center gap-2">
                                <Award size={18} className={creditStats.creditScore < 40 ? 'text-rose-400' : creditStats.creditScore < 80 ? 'text-amber-400' : 'text-emerald-400'} />
                                <span className="font-bold text-xs tracking-widest uppercase">LS SCORE</span>
                            </div>
                            <span className={`font-black text-xs px-2 py-0.5 rounded-full ${creditStats.creditScore < 40 ? 'bg-rose-500/20 text-rose-300' : creditStats.creditScore < 80 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                {creditStats.creditScore}/100 ({creditStats.creditRating || 'Good'})
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden p-0.5 border border-white/10">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${creditStats.creditScore < 40 ? 'bg-rose-500' : creditStats.creditScore < 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}`}
                                style={{ width: `${Math.min(100, Math.max(5, creditStats.creditScore))}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Auto-Clear Active</span>
                        </span>
                        <span className="text-[10px] text-amber-300 underline font-black group-hover:translate-x-0.5 transition-transform">
                            View Audit Summary &rarr;
                        </span>
                    </div>
                </div>
            </div>

            {/* Itemized Pending Dues & Penalties Breakdown */}
            {creditStats.pendingInvoices && creditStats.pendingInvoices.length > 0 && (
                <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl p-6 border border-rose-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-rose-900">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <h3 className="text-lg font-black tracking-tight">Active Pending Invoices & Penalties Breakdown</h3>
                        </div>
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
                            {creditStats.pendingInvoices.length} Unpaid Repayment(s)
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-rose-100/60 border-b border-rose-200 text-rose-900 text-xs font-black uppercase">
                                    <th className="px-4 py-3">Invoice LS ID</th>
                                    <th className="px-4 py-3">Approved Base</th>
                                    <th className="px-4 py-3">Processing Fee</th>
                                    <th className="px-4 py-3 text-rose-600">Accrued Penalty</th>
                                    <th className="px-4 py-3">Due Date / Status</th>
                                    <th className="px-4 py-3 text-right">Total Payable</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100 text-sm">
                                {creditStats.pendingInvoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-rose-50/50">
                                        <td className="px-4 py-3 font-black text-slate-800">
                                            {inv.lsId}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            ₹{(inv.approvedAmount || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-600">
                                            ₹{(inv.processingFee || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 font-black text-rose-600">
                                            {inv.penaltyAmount > 0 ? (
                                                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-xs">
                                                    + ₹{inv.penaltyAmount.toLocaleString('en-IN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-normal">₹0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {inv.isOverdue ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md border border-rose-300">
                                                    <Clock className="w-3 h-3" /> Overdue by {inv.daysOverdue} day(s)
                                                </span>
                                            ) : inv.timelineDate ? (
                                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" /> Due: {new Date(inv.timelineDate).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">Standard</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-rose-900 text-base">
                                            ₹{(inv.totalDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedRepayInvoice(inv);
                                                    setShowOnlineBreakdown(false);
                                                    setRepayModalOpen(true);
                                                }}
                                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                            >
                                                Repay Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">{success}</span>
                </div>
            )}

            {/* Transactions Ledger */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                        <History size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#0B1E43]">Transaction Ledger</h2>
                        <p className="text-sm font-semibold text-slate-500">Detailed history of your wallet debits and credits</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Balance After</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        <span className="text-sm font-bold">Loading ledger...</span>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <History className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <span className="text-sm font-bold block">No transactions yet.</span>
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{new Date(txn.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-400 font-semibold">{new Date(txn.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700 whitespace-normal min-w-[200px] block">
                                                {txn.description}
                                            </span>
                                            {txn.type === 'Debit' && txn.referenceId && (txn.referenceId.status === 'Approved' || txn.referenceId.status === 'Paid') && (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedRepayInvoice(txn.referenceId);
                                                        setShowOnlineBreakdown(false);
                                                        setRepayModalOpen(true);
                                                    }}
                                                    className="mt-2 bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-block"
                                                >
                                                    Repay Invoice
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {txn.type === 'Credit' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                                                    <ArrowUpRight className="w-3.5 h-3.5" /> CREDIT
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                                                    <ArrowDownRight className="w-3.5 h-3.5" /> DEBIT
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black flex items-center justify-end ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {txn.type === 'Credit' ? '+' : '-'} <IndianRupee className="w-3.5 h-3.5 mx-0.5" /> {txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-[#0B1E43] flex items-center justify-end">
                                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                                                {txn.balanceAfter ? txn.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Repay Modal */}
            {repayModalOpen && selectedRepayInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-[#0B1E43]">
                                    {selectedRepayInvoice.isAll ? 'Repay All Pending Dues' : 'Repay Invoice'}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">
                                    {selectedRepayInvoice.isAll 
                                        ? `Total Dues Across ${creditStats.pendingCount || creditStats.pendingInvoices?.length || 1} Invoices` 
                                        : `Invoice LS ID: ${selectedRepayInvoice.lsId || 'N/A'}`}
                                </p>
                            </div>
                            <button onClick={() => { setRepayModalOpen(false); setSelectedRepayInvoice(null); setShowOnlineBreakdown(false); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shadow-sm">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRepaySubmit} className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 text-center">
                                {!showOnlineBreakdown && (
                                    <>
                                        <p className="text-sm font-bold text-slate-500">Please transfer the amount to:</p>
                                        <p className="text-lg font-black text-[#0B1E43]">BNB WORLDWIDE PVT LTD</p>
                                        <p className="text-sm font-black text-slate-700">Bank: AXIS BANK</p>
                                        <p className="text-sm font-black text-slate-700">A/C: 925020028362256</p>
                                        <p className="text-sm font-black text-slate-700">IFSC: UTIB0001147</p>
                                        <p className="text-sm font-black text-slate-700">Branch: JANAK PURI B BLOCK</p>
                                        <p className="text-sm font-black text-slate-700 mb-2">SWIFT: AXISINBB207</p>
                                        <div className="pt-2 border-t border-slate-200">
                                            <span className="text-xs font-bold text-slate-500">
                                                {selectedRepayInvoice.isAll ? 'Total Outstanding Amount to Pay' : 'Amount to Pay'}
                                            </span>
                                            <span className="text-2xl font-black text-amber-600 flex items-center justify-center mt-0.5">
                                                <IndianRupee className="w-5 h-5 mr-0.5" />
                                                {(selectedRepayInvoice.isAll 
                                                    ? (creditStats.totalPendingDues || selectedRepayInvoice.approvedAmount || 0)
                                                    : ((selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0))
                                                ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </>
                                )}
                                
                                {showOnlineBreakdown && (() => {
                                    const baseAmount = selectedRepayInvoice.isAll 
                                        ? (creditStats.totalPendingDues || selectedRepayInvoice.approvedAmount || 0)
                                        : ((selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0));
                                    const gatewayCharge = baseAmount * 0.02;
                                    const gstAmount = gatewayCharge * 0.18;
                                    const finalAmount = baseAmount + gatewayCharge + gstAmount;
                                    
                                    return (
                                        <div className="text-left space-y-1">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Base Amount {selectedRepayInvoice.isAll && '(All Invoices)'}</span>
                                                <span className="flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5" /> {baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Gateway Charge (2%)</span>
                                                <span className="flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5" /> {gatewayCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 text-red-500">
                                                <span>GST (18% only on Gateway Charge)</span>
                                                <span className="flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5" /> {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-black text-[#0B1E43] pt-2 border-t border-slate-200 mt-2">
                                                <span>Total Payable (Online)</span>
                                                <span className="flex items-center text-amber-600 font-black text-base"><IndianRupee className="w-4 h-4 mr-0.5" /> {finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {!showOnlineBreakdown ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Attach Payment Screenshot (Mandatory for Pay Bank)</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setRepayProofFile(e.target.files[0])}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-colors file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                            accept="image/*,.pdf"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowOnlineBreakdown(true)}
                                            className="w-full bg-[#0066FF] text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-[#0052cc] flex items-center justify-center gap-2"
                                        >
                                            Pay Card / UPI
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={repaySubmitting}
                                            className="w-full bg-amber-600 text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-amber-700 flex items-center justify-center gap-2"
                                        >
                                            {repaySubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Pay Bank
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowOnlineBreakdown(false)}
                                        className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-slate-200 flex items-center justify-center gap-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePayOnline}
                                        disabled={payOnlineLoading}
                                        className="w-full bg-[#0066FF] text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-[#0052cc] flex items-center justify-center gap-2"
                                    >
                                        {payOnlineLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Proceed to Pay
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Recharge Modal */}
            {rechargeModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-black text-[#0B1E43]">Recharge Wallet</h3>
                            <button onClick={() => setRechargeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleRechargeBank} className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Recharge Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={rechargeAmount}
                                    onChange={(e) => setRechargeAmount(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                                    placeholder="Enter amount"
                                />
                            </div>

                            {!showRechargeOnlineBreakdown ? (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                                        <p className="text-xs font-bold text-slate-600 mb-2">Please transfer the amount to:</p>
                                        <h4 className="font-black text-slate-800 text-lg mb-2">BNB WORLDWIDE PVT LTD</h4>
                                        <div className="space-y-1 text-sm font-bold text-slate-600">
                                            <p>Bank: AXIS BANK</p>
                                            <p>A/C: 925020028362256</p>
                                            <p>IFSC: UTIB0001147</p>
                                            <p>Branch: JANAK PURI B BLOCK</p>
                                            <p>SWIFT: AXISINBB207</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Attach Payment Screenshot (Mandatory for Pay Bank)
                                        </label>
                                        <input 
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setRechargeProofFile(e.target.files[0])}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-xl cursor-pointer"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowRechargeOnlineBreakdown(true)}
                                            className="w-full bg-[#0066FF] text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-[#0052cc]"
                                        >
                                            Pay Card / UPI
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={rechargeSubmitting}
                                            className="w-full bg-amber-600 text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-amber-700 flex items-center justify-center gap-2"
                                        >
                                            {rechargeSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Pay Bank
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>Recharge Amount</span>
                                            <span>₹{Number(rechargeAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>Gateway Charge (2%)</span>
                                            <span>₹{(Number(rechargeAmount || 0) * 0.02).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold text-slate-600">
                                            <span>GST on Gateway Charge (18%)</span>
                                            <span>₹{(Number(rechargeAmount || 0) * 0.02 * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-[#0B1E43]">
                                            <span>Total Payable</span>
                                            <span>₹{(Number(rechargeAmount || 0) + (Number(rechargeAmount || 0) * 0.02) + (Number(rechargeAmount || 0) * 0.02 * 0.18)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowRechargeOnlineBreakdown(false)}
                                            className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-slate-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRechargeOnline}
                                            disabled={rechargeOnlineLoading}
                                            className="w-full bg-[#0066FF] text-white px-4 py-3 rounded-xl font-black text-sm transition-colors hover:bg-[#0052cc] flex items-center justify-center gap-2"
                                        >
                                            {rechargeOnlineLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Proceed to Pay
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* LS Score Audit & Breakdown Modal */}
            {scoreModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-900 to-[#0B1E43] text-white">
                            <div className="flex items-center gap-2.5">
                                <Award className="w-6 h-6 text-amber-400 shrink-0" />
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">LS Score Audit & Breakdown</h3>
                                    <p className="text-xs text-slate-300 font-bold">Complete summary of additions & deductions</p>
                                </div>
                            </div>
                            <button onClick={() => setScoreModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {/* Score Card Banner */}
                            <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                                creditStats.creditScore < 40 ? 'bg-rose-50 border-rose-200 text-rose-950' : creditStats.creditScore < 80 ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            }`}>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-75">Current Vendor LS Score</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-4xl font-black">{creditStats.creditScore}</span>
                                        <span className="text-sm font-bold opacity-60">/ 100</span>
                                    </div>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm ${
                                    creditStats.creditScore < 40 ? 'bg-rose-600 text-white' : creditStats.creditScore < 80 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>
                                    {creditStats.creditRating || 'Active'}
                                </span>
                            </div>

                            {/* Audit Items List */}
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Score Breakdown Audit Log (Kaise Kata / Badha)</h4>
                                <div className="space-y-3">
                                    {creditStats.scoreAudit && creditStats.scoreAudit.length > 0 ? (
                                        creditStats.scoreAudit.map((item, idx) => (
                                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                                                <div>
                                                    <h5 className="text-sm font-black text-slate-800">{item.title}</h5>
                                                    <p className="text-xs font-bold text-slate-500 mt-0.5">{item.reason}</p>
                                                </div>
                                                <span className={`text-sm font-black px-2.5 py-1 rounded-lg shrink-0 ${
                                                    item.pointsValue > 0 ? 'bg-green-100 text-green-700' : item.pointsValue < 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {item.points}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-slate-50 p-4 rounded-xl text-center text-xs font-bold text-slate-500">
                                            No deduction logs recorded. Standard score of 100/100.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Rules & Score Growth Tips */}
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-blue-600" /> LS Score Guide (Score Kaise Badhaye?)
                                </h4>
                                <ul className="text-xs font-bold text-blue-800 space-y-1.5 list-disc list-inside pl-1">
                                    <li><b>Pay Dues On-Time</b>: Avoid invoice overdue dates to prevent <b>-20 Pts</b> penalties per invoice.</li>
                                    <li><b>Recharge Wallet</b>: Wallet recharges auto-clear oldest dues instantly.</li>
                                    <li><b>Repayment Bonus</b>: Every cleared invoice adds <b>+2 Bonus Points</b> back to your LS Score!</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <button onClick={() => setScoreModalOpen(false)} className="w-full bg-[#0B1E43] hover:bg-[#1a3668] text-white py-3 rounded-xl font-black text-sm transition-all shadow-md">
                                Close Breakdown
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletLedgerTab;
