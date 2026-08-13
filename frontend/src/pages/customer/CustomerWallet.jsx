import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, IndianRupee, Loader2, ArrowUpRight, ArrowDownRight, History, CreditCard, XCircle } from 'lucide-react';

const CustomerWallet = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/wallet/ledger`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBalance(res.data.balance);
            setTransactions(res.data.transactions);
            window.dispatchEvent(new Event('walletUpdated'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching wallet ledger', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRechargeSubmitBank = async (e) => {
        e.preventDefault();
        if (!rechargeAmount || rechargeAmount <= 0) return alert('Enter valid amount');
        if (!rechargeProofFile) return alert('Please upload screenshot for Bank transfer');

        try {
            setRechargeSubmitting(true);
            const token = localStorage.getItem('userToken');
            
            // 1. Upload proof file to S3
            const formDataUpload = new FormData();
            formDataUpload.append('file', rechargeProofFile);
            
            const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formDataUpload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                }
            });
            const fileUrl = uploadRes.data.fileUrl || uploadRes.data.url;

            // 2. Submit Recharge Request
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/recharge/bank`, {
                amount: rechargeAmount,
                screenshot: fileUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Recharge request submitted successfully! It is pending admin approval.');
            setRechargeModalOpen(false);
            setRechargeAmount('');
            setRechargeProofFile(null);
            fetchData();
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
            if (!scriptLoaded) {
                alert('Razorpay SDK failed to load.');
                setRechargeOnlineLoading(false);
                return;
            }
            const token = localStorage.getItem('userToken');

            // 1. Create order
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
                        alert('Recharge successful!');
                        setRechargeModalOpen(false);
                        setRechargeAmount('');
                        fetchData();
                    } catch (err) {
                        alert(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: 'Customer User',
                    email: 'customer@example.com',
                },
                theme: { color: '#0066FF' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed: ' + response.error.description);
            });
            rzp.open();
        } catch (err) {
            console.error(err);
            alert('Failed to initiate online recharge');
        } finally {
            setRechargeOnlineLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">My Wallet</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Manage your wallet balance and transactions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Wallet Balance Card */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-[#0B1E43] to-[#1a3673] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-white/10 rounded-xl">
                                    <Wallet className="w-6 h-6 text-blue-200" />
                                </div>
                                <span className="font-semibold text-blue-100">Wallet Balance</span>
                            </div>
                            
                            <div className="mb-8">
                                <div className="text-4xl font-black flex items-center">
                                    <IndianRupee className="w-8 h-8 mr-1 opacity-80" />
                                    {(balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-sm text-blue-200 mt-2">Available for PTL Bookings</p>
                            </div>
                            
                            <button
                                onClick={() => setRechargeModalOpen(true)}
                                className="w-full py-3.5 bg-white text-[#0B1E43] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight className="w-5 h-5" />
                                Add Money
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Recent Transactions
                            </h2>
                        </div>
                        <div className="p-0">
                            {(!transactions || transactions.length === 0) ? (
                                <div className="p-12 text-center text-slate-500">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="font-semibold text-lg text-slate-700">No transactions yet</p>
                                    <p className="text-sm">Recharge your wallet to start making bookings.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto hide-scrollbar">
                                    {transactions.map((t) => (
                                        <div key={t._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                                    t.type === 'Credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {t.type === 'Credit' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{t.description}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        }) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className={`font-black text-lg flex items-center justify-end ${
                                                    t.type === 'Credit' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {t.type === 'Credit' ? '+' : '-'} <IndianRupee size={16} className="ml-0.5 mr-0.5" />{(t.amount || 0).toLocaleString('en-IN')}
                                                </div>
                                                {t.balanceAfter !== undefined && (
                                                    <p className="text-xs text-slate-400 font-semibold mt-1">Balance: ₹{t.balanceAfter}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recharge Wallet Modal */}
            {rechargeModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-[#0B1E43]">Add Money to Wallet</h2>
                            <button onClick={() => setRechargeModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleRechargeSubmitBank} className="p-6">
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
        </div>
    );
};

export default CustomerWallet;
