import React, { useState, useEffect } from 'react';
import { FileText, Clock, User } from 'lucide-react';
import api from '../../api/axios';

const RMActivity = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.get('/rm/activity', {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            setLogs(res.data);
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError('Failed to load activity logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatActionType = (type) => {
        return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading activity logs...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        RM / Admin Activity Logs
                    </h3>
                    <button onClick={fetchLogs} className="text-sm text-blue-600 hover:underline">
                        Refresh
                    </button>
                </div>
                
                {error && <div className="m-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                                <th className="p-4 pl-6">Date & Time</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Performed By</th>
                                <th className="p-4">Target Vendor</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No activity logs found.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-50">
                                        <td className="p-4 pl-6 text-sm text-slate-500 flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {formatActionType(log.actionType)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-700 font-medium flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            {log.performedBy ? `${log.performedBy.name} (${log.performerModel})` : 'Unknown'}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {log.vendorId ? (log.vendorId.company || log.vendorId.name) : 'Unknown Vendor'}
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 font-mono bg-slate-50 rounded p-2">
                                            {JSON.stringify(log.details)}
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

export default RMActivity;
