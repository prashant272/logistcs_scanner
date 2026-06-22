import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileSpreadsheet, Eye, X, Check, XCircle } from 'lucide-react';

const AdminFinanceListing = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Update form state
    const [updateForm, setUpdateForm] = useState({
        adminStatus: '',
        approvedAmount: '',
        processingFees: '',
        rejectionReason: '',
        termsAndConditions: ''
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/finance/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(data);
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (app) => {
        setSelectedApp(app);
        setUpdateForm({
            adminStatus: app.adminStatus || 'Pending',
            approvedAmount: app.approvedAmount || '',
            processingFees: app.processingFees || '',
            rejectionReason: app.rejectionReason || '',
            termsAndConditions: app.termsAndConditions || ''
        });
    };

    const closeView = () => {
        setSelectedApp(null);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            setStatusUpdating(true);
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/finance/admin/${selectedApp._id}/status`, 
                updateForm, 
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            // Update local state
            setApplications(prev => prev.map(a => a._id === selectedApp._id ? data.app : a));
            alert('Application updated successfully!');
            closeView();
        } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update application');
        } finally {
            setStatusUpdating(false);
        }
    };

    const renderDocumentLink = (label, url) => {
        if (!url) return <span className="text-slate-400 text-xs italic">Not Uploaded</span>;
        return (
            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold uppercase">
                View {label}
            </a>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Finance Management</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Review and manage vendor finance/KYC applications</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-600">
                        <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6">#</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Carrier Id</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Processing Fees</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading applications...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">No finance applications found.</td></tr>
                            ) : (
                                applications.map((app, index) => (
                                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 pl-6 text-slate-400">{index + 1}</td>
                                        <td className="p-4 text-slate-800">
                                            {app.director1?.name || app.vendor?.name || 'N/A'}
                                        </td>
                                        <td className="p-4 font-mono text-slate-500">{app.carrierId}</td>
                                        <td className="p-4 text-slate-700">{app.approvedAmount ? `₹${app.approvedAmount}` : '-'}</td>
                                        <td className="p-4 text-slate-700">{app.processingFees ? `₹${app.processingFees}` : '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                app.adminStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                                app.adminStatus === 'Pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {app.adminStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleView(app)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 mx-auto transition-colors uppercase tracking-widest text-[10px]"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                        
                        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-black text-[#0B1E43]">Finance Application Details</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Carrier ID: {selectedApp.carrierId}</p>
                            </div>
                            <button onClick={closeView} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left Column: Data Display */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-[#0066FF] uppercase tracking-widest mb-4">Director 1 Details</h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <p className="text-xs"><span className="font-bold text-slate-500">Name:</span> <span className="text-slate-800 font-semibold">{selectedApp.director1?.name}</span></p>
                                        <p className="text-xs"><span className="font-bold text-slate-500">Email:</span> <span className="text-slate-800 font-semibold">{selectedApp.director1?.email}</span></p>
                                        <p className="text-xs"><span className="font-bold text-slate-500">Mobile:</span> <span className="text-slate-800 font-semibold">{selectedApp.director1?.mobile}</span></p>
                                        <div className="flex gap-4 pt-2 border-t border-slate-200">
                                            {renderDocumentLink('Aadhar', selectedApp.director1?.aadharFile)}
                                            {renderDocumentLink('PAN', selectedApp.director1?.panFile)}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-[#0066FF] uppercase tracking-widest mb-4">Business Documents</h3>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {renderDocumentLink('Office Photo', selectedApp.businessDetails?.officePhotoFile)}
                                        {renderDocumentLink('Bank Statement', selectedApp.businessDetails?.bankStatementFile)}
                                        {renderDocumentLink('ITR', selectedApp.businessDetails?.latestITRFile)}
                                        {renderDocumentLink('Electricity Bill', selectedApp.businessDetails?.electricityBillFile)}
                                        {renderDocumentLink('GST Cert', selectedApp.businessDetails?.gstCertificateFile)}
                                        {renderDocumentLink('Company PAN', selectedApp.businessDetails?.companyPanFile)}
                                        {renderDocumentLink('Director Photo', selectedApp.businessDetails?.directorPhotoFile)}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Update Status Form */}
                            <div>
                                <h3 className="text-sm font-black text-[#0066FF] uppercase tracking-widest mb-4">Update Status</h3>
                                <form onSubmit={handleUpdateStatus} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-5">
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
                                        <select 
                                            value={updateForm.adminStatus} 
                                            onChange={e => setUpdateForm({...updateForm, adminStatus: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Declined">Declined</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Amount</label>
                                        <input 
                                            type="number" 
                                            placeholder="Enter amount"
                                            value={updateForm.approvedAmount}
                                            onChange={e => setUpdateForm({...updateForm, approvedAmount: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Processing Fees</label>
                                        <input 
                                            type="number" 
                                            placeholder="Enter processing fees"
                                            value={updateForm.processingFees}
                                            onChange={e => setUpdateForm({...updateForm, processingFees: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reason (if declined/rejected)</label>
                                        <input 
                                            type="text" 
                                            placeholder="Enter reason..."
                                            value={updateForm.rejectionReason}
                                            onChange={e => setUpdateForm({...updateForm, rejectionReason: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Terms & Conditions</label>
                                        <textarea 
                                            placeholder="Enter terms..."
                                            value={updateForm.termsAndConditions}
                                            onChange={e => setUpdateForm({...updateForm, termsAndConditions: e.target.value})}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 h-24"
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={statusUpdating}
                                        className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-colors"
                                    >
                                        {statusUpdating ? 'Updating...' : 'Save Updates'}
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFinanceListing;
