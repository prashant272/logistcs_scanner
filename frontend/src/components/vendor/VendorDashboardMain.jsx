import React, { useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { useAuth } from '../../context/AuthContext';
import EnquiryCardSection from './EnquiryCardSection';
import BookingSection from './BookingSection';
import FinanceSection from './FinanceSection';
import ComplaintsSection from './ComplaintsSection';
import UserProfileSection from './UserProfileSection';
import RelationshipManagerCard from './RelationshipManagerCard';
import { Calendar, RotateCcw, Menu, AlertCircle } from 'lucide-react';

const vendorStatsFetcher = async ([key, filterType, customStart, customEnd]) => {
    const token = localStorage.getItem('userToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const profileRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, config);
    const status = profileRes.data.verificationStatus || (profileRes.data.isVerified ? 'Approved' : 'Pending');

    let stats = { profile: profileRes.data, status, financeApp: null };
    stats.myEnquiries = { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 };
    stats.directEnquiries = { total: 0, accepted: 0, locked: 0, rejected: 0, declined: 0 };
    stats.myBookings = { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 };
    stats.directBookings = { total: 0, accepted: 0, declined: 0, upcomingPaymentDue: 0, dueIn5Days: 0 };

    try {
        const finRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/my`, config);
        if (finRes.data && finRes.data.length > 0) stats.financeApp = finRes.data[0];
    } catch (e) { }

    if (status === 'Approved') {
        let url = `${import.meta.env.VITE_API_BASE_URL}/enquiries/vendor/stats?`;

        let startDate, endDate;
        const now = new Date();

        if (filterType === 'Custom Date' && customStart && customEnd) {
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        } else if (filterType === 'Weekly') {
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
            endDate = new Date();
        } else if (filterType === 'Last 15 Days') {
            startDate = new Date();
            startDate.setDate(now.getDate() - 15);
            endDate = new Date();
        } else if (filterType === 'Monthly') {
            startDate = new Date();
            startDate.setMonth(now.getMonth() - 1);
            endDate = new Date();
        }

        if (startDate && endDate) {
            url += `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        }

        const res = await axios.get(url, config);
        stats = { ...stats, ...res.data };
    }
    return stats;
};

const VendorDashboardMain = () => {
    const { user } = useAuth();
    const [filterType, setFilterType] = useState('All Time');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const { data: stats, isLoading: loadingStats } = useSWR(
        ['vendorDashboardStats', filterType, customStart, customEnd],
        vendorStatsFetcher,
        { refreshInterval: 30000, revalidateOnFocus: true }
    );

    const vendorStatus = stats?.status || user?.verificationStatus || (user?.isVerified ? 'Approved' : 'Pending');
    const financeApp = stats?.financeApp || null;

    const myEnqTotal = stats?.myEnquiries?.total || 0;
    const myEnqLockedCount = stats?.myEnquiries?.locked || 0;
    const myEnqAccepted = stats?.myEnquiries?.accepted || 0;
    const myEnqRejected = stats?.myEnquiries?.rejected || 0;

    const directEnqTotal = stats?.directEnquiries?.total || 0;
    const directEnqLockedCount = stats?.directEnquiries?.locked || 0;
    const directEnqAccepted = stats?.directEnquiries?.accepted || 0;
    const directEnqRejected = stats?.directEnquiries?.rejected || 0;

    const myBookingsCount = stats?.myBookings?.total || 0;
    const directBookingsCount = stats?.directBookings?.total || 0;

    const getDateRangeDisplay = (rangeType) => {
        if (rangeType === 'Custom Date' && customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            return `${start.toLocaleDateString('en-GB', options)} - ${end.toLocaleDateString('en-GB', options)}`;
        }

        const now = new Date();
        let start = new Date();
        if (rangeType === 'Weekly') {
            start.setDate(now.getDate() - 7);
        } else if (rangeType === 'Last 15 Days') {
            start.setDate(now.getDate() - 15);
        } else if (rangeType === 'Monthly') {
            start.setMonth(now.getMonth() - 1);
        } else {
            return 'All Time Data';
        }

        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return `${start.toLocaleDateString('en-GB', options)} - ${now.toLocaleDateString('en-GB', options)}`;
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
    };

    return (
        <div className="space-y-6">
            {/* Pending Vendor Message Overlay */}
            {vendorStatus !== 'Approved' && user?.role !== 'admin' && (
                <div className="bg-white rounded-3xl p-10 border border-amber-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] text-center flex flex-col items-center justify-center min-h-[400px]">
                    <AlertCircle size={48} className="text-amber-500 mb-4" />
                    <h2 className="text-2xl font-black text-[#0B1E43] tracking-tight mb-2">Profile Action Required</h2>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-lg">
                        {vendorStatus === 'Declined'
                            ? 'Your profile registration has been declined. Please update your document or contact support.'
                            : 'Please go to the Profile tab and upload supporting documents like GST, Business PAN Card, or any other business supported documents.'}
                    </p>
                </div>
            )}

            {/* Verification Status Warning Card (kept for admin or other edge cases if needed) */}
            {user?.role === 'admin' && vendorStatus !== 'Approved' && (
                <div className={`p-5 rounded-3xl border flex items-center gap-4 shadow-[0_8px_30px_rgba(11,30,67,0.02)] ${vendorStatus === 'Declined'
                        ? 'bg-red-50/80 border-red-100 text-red-800'
                        : 'bg-amber-50/80 border-amber-100 text-amber-800'
                    }`}>
                    <AlertCircle size={22} className={vendorStatus === 'Declined' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
                    <div>
                        <h4 className="font-black text-xs uppercase tracking-wider">
                            Profile Status: {vendorStatus || 'Pending'}
                        </h4>
                        <p className="text-xs font-bold mt-1 text-slate-500 leading-relaxed">
                            {vendorStatus === 'Declined'
                                ? 'Your profile registration has been declined. Please update your document or contact support.'
                                : 'your profile should me pending and representive contact you shortly'}
                        </p>
                    </div>
                </div>
            )}

            {user?.role === 'admin' && (
                <div className="p-5 rounded-3xl border border-blue-100 bg-blue-50/80 text-blue-800 flex items-center gap-4 shadow-[0_8px_30px_rgba(11,30,67,0.02)]">
                    <AlertCircle size={22} className="text-blue-500 shrink-0" />
                    <div>
                        <h4 className="font-black text-xs uppercase tracking-wider">
                            you login vendor panel as a admin
                        </h4>
                    </div>
                </div>
            )}

            {/* Filter Strip */}
            <div className="bg-white border border-slate-100/80 shadow-[0_8px_30px_rgba(11,30,67,0.02)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Menu size={12} className="text-[#0066FF]" /> Filter Set
                    </span>
                    <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {['All Time', 'Monthly', 'Weekly', 'Last 15 Days', 'Custom Date'].map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    handleFilterChange(t);
                                    if (t !== 'Custom Date') {
                                        setCustomStart('');
                                        setCustomEnd('');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${filterType === t
                                        ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/15'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {filterType === 'Custom Date' && (
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-blue-200 animate-in fade-in zoom-in duration-200">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-400 font-bold">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    {/* Date Selector Display */}
                    <div className="bg-[#f4f7fc] border border-slate-100 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{getDateRangeDisplay(filterType) || 'Select Custom Dates'}</span>
                    </div>

                    <button className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer">
                        Apply Filter
                    </button>

                    <button
                        onClick={() => {
                            handleFilterChange('All Time');
                            setCustomStart('');
                            setCustomEnd('');
                        }}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <RotateCcw size={14} /> Clear
                    </button>
                </div>
            </div>

            {vendorStatus === 'Approved' || user?.role === 'admin' ? (
                <>
                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Data cards (8/12 width) */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* MY ENQUIRIES */}
                            <EnquiryCardSection
                                title="My Enquiries"
                                type="my"
                                enquiryCount={myEnqTotal}
                                acceptedCount={myEnqAccepted}
                                rejectedCount={myEnqRejected}
                                lockedCount={myEnqLockedCount}
                            />

                            {/* DIRECT ENQUIRIES */}
                            <EnquiryCardSection
                                title="Direct Enquiries"
                                type="direct"
                                enquiryCount={directEnqTotal}
                                acceptedCount={directEnqAccepted}
                                rejectedCount={directEnqRejected}
                                lockedCount={directEnqLockedCount}
                            />

                            {/* BOOKING AND FINANCE GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <BookingSection
                                    myBookingsCount={myBookingsCount}
                                    directBookingsCount={directBookingsCount}
                                />
                                <FinanceSection stats={stats} />
                            </div>

                            {/* COMPLAINTS */}
                            <ComplaintsSection stats={stats} />

                        </div>

                        {/* RIGHT COLUMN: Profile details, RM Detail, Finance query (4/12 width) */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* USER PROFILE CARD */}
                            <UserProfileSection user={user} />

                            {/* RM DETAIL CARD */}
                            {user?.assignedRM ? (
                                <RelationshipManagerCard
                                    title="Assigned RM"
                                    name={user.assignedRM.name}
                                    role="Relationship Manager"
                                    phone={user.assignedRM.mobile}
                                    email={user.assignedRM.email}
                                    isFinance={false}
                                />
                            ) : (
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No RM Assigned</p>
                                </div>
                            )}

                            {/* FINANCE QUERY CARD */}
                            <RelationshipManagerCard
                                title="Finance Detail"
                                name={financeApp?.adminStatus ? `Status: ${financeApp.adminStatus}` : "Not Applied"}
                                role={financeApp?.approvedAmount ? `Amount: ₹${financeApp.approvedAmount}` : "Finance Application"}
                                phone={financeApp?.processingFees ? `Fees: ₹${financeApp.processingFees}` : "Pending/N/A"}
                                email="info@logisticscanner.com"
                                isFinance={true}
                            />

                        </div>

                    </div>
                </>
            ) : null}
        </div>
    );
};

export default VendorDashboardMain;
