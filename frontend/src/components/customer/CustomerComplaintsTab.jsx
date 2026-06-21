import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle2, Clock, ShieldAlert, Upload, Paperclip, AlertOctagon, XCircle } from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';
import api from '../../api/axios';

const CustomerComplaintsTab = () => {
    const { enquiries, fetchClientEnquiries } = useEnquiries();
    const [complaints, setComplaints] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [screenshot, setScreenshot] = useState('');
    const [activeFilter, setActiveFilter] = useState('raised'); // 'raised' or 'against'

    // Upload States
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [fileName, setFileName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchComplaints = async (filterType = activeFilter) => {
        try {
            const res = await api.get(`/complaints?type=${filterType}`);
            setComplaints(res.data || []);
        } catch (err) {
            console.error('Error fetching complaints:', err);
        }
    };

    useEffect(() => {
        fetchComplaints(activeFilter);
        fetchClientEnquiries('all').catch(err => console.error('Error fetching enquiries:', err));
    }, [activeFilter]);

    // Get unique list of vendors from client's enquiries
    const getUniqueVendors = () => {
        const vendorMap = new Map();
        if (enquiries && Array.isArray(enquiries)) {
            enquiries.forEach(enq => {
                if (enq.vendor && enq.vendor._id) {
                    vendorMap.set(enq.vendor._id, enq.vendor.company || enq.vendor.name);
                }
            });
        }
        return Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }));
    };

    const uniqueVendors = getUniqueVendors();

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Only PNG, JPG, WEBP, or PDF files are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be less than 5MB.');
            return;
        }

        setUploadError('');
        setUploading(true);
        setFileName(file.name);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/auth/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setScreenshot(res.data.url);
        } catch (err) {
            console.error('Upload failed:', err);
            setUploadError('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!subject || !message || !selectedVendor) {
            setError('Please select a vendor and fill in all fields.');
            return;
        }

        try {
            setLoading(true);
            await api.post('/complaints', {
                subject,
                message,
                vendor: selectedVendor,
                priority,
                screenshot
            });
            setSuccess('Your complaint has been submitted successfully.');
            setSubject('');
            setMessage('');
            setSelectedVendor('');
            setPriority('Medium');
            setScreenshot('');
            setFileName('');
            fetchComplaints(activeFilter);
        } catch (err) {
            console.error('Error submitting complaint:', err);
            setError(err.response?.data?.message || 'Error submitting complaint.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Filter Navigation Headers */}
            <div className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.01)] w-fit">
                <button
                    onClick={() => setActiveFilter('raised')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeFilter === 'raised'
                            ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-[#0066FF]/10'
                            : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Your Complaint
                </button>
                <button
                    onClick={() => setActiveFilter('against')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeFilter === 'against'
                            ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-[#0066FF]/10'
                            : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    Complaint Against You
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Complaint Form */}
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] h-fit space-y-4">
                    <h3 className="text-base font-black text-[#0B1E43] tracking-tight flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-500" />
                        <span>Raise a Complaint</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Submit any issues or disputes against a vendor
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-750 text-xs font-bold p-3.5 rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-750 text-xs font-bold p-3.5 rounded-xl border border-green-100">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Vendor Dropdown */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Select (LS ID) *</label>
                            <select
                                value={selectedVendor}
                                onChange={(e) => setSelectedVendor(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all cursor-pointer"
                                required
                            >
                                <option value="">-- Select Vendor --</option>
                                {uniqueVendors.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                            {uniqueVendors.length === 0 && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                                    Note: You can only file complaints against vendors you have raised enquiries to.
                                </p>
                            )}
                        </div>

                        {/* Subject */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Subject *</label>
                            <input
                                type="text"
                                placeholder="e.g., Delay in shipment / Price discrepancy"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
                                required
                            />
                        </div>

                        {/* Describe Issue */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Describe Issue *</label>
                            <textarea
                                rows={3}
                                placeholder="Explain your problem in detail..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Priority */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all cursor-pointer"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        {/* Drag and Drop Screenshot */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Attach Screenshot *</label>
                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-slate-200 hover:border-[#0066FF]/40 bg-[#f4f7fc] rounded-2xl p-5 text-center transition-all cursor-pointer relative group"
                            >
                                <input
                                    type="file"
                                    id="screenshot-file"
                                    accept=".png,.jpg,.jpeg,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label htmlFor="screenshot-file" className="cursor-pointer space-y-2 block">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 group-hover:text-[#0066FF] transition-colors">
                                        <Upload size={16} />
                                    </div>
                                    <div className="text-[11px] font-black text-slate-700">📤 Drag & Drop files here</div>
                                    <div className="text-[10px] text-slate-400 font-bold">PNG, JPG, PDF (Max 5MB)</div>
                                </label>
                            </div>

                            {fileName && (
                                <div className="mt-2.5 flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 min-w-0">
                                        <Paperclip size={13} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{fileName}</span>
                                    </div>
                                    {uploading ? (
                                        <span className="text-[10px] text-[#0066FF] font-black uppercase">Uploading...</span>
                                    ) : (
                                        <span className="text-[10px] text-green-600 font-black uppercase">Ready</span>
                                    )}
                                </div>
                            )}

                            {uploadError && (
                                <p className="text-[10px] text-red-600 font-bold mt-1">{uploadError}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading || uniqueVendors.length === 0}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-red-500/10 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={14} />
                            <span>{loading ? 'Submitting...' : 'Submit Complaint'}</span>
                        </button>
                    </form>
                </div>

                {/* Right Column: Complaint List */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-4">
                    <h3 className="text-base font-black text-[#0B1E43] tracking-tight">
                        {activeFilter === 'raised' ? 'Complaints Raised by You' : 'Complaints Against You'}
                    </h3>

                    {complaints.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-semibold text-xs border border-slate-100 rounded-2xl bg-slate-50/50">
                            No complaints found in this category.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                            {complaints.map((c) => {
                                const isResolved = c.status === 'Resolved';
                                const isRejected = c.status === 'Rejected';

                                return (
                                    <div key={c._id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/40 hover:border-slate-200 transition-all space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.complaintId || 'CMP-00000'}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${c.priority === 'High'
                                                            ? 'bg-red-50 text-red-600 border border-red-100'
                                                            : c.priority === 'Medium'
                                                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                : 'bg-sky-50 text-sky-600 border border-sky-100'
                                                        }`}>
                                                        {c.priority || 'Medium'}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs md:text-sm font-extrabold text-[#0B1E43]">
                                                    {c.subject}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[10px] text-[#0066FF] font-black uppercase">
                                                    <ShieldAlert size={12} />
                                                    {activeFilter === 'raised' ? (
                                                        <span>Against: {c.vendor?.company || c.vendor?.name || 'Unknown Vendor'} ({c.vendor?.role || 'vendor'})</span>
                                                    ) : (
                                                        <span>By: {c.client?.company || c.client?.name || 'Unknown User'} ({c.client?.role || 'customer'})</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`self-start flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${isResolved
                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                    : isRejected
                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                        : 'bg-amber-50 text-amber-600 border-amber-200'
                                                }`}>
                                                {isResolved ? <CheckCircle2 size={12} /> : isRejected ? <AlertOctagon size={12} /> : <Clock size={12} />}
                                                <span>{c.status}</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                            {c.message}
                                        </p>

                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                                            <div className="text-[10px] text-slate-400 font-bold">
                                                Filed on: {formatDate(c.createdAt)}
                                            </div>

                                            {c.screenshot && (
                                                <a
                                                    href={c.screenshot}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-[#0066FF] hover:underline font-black uppercase flex items-center gap-1 bg-[#0066FF]/5 px-2.5 py-1.5 rounded-lg border border-[#0066FF]/10"
                                                >
                                                    <Paperclip size={11} />
                                                    <span>View Attachment</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerComplaintsTab;
