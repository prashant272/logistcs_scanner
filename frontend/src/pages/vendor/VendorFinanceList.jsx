import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, X } from 'lucide-react';

const VendorFinanceList = () => {
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Finance List</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">View your submitted finance applications</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600 whitespace-nowrap">
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
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                app.adminStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                                app.adminStatus === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {app.adminStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-700">{app.approvedAmount ? `₹${app.approvedAmount}` : '-'}</td>
                                        <td className="p-4 text-slate-700">{app.processingFees ? `₹${app.processingFees}` : '-'}</td>
                                        <td className="p-4 text-red-600 max-w-[150px] truncate">{app.rejectionReason || '-'}</td>
                                        <td className="p-4 text-center">
                                            {app.adminStatus === 'Approved' ? (
                                                <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black transition-colors">
                                                    Pay
                                                </button>
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
