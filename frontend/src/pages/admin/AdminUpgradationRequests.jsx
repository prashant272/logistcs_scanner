import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Search, Calendar, ChevronRight, X, Clock, IndianRupee, ShieldCheck } from 'lucide-react';

const AdminUpgradationRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/plans/admin/upgrade-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.data || []);
            setError('');
        } catch (err) {
            console.error('Fetch error', err);
            setError('Failed to fetch upgradation requests.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredRequests = requests.filter(req => {
        if (!req.vendor) return false;
        const s = searchQuery.toLowerCase();
        return (
            (req.vendor.name && req.vendor.name.toLowerCase().includes(s)) ||
            (req.vendor.email && req.vendor.email.toLowerCase().includes(s)) ||
            (req.vendor.company && req.vendor.company.toLowerCase().includes(s))
        );
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0B1E43]">Upgradation Requests</h1>
                    <p className="text-sm font-semibold text-slate-500">Track vendor upgrade interests and activities.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold focus:outline-none focus:border-[#0066FF] transition-colors"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button 
                        onClick={fetchRequests}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <p className="text-slate-500 font-bold">No upgradation requests found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Vendor Details</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Current Plan</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Latest Activity</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map((req, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{req.vendor?.name}</span>
                                                <span className="text-xs font-semibold text-slate-500">{req.vendor?.company || 'No Company'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-600">{req.vendor?.email}</span>
                                                <span className="text-xs font-semibold text-slate-500">{req.vendor?.phone || 'No Mobile'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                {req.currentPlan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-semibold">{formatDate(req.latestActivity)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedVendor(req)}
                                                className="inline-flex items-center gap-1 bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                View Timeline
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Timeline Modal */}
            {selectedVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="text-xl font-black text-[#0B1E43] tracking-tight">{selectedVendor.vendor?.name}</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-0.5">{selectedVendor.vendor?.company}</p>
                            </div>
                            <button
                                onClick={() => setSelectedVendor(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-6">Activity Timeline</h4>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {selectedVendor.activities.map((act, index) => {
                                    let actionColor = 'bg-slate-500';
                                    let actionBg = 'bg-slate-50';
                                    if (act.action.includes('Payment Success')) {
                                        actionColor = 'bg-green-500'; actionBg = 'bg-green-50';
                                    } else if (act.action.includes('Failed')) {
                                        actionColor = 'bg-red-500'; actionBg = 'bg-red-50';
                                    } else if (act.action.includes('Clicked')) {
                                        actionColor = 'bg-blue-500'; actionBg = 'bg-blue-50';
                                    } else if (act.action.includes('Proceeded')) {
                                        actionColor = 'bg-amber-500'; actionBg = 'bg-amber-50';
                                    }

                                    return (
                                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${actionColor} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                                <Clock className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className={`font-black text-xs uppercase tracking-wider px-2 py-1 rounded ${actionBg} ${actionColor.replace('bg-', 'text-')}`}>
                                                        {act.action}
                                                    </div>
                                                    <time className="font-bold text-xs text-slate-400">{formatDate(act.createdAt)}</time>
                                                </div>
                                                {act.planDetails?.planName && (
                                                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500">Plan</span>
                                                            <span className="text-sm font-black text-slate-700">{act.planDetails.planName}</span>
                                                        </div>
                                                        {act.planDetails.amount > 0 && (
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-xs font-bold text-slate-500">Amount</span>
                                                                <span className="text-sm font-black text-[#0066FF] flex items-center">
                                                                    <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                                                    {act.planDetails.amount / 100}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {act.notes && (
                                                    <p className="mt-2 text-xs font-medium text-red-500 bg-red-50 p-2 rounded">{act.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUpgradationRequests;
