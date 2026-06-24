import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, X, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VendorFinanceList = () => {
    const { reloadUserProfile, user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('userToken');
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // If the backend was not restarted, it might return a single object instead of an array.
            // Let's handle both gracefully to prevent the map error.
            if (Array.isArray(data)) {
                setApplications(data);
            } else if (data) {
                setApplications([data]);
            } else {
                setApplications([]);
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

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

    const handlePayFee = async (app) => {
        if (!window.confirm(`Are you sure you want to pay the documentation fee of ₹${Number(app.processingFees).toLocaleString('en-IN')}?`)) return;
        try {
            // 1. Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert('Razorpay SDK failed to load. Please check your internet connection.');
                return;
            }

            const token = localStorage.getItem('userToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // 2. Create Razorpay Order
            const orderRes = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/finance/${app._id}/razorpay-order`,
                {},
                config
            );

            const { orderId, amount, currency, keyId } = orderRes.data;

            // 3. Open Razorpay Checkout Modal
            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'Logistics Scanner',
                description: `Pay Documentation Fees for Credit Limit Activation`,
                order_id: orderId,
                handler: async function (response) {
                    try {
                        // 4. Verify Payment on Backend
                        await axios.post(
                            `${import.meta.env.VITE_API_BASE_URL}/finance/${app._id}/verify-payment`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            config
                        );

                        alert('Documentation fee paid successfully! Approved limit is now active in your wallet.');
                        
                        // Refresh user profile in context to update header balance
                        if (reloadUserProfile) {
                            await reloadUserProfile();
                        }
                        
                        fetchApplications();
                    } catch (verifyErr) {
                        console.error('Payment verification error:', verifyErr);
                        alert(verifyErr.response?.data?.message || 'Payment verification failed.');
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#0066FF'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error('Error starting fee payment:', err);
            alert(err.response?.data?.message || 'Failed to initialize payment.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Finance List</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">View your submitted finance applications</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600">
                        <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6">#</th>
                                <th className="p-4">Director Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Mobile</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Processing Fees</th>
                                <th className="p-4">Reason</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                            {loading ? (
                                <tr><td colSpan="9" className="p-8 text-center text-slate-500">Loading applications...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan="9" className="p-8 text-center text-slate-500">No finance applications found.</td></tr>
                            ) : (
                                applications.map((app, index) => (
                                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6 text-slate-400">{index + 1}</td>
                                        <td className="p-4 text-slate-800">{app.director1?.name || '-'}</td>
                                        <td className="p-4 text-slate-500">{app.director1?.email || '-'}</td>
                                        <td className="p-4 text-slate-500">{app.director1?.mobile || '-'}</td>
                                        <td className="p-4 text-center">
                                            {app.adminStatus === 'Approved' ? (
                                                app.isFeePaid ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                        Approved & Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                                                        Approved (Fee Pending)
                                                    </span>
                                                )
                                            ) : (
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                    app.adminStatus === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {app.adminStatus}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-700">{app.approvedAmount ? `₹${Number(app.approvedAmount).toLocaleString('en-IN')}` : '-'}</td>
                                        <td className="p-4 text-slate-700">{app.processingFees ? `₹${Number(app.processingFees).toLocaleString('en-IN')}` : '-'}</td>
                                        <td className="p-4 text-red-650 max-w-[150px] truncate">{app.rejectionReason || '-'}</td>
                                        <td className="p-4 text-center">
                                            {app.adminStatus === 'Approved' ? (
                                                app.isFeePaid ? (
                                                    <span className="text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
                                                        <Wallet size={12} /> Limit Active
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 py-1">
                                                        <span className="text-[10px] text-amber-600 font-black animate-pulse uppercase tracking-wide">
                                                            Generate your wallet, please pay documentation fees
                                                        </span>
                                                        <button 
                                                            onClick={() => handlePayFee(app)}
                                                            className="bg-[#0066FF] hover:bg-[#0052cc] text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer shadow-sm shadow-blue-500/15"
                                                        >
                                                            Pay Fee & Activate Wallet
                                                        </button>
                                                    </div>
                                                )
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorFinanceList;
