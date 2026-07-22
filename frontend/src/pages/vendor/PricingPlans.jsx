import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2, Calendar, CheckCircle } from 'lucide-react';

const PricingPlans = () => {
    const { user, updateProfile } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [upgradingId, setUpgradingId] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState(null);
    const [activeTab, setActiveTab] = useState('regular');

    const logActivity = async (action, planDetails = {}, notes = '') => {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) return;
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/plans/activity`,
                { action, ...planDetails, notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to log activity', err);
        }
    };

    useEffect(() => {
        if (plans.length > 0) {
            logActivity('Viewed Plans');
        }
    }, [plans]);

    const isOutsideIndia = user?.country && user.country.toLowerCase() !== 'india' && user.country.toLowerCase() !== 'in';

    const getPlanDisplayPrice = (plan) => {
        if (plan.price === 0) return { currency: '', amount: 0, text: 'Free' };
        const sym = isOutsideIndia ? '$' : '₹';
        const locale = isOutsideIndia ? 'en-US' : 'en-IN';
        return { currency: sym, amount: plan.price, text: `${sym}${plan.price.toLocaleString(locale)}` };
    };

    const getCouponFinalDisplay = (coupon, plan) => {
        const sym = isOutsideIndia ? '$' : '₹';
        const locale = isOutsideIndia ? 'en-US' : 'en-IN';
        return { currency: sym, amount: coupon.finalPrice, text: `${sym}${coupon.finalPrice.toLocaleString(locale)}` };
    };

    // Coupon states
    const [couponCodes, setCouponCodes] = useState({}); // { planId: 'code' }
    const [appliedCoupons, setAppliedCoupons] = useState({}); // { planId: { code, discountAmount, finalPrice } }
    const [couponErrors, setCouponErrors] = useState({}); // { planId: 'error_msg' }

    const handleApplyCoupon = async (planId) => {
        const code = couponCodes[planId];
        if (!code) return;

        try {
            setCouponErrors(prev => ({ ...prev, [planId]: '' }));
            const token = localStorage.getItem('userToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/coupons/validate`,
                { code, planId },
                config
            );

            setAppliedCoupons(prev => ({
                ...prev,
                [planId]: {
                    code: res.data.code,
                    discountAmount: res.data.discountAmount,
                    finalPrice: res.data.finalPrice
                }
            }));
        } catch (err) {
            console.error('Coupon validation error:', err);
            setCouponErrors(prev => ({
                ...prev,
                [planId]: err.response?.data?.message || 'Invalid coupon code'
            }));
            setAppliedCoupons(prev => {
                const updated = { ...prev };
                delete updated[planId];
                return updated;
            });
        }
    };

    // Parse HTML description into key-value pairs
    const parseDescriptionToRows = (descriptionHtml) => {
        if (!descriptionHtml) return [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = descriptionHtml;
        const rows = [];

        const items = tempDiv.querySelectorAll('li, p, div, tr');
        if (items.length > 0) {
            items.forEach(item => {
                const text = item.textContent.trim();
                if (text && text.includes(':')) {
                    const parts = text.split(':');
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();
                    if (key && value) {
                        rows.push({ key, value });
                    }
                }
            });
        } else {
            const text = tempDiv.textContent || '';
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.trim() && line.includes(':')) {
                    const parts = line.split(':');
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();
                    if (key && value) {
                        rows.push({ key, value });
                    }
                }
            });
        }
        return rows;
    };

    useEffect(() => {
        if (user) {
            fetchPlans();
        }
    }, [user]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('userToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const userCountry = user.country || 'India';
            const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/plans?activeOnly=true&userType=${user.role}&country=${userCountry}`,
                config
            );

            let fetchedPlans = res.data || [];

            // Filter out plans based on vendor's service type
            if (user?.role === 'vendor') {
                const isOnlyLand = user?.services?.length === 1 && user.services[0].toLowerCase() === 'land';
                fetchedPlans = fetchedPlans.filter(plan => {
                    const type = plan.serviceType || 'All';
                    if (isOnlyLand) {
                        return type === 'Land'; // Land vendor sees ONLY Land plans
                    } else {
                        return type === 'All';  // Other vendors see ONLY All plans
                    }
                });
            }

            // Check if there is already a Free Plan in fetched plans
            const hasFree = fetchedPlans.some(p => p.price === 0);
            let finalPlans = [...fetchedPlans];

            if (!hasFree) {
                const freePlanStatic = {
                    _id: 'free_tier_static_id',
                    name: 'FREE',
                    price: 0,
                    duration: 'Monthly',
                    inquiryLimit: 5,
                    userType: user.role,
                    status: 'Active',
                    description: 'Alternate Name: Free Trial Tier\nAct as a White Label Site: No\nVendor Profile Listing: ✕\nWorldwide Visibility: Limited\nDirect enquiries: 5 Enquiries (Direct + My combined)\nDedicated Account Manager: ✕\nSupport: Standard'
                };
                finalPlans = [freePlanStatic, ...finalPlans];
            }

            setPlans(finalPlans);
        } catch (err) {
            console.error('Error fetching plans:', err);
            setError('Failed to fetch pricing plans.');
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

    const handleUpgrade = async (planId) => {
        if (planId === 'free_tier_static_id') return;
        if (!window.confirm('Are you sure you want to upgrade to this subscription plan?')) return;
        try {
            setUpgradingId(planId);
            setError('');
            setSuccessMessage('');

            // 1. Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setError('Razorpay SDK failed to load. Please check your internet connection.');
                setUpgradingId(null);
                return;
            }

            const token = localStorage.getItem('userToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // 2. Create Razorpay Order
            const orderRes = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/plans/razorpay-order`,
                {
                    planId,
                    couponCode: appliedCoupons[planId]?.code || null
                },
                config
            );

            logActivity('Clicked Upgrade Now', { planId, planName: orderRes.data.planName, amount: orderRes.data.amount });

            // 3. Show Payment Breakdown Modal
            setPaymentModalData({
                ...orderRes.data,
                planId,
                config
            });
            setShowPaymentModal(true);
            setUpgradingId(null);
        } catch (err) {
            console.error('Upgrade initiation error:', err);
            setError(err.response?.data?.message || 'Failed to initiate upgrade');
            setUpgradingId(null);
        }
    };

    const proceedToPay = async () => {
        if (!paymentModalData) return;
        setShowPaymentModal(false);
        setUpgradingId(paymentModalData.planId);

        const { orderId, amount, currency, keyId, planName, planId, config } = paymentModalData;

        logActivity('Proceeded to Payment Gateway', { planId, planName, amount });

        // Open Razorpay Checkout Modal
        const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'Logistics Scanner',
            description: `Upgrade to ${planName} Plan`,
            order_id: orderId,
            handler: async function (response) {
                try {
                    setUpgradingId(planId);
                    // Verify Payment on Backend
                    const verifyRes = await axios.post(
                        `${import.meta.env.VITE_API_BASE_URL}/plans/razorpay-verify`,
                        {
                            planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        },
                        config
                    );

                    setSuccessMessage(verifyRes.data.message || 'Subscription upgraded successfully!');
                    logActivity('Payment Success', { planId, planName, amount });

                    // Refresh user profile in context
                    if (updateProfile) {
                        await updateProfile(verifyRes.data.user);
                    } else {
                        window.location.reload();
                    }
                } catch (verifyErr) {
                    console.error('Payment verification error:', verifyErr);
                    setError(verifyErr.response?.data?.message || 'Payment verification failed.');
                } finally {
                    setUpgradingId(null);
                }
            },
            prefill: {
                name: user?.name || '',
                email: user?.email || '',
                contact: user?.phone || ''
            },
            theme: {
                color: '#0066FF'
            },
            modal: {
                ondismiss: function () {
                    setUpgradingId(null);
                }
            }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response) {
            logActivity('Payment Failed', { planId, planName, amount }, response.error?.description || 'Payment Failed');
            setError('Payment failed or was cancelled.');
            setUpgradingId(null);
        });
        rzp1.open();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#0066FF]" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading subscription plans...</p>
            </div>
        );
    }

    // Determine current active plan details
    const activePlanId = user?.activePlan?._id || user?.activePlan;
    const activePlanName = user?.activePlan?.name || (activePlanId ? 'Premium Plan' : 'Free Trial Tier');

    // Sort plans: Active plan first, then by price ascending
    const sortedPlans = [...plans].sort((a, b) => {
        const isCurrentA = a._id === 'free_tier_static_id' ? !activePlanId : activePlanId === a._id;
        const isCurrentB = b._id === 'free_tier_static_id' ? !activePlanId : activePlanId === b._id;
        if (isCurrentA && !isCurrentB) return -1;
        if (!isCurrentA && isCurrentB) return 1;
        return a.price - b.price;
    });

    const regularPlans = sortedPlans.filter(p => p.planType !== 'Topup');
    const topupPlans = sortedPlans.filter(p => p.planType === 'Topup');

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 pb-12">
            {/* Header */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
                <h1 className="text-3xl font-black text-[#0B1E43] tracking-tight">Upgrade Your Plan</h1>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    Select a tier tailored to your logistics requirements in <span className="text-[#0066FF] font-black">{user?.address || user?.country || 'your country'}</span>
                </p>
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 max-w-xl mx-auto">
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 max-w-xl mx-auto">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Expanded Current Active Plan Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Subscription Status</span>
                        <h3 className="text-base font-black text-[#0B1E43] tracking-tight flex items-center gap-1.5">
                            <ShieldCheck className="text-emerald-500 w-5 h-5" /> {activePlanName}
                        </h3>
                    </div>
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${activePlanId && user?.activePlan?.price > 0 ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-amber-50 border border-amber-100 text-amber-600'
                        }`}>
                        {activePlanId && user?.activePlan?.price > 0 ? 'Premium Subscribed' : 'Free Tier Active'}
                    </div>
                </div>

                {/* Stat Grid displaying plan details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Price Paid</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                            {user?.activePlan?.price !== undefined ? getPlanDisplayPrice(user.activePlan).text : '0'}
                        </span>
                    </div>
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Billing Cycle</span>
                        <span className="font-extrabold text-slate-800 text-sm mt-0.5 block capitalize">
                            {user?.activePlan?.duration || 'Monthly'}
                        </span>
                    </div>
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Enquiry Limit</span>
                        <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">
                            {user?.activePlan?.inquiryLimit ? `${user.activePlan.inquiryLimit + (user?.topupEnquiryLimit || 0)} Enquiries Per month` : '5 Enquiries /monthly'}
                        </span>
                    </div>
                    <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Valid Until</span>
                        <span className="font-extrabold text-slate-800 text-[11px] mt-0.5 block">
                            {user?.planEndDate ? formatDate(user.planEndDate) : 'Lifetime Free'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs for switching between Regular and Top-up Plans */}
            <div className="flex justify-center gap-4 border-b border-slate-200 pb-2 max-w-xl mx-auto mt-12 mb-6">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`pb-2 px-4 text-sm font-black uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'regular'
                            ? 'border-[#0066FF] text-[#0066FF]'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Regular Plans
                </button>
                <button
                    onClick={() => setActiveTab('topup')}
                    className={`pb-2 px-4 text-sm font-black uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'topup'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Top-up Plans
                </button>
            </div>

            {/* Content based on Active Tab */}
            {activeTab === 'regular' ? (
                /* Regular Plans List Grid */
                regularPlans.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            No active premium plans configured for your region or profile yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-stretch justify-center gap-8 pt-6 overflow-x-auto pb-4 lg:overflow-x-visible">
                        {regularPlans.map((plan) => {
                            const isCurrent = plan._id === 'free_tier_static_id' ? !activePlanId : activePlanId === plan._id;

                            // Parse description HTML into dynamic comparison rows
                            const parsedRows = parseDescriptionToRows(plan.description);

                            return (
                                <div
                                    key={plan._id}
                                    className={`bg-white rounded-3xl border flex flex-col justify-between relative transition-all duration-300 w-full lg:w-80 shrink-0 ${isCurrent
                                            ? 'border-slate-300 bg-slate-50/20 shadow-md scale-95 opacity-90'
                                            : 'border-[#0066FF] shadow-[0_20px_50px_rgba(0,102,255,0.12)] scale-100 lg:scale-105 z-10 hover:scale-[1.07]'
                                        }`}
                                    style={{ minHeight: '620px' }}
                                >
                                    {/* Ribbon */}
                                    {isCurrent ? (
                                        <div className="absolute top-0 right-0 overflow-hidden w-28 h-28">
                                            <div className="absolute top-4 right-[-32px] transform rotate-45 bg-slate-400 text-white text-[8px] font-black uppercase tracking-widest py-1 w-32 text-center shadow-sm">
                                                OWNED
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute top-0 right-0 overflow-hidden w-28 h-28">
                                            <div className="absolute top-4 right-[-32px] transform rotate-45 bg-[#0066FF] text-white text-[8px] font-black uppercase tracking-widest py-1 w-32 text-center shadow-sm">
                                                UPGRADE
                                            </div>
                                        </div>
                                    )}

                                    {/* Header section: Plan Details, Price & Coupon */}
                                    <div className={`p-6 flex flex-col items-center text-center space-y-4 border-b border-slate-100 rounded-t-3xl ${isCurrent ? 'bg-slate-100/50' : 'bg-white'
                                        }`}>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{plan.name}</h3>
                                        <div className="flex flex-col items-center">
                                            {appliedCoupons[plan._id] ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-semibold text-slate-400 line-through">
                                                            {getPlanDisplayPrice(plan).text}.00
                                                        </span>
                                                        <span className="text-3xl font-black text-green-600 tracking-tight">
                                                            {getCouponFinalDisplay(appliedCoupons[plan._id], plan).text}.00
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-green-600 font-extrabold uppercase mt-1">
                                                        Code {appliedCoupons[plan._id].code} Applied ({getPlanDisplayPrice(plan).currency}{appliedCoupons[plan._id].discountAmount} Off)
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={`text-3xl font-black tracking-tight ${isCurrent ? 'text-slate-600' : 'text-[#0066FF]'}`}>
                                                    {getPlanDisplayPrice(plan).text}{plan.price > 0 ? '.00' : ''}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">/ {plan.duration}</span>
                                        </div>

                                        {/* Coupon Input with Apply Button */}
                                        <div className="w-full">
                                            <div className="flex gap-2 w-full pt-1">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Coupon Code"
                                                    disabled={isCurrent || plan.price === 0}
                                                    value={couponCodes[plan._id] || ''}
                                                    onChange={(e) => setCouponCodes(prev => ({ ...prev, [plan._id]: e.target.value }))}
                                                    className="flex-grow bg-[#f4f7fc] border border-slate-200 rounded-xl px-3 py-2 text-center text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0066FF] placeholder-slate-400/90 disabled:opacity-60 transition-colors uppercase"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={isCurrent || !couponCodes[plan._id] || plan.price === 0}
                                                    onClick={() => handleApplyCoupon(plan._id)}
                                                    className="bg-slate-200 hover:bg-[#0066FF] hover:text-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                            {couponErrors[plan._id] && (
                                                <div className="text-[9px] text-red-500 font-bold text-center mt-1.5 uppercase tracking-wide">
                                                    {couponErrors[plan._id]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upgrade Action Button */}
                                        <button
                                            type="button"
                                            disabled={isCurrent || upgradingId === plan._id || plan.price === 0}
                                            onClick={() => handleUpgrade(plan._id)}
                                            className={`w-full flex justify-center items-center py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${isCurrent
                                                    ? 'bg-slate-450 text-slate-700 cursor-default border border-slate-300'
                                                    : plan.price === 0
                                                        ? 'bg-slate-200 text-slate-500 cursor-default'
                                                        : 'bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-md shadow-[#0066FF]/10 active:scale-98 disabled:opacity-75'
                                                }`}
                                        >
                                            {upgradingId === plan._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isCurrent ? (
                                                'Current Active Plan'
                                            ) : plan.price === 0 ? (
                                                'Free Plan'
                                            ) : (
                                                <span>Upgrade Now</span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Comparison Table */}
                                    <div className="flex-1 p-4 bg-slate-50/20 flex flex-col justify-between rounded-b-3xl">
                                        <div className="border border-slate-350 rounded-xl overflow-hidden bg-white shadow-sm">
                                            <table className="w-full text-[10px] text-left border-collapse table-fixed">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-350 font-black text-slate-800 uppercase tracking-wider text-[9px]">
                                                        <th className="p-2 border-r border-slate-350 w-1/2">Features / Plans</th>
                                                        <th className="p-2 w-1/2">{plan.name} {plan.price > 0 ? '(Paid)' : ''}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-350 text-slate-700 font-semibold">
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Alternate Name</td>
                                                        <td className="p-2">{plan.name} pricing</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Enquiry acceptence Limit</td>
                                                        <td className="p-2">
                                                            {plan.price === 0
                                                                ? '5 Enquiries (Direct + My combined)'
                                                                : `${plan.inquiryLimit} Enquiries`
                                                            }
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Act as a White Label Site</td>
                                                        <td className="p-2">{plan.price > 1000 ? 'Yes' : 'No'}</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Vendor Profile Listing</td>
                                                        <td className="p-2">{plan.price > 0 ? '✓' : '✕'}</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Worldwide Visibility</td>
                                                        <td className="p-2">{plan.price > 0 ? '✓' : 'Limited'}</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Direct Number of enquiries</td>
                                                        <td className="p-2">{plan.price > 0 ? 'Unlimited' : 'Only 5 accepted'}</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Dedicated Account Manager</td>
                                                        <td className="p-2">{plan.price > 5000 ? '✓' : '✕'}</td>
                                                    </tr>
                                                    <tr className="border-b border-slate-350">
                                                        <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">Support</td>
                                                        <td className="p-2">{plan.price > 0 ? 'Premium 24/7' : 'Standard'}</td>
                                                    </tr>

                                                    {/* Render dynamic key-value rows parsed from description */}
                                                    {parsedRows.map((row, idx) => {
                                                        // Avoid duplicating static keys
                                                        const isStaticKey = ['alternate name', 'monthly price', 'enquiry limit', 'act as a white label site', 'vendor profile listing', 'worldwide visibility', 'direct enquiries', 'dedicated account manager', 'support'].includes(row.key.toLowerCase());
                                                        if (isStaticKey) return null;
                                                        return (
                                                            <tr key={idx} className="border-b border-slate-350">
                                                                <td className="p-2 bg-slate-50/80 border-r border-slate-350 font-extrabold text-slate-500">{row.key}</td>
                                                                <td className="p-2">{row.value}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Fallback description render if no key-values parsed */}
                                        {plan.description && parsedRows.length === 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-500 font-semibold">
                                                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">Additional Specifications</span>
                                                <div
                                                    className="space-y-1.5 text-slate-600 pricing-plan-description"
                                                    dangerouslySetInnerHTML={{ __html: plan.description }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* Top-up Plans List Grid */
                topupPlans.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                            No Top-up plans configured yet.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6 pt-6">
                        {topupPlans.map((plan) => (
                            <div key={plan._id} className="bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 shadow-sm p-5 flex flex-col justify-between w-full max-w-xs relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest">{plan.name}</h3>
                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider mt-1 inline-block">Top-up</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-slate-800">{getPlanDisplayPrice(plan).text}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 p-3 rounded-xl border border-white space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-500">Extra Limits</span>
                                            <span className="font-black text-purple-700">+{plan.inquiryLimit} Enquiries</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-500">Validity</span>
                                            <span className="font-black text-slate-700">{plan.duration}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={upgradingId === plan._id || !user?.activePlan?.price || user.activePlan.price <= 0}
                                        onClick={() => handleUpgrade(plan._id)}
                                        className="w-full flex justify-center items-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={(!user?.activePlan?.price || user.activePlan.price <= 0) ? 'You must be on a paid Premium Plan to buy a Top-up' : ''}
                                    >
                                        {upgradingId === plan._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            (!user?.activePlan?.price || user.activePlan.price <= 0) ? 'Requires Paid Plan' : 'Buy Top-up'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Payment Breakdown Modal */}
            {showPaymentModal && paymentModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-[#0066FF] p-5 text-center relative">
                            <h3 className="text-white font-black text-lg">Payment Summary</h3>
                            <p className="text-white/80 text-xs font-medium mt-1">Review your plan upgrade</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-sm">Plan Name</span>
                                <span className="text-slate-800 font-black text-sm">{paymentModalData.planName}</span>
                            </div>

                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-bold text-sm">Plan Amount</span>
                                <span className="text-slate-800 font-black text-sm">
                                    {paymentModalData.currency === 'INR' ? '₹' : '$'}{paymentModalData.finalPrice.toLocaleString()}
                                </span>
                            </div>

                            {paymentModalData.gstAmount > 0 && (
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold text-sm">GST (18%)</span>
                                    <span className="text-slate-800 font-black text-sm">
                                        + {paymentModalData.currency === 'INR' ? '₹' : '$'}{paymentModalData.gstAmount.toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[#0066FF] font-black text-base">Total Amount</span>
                                <span className="text-[#0066FF] font-black text-xl">
                                    {paymentModalData.currency === 'INR' ? '₹' : '$'}{paymentModalData.totalPriceWithGst.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentModalData(null);
                                    setUpgradingId(null);
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={proceedToPay}
                                className="flex-1 py-3 rounded-xl font-black text-white bg-[#0066FF] hover:bg-[#0052cc] shadow-md transition-colors"
                            >
                                Proceed to Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPlans;
