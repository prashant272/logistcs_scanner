import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Tag, ShieldAlert, Edit } from 'lucide-react';

const CouponManagement = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [editId, setEditId] = useState(null);
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState('Fix');
    const [discountValue, setDiscountValue] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [status, setStatus] = useState('Active');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/coupons`, config);
            setCoupons(res.data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch coupons.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (coupon) => {
        setEditId(coupon._id);
        setCode(coupon.code || '');
        setDiscountType(coupon.discountType || 'Fix');
        setDiscountValue(coupon.discountValue || '');
        setExpiryDate(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
        setStatus(coupon.status || 'Active');
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setCode('');
        setDiscountValue('');
        setExpiryDate('');
        setStatus('Active');
        setDiscountType('Fix');
        setError('');
        setSuccess('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!code || !discountType || !discountValue || !expiryDate) {
            setError('Please fill in all required fields.');
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const payload = {
                code: code.trim().toUpperCase(),
                discountType,
                discountValue: Number(discountValue),
                expiryDate,
                status
            };

            if (editId) {
                const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/coupons/${editId}`, payload, config);
                setCoupons(prev => prev.map(c => c._id === editId ? res.data : c));
                setSuccess('Coupon updated successfully!');
                handleCancelEdit();
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/coupons`, payload, config);
                setCoupons(prev => [res.data, ...prev]);
                setSuccess('Coupon created successfully!');
                handleCancelEdit();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save coupon.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/coupons/${id}`, config);
            setCoupons(prev => prev.filter(c => c._id !== id));
            setSuccess('Coupon deleted successfully!');
            if (editId === id) handleCancelEdit();
        } catch (err) {
            console.error(err);
            alert('Failed to delete coupon.');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/coupons/${id}/toggle`, {}, config);
            setCoupons(prev => prev.map(c => c._id === id ? res.data : c));
            setSuccess('Coupon status updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to toggle coupon status.');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Coupon Management</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Create and configure promo discount codes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] space-y-6">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2">
                            <Plus className="text-[#00b2fe] w-5 h-5" /> {editId ? 'Edit Coupon' : 'Add Coupon'}
                        </h3>
                        {editId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="group">
                            <label className="block text-xs font-bold !text-slate-900 mb-1">Coupon Code *</label>
                            <input
                                type="text"
                                placeholder="E.g. DISCO50"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] uppercase"
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold !text-slate-900 mb-1">Discount Type *</label>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
                            >
                                <option value="Fix">Fix Amount (INR)</option>
                                <option value="Percent">Percent (%)</option>
                            </select>
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold !text-slate-900 mb-1">Discount Value *</label>
                            <input
                                type="number"
                                placeholder="Value (INR or %)"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold !text-slate-900 mb-1">Expiry Date *</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
                                required
                            />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold !text-slate-900 mb-1">Status *</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 mt-4 rounded-xl text-xs font-extrabold text-white bg-[#00b2fe] hover:bg-[#009bdc] transition-all disabled:opacity-75 cursor-pointer uppercase tracking-wider"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editId ? 'Update Coupon' : 'Save Coupon'}
                        </button>
                    </form>
                </div>

                {/* List Table Column */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider">Coupons List</h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#00b2fe]" />
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider text-xs">
                            No coupons created yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-slate-600">
                                <thead className="bg-slate-50 text-[#0B1E43] uppercase text-[9px] font-black tracking-widest border-b border-slate-150">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Discount</th>
                                        <th className="p-4">Expires</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                                    {coupons.map((c) => (
                                        <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-[#0B1E43] font-black flex items-center gap-1.5">
                                                <Tag size={13} className="text-[#00b2fe]" />
                                                <span>{c.code}</span>
                                            </td>
                                            <td className="p-4 text-slate-800">
                                                {c.discountType === 'Percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                                            </td>
                                            <td className="p-4 text-slate-500">{formatDate(c.expiryDate)}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleStatus(c._id)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                                                        c.status === 'Active'
                                                            ? 'bg-green-50 text-green-600 border-green-100'
                                                            : 'bg-red-50 text-red-500 border-red-100'
                                                    }`}
                                                >
                                                    {c.status}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="text-[#00b2fe] hover:text-[#009bdc] p-1.5 rounded-lg hover:bg-sky-50 transition-all cursor-pointer inline-flex items-center"
                                                    title="Edit Coupon"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c._id)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer inline-flex items-center"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponManagement;
