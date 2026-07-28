import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Wallet, ArrowDownRight, ArrowUpRight, Loader2, IndianRupee, Clock, History, CreditCard, XCircle, CheckCircle2 } from 'lucide-react';

const WalletLedgerTab = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
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
            const baseAmount = (selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0);

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
                description: 'Invoice Repayment',
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
                        
                        setSuccess('Payment verified successfully!');
                        setRepayModalOpen(false);
                        setSelectedRepayInvoice(null);
                        fetchLedger();
                        alert('Payment Successful!');
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
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/wallet/ledger`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalance(res.data?.balance || 0);
            setTransactions(res.data?.transactions || []);
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

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/finance/invoice/${selectedRepayInvoice._id}/repay`, {
                repaymentProofFile: uploadedProofUrl
            }, { headers: { Authorization: `Bearer ${token}` }});

            setRepayModalOpen(false);
            setSelectedRepayInvoice(null);
            setRepayProofFile(null);
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
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-[#0B1E43] to-[#1a3668] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-200 mb-2">
                            <Wallet size={20} />
                            <span className="font-bold text-sm tracking-widest uppercase">Available Wallet Limit</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <IndianRupee className="w-6 h-6 mb-1 text-blue-300" />
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                                {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={() => {
                                const pendingInvoiceTxns = transactions.filter(t => t.type === 'Debit' && t.referenceId && (t.referenceId.status === 'Approved' || t.referenceId.status === 'Paid'));
                                if (pendingInvoiceTxns.length > 0) {
                                    setSelectedRepayInvoice(pendingInvoiceTxns[0].referenceId);
                                    setRepayModalOpen(true);
                                } else {
                                    alert('No pending invoices found to repay. New approved invoices will appear here.');
                                }
                            }}
                            className="bg-white hover:bg-slate-50 text-[#0B1E43] px-5 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 shrink-0"
                        >
                            <CreditCard className="w-4 h-4" />
                            Repay Invoice
                        </button>

                        <button 
                            onClick={() => setRechargeModalOpen(true)}
                            className="bg-[#00b2fe] hover:bg-[#009bdf] text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 shrink-0 border border-white/20"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Recharge Wallet
                        </button>
                    </div>
                </div>
            </div>

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
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-[#0B1E43]">Repay Invoice</h3>
                            <button onClick={() => { setRepayModalOpen(false); setSelectedRepayInvoice(null); setShowOnlineBreakdown(false); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
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
                                            <span className="text-xs font-bold text-slate-500">Amount to Pay</span>
                                            <span className="text-xl font-black text-amber-600 flex items-center justify-center">
                                                <IndianRupee className="w-5 h-5 mr-0.5" />
                                                {((selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </>
                                )}
                                
                                {showOnlineBreakdown && (() => {
                                    const baseAmount = ((selectedRepayInvoice.approvedAmount || selectedRepayInvoice.amount || 0) + (selectedRepayInvoice.penaltyAmount || 0) + (selectedRepayInvoice.processingFee || 0));
                                    const gatewayCharge = baseAmount * 0.02;
                                    const gstAmount = gatewayCharge * 0.18;
                                    const finalAmount = baseAmount + gatewayCharge + gstAmount;
                                    
                                    return (
                                        <div className="text-left space-y-1">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Base Amount</span>
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
                                                <span className="flex items-center text-amber-600"><IndianRupee className="w-4 h-4 mr-0.5" /> {finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletLedgerTab;
