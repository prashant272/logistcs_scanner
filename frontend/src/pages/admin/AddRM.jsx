import React, { useState, useEffect } from 'react';
import { UserPlus, Save, X, Edit, Trash2, Mail, Phone, Lock } from 'lucide-react';
import api from '../../api/axios';

const AddRM = () => {
    const [rms, setRms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    // Form state
    const [rmId, setRmId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [permissions, setPermissions] = useState([]);

    const availablePermissions = [
        'Manage Customer', 'Manage Vendor', 'All Enquiries', 'Vendor Pricing', 'Add Pricing', 'Add Via Pricing', 
        'Add Plan', 'Add Coupon', 'Inquiry listing', 'Activity RM', 'Bulk Import', 'Location Master', 
        'Finance Enquiry List', 'Invoice Request', 'Upgrade Requests', 'All Complaints', 'CMS Settings', 
        'PTL Bookings', 'Delhivery Settings'
    ];

    const handlePermissionChange = (perm) => {
        setPermissions(prev => 
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const fetchRMs = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.get('/rm', {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            setRms(res.data);
        } catch (err) {
            console.error('Error fetching RMs:', err);
            setError('Failed to load Relationship Managers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRMs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const token = sessionStorage.getItem('adminToken');
            const payload = { name, email, mobile, permissions };
            if (password) payload.password = password;

            if (isEditing) {
                await api.put(`/rm/${rmId}`, payload, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
            } else {
                if (!password) {
                    setError('Password is required for new RM');
                    return;
                }
                await api.post('/rm', payload, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
            }
            
            resetForm();
            fetchRMs();
        } catch (err) {
            console.error('Error saving RM:', err);
            setError(err.response?.data?.message || 'Failed to save RM.');
        }
    };

    const handleEdit = (rm) => {
        setIsEditing(true);
        setRmId(rm._id);
        setName(rm.name);
        setEmail(rm.email);
        setMobile(rm.mobile);
        setPermissions(rm.permissions || []);
        setPassword(''); // don't show existing password
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this RM?')) return;
        try {
            const token = sessionStorage.getItem('adminToken');
            await api.delete(`/rm/${id}`, {
                headers: { 'Authorization': token ? `Bearer ${token}` : '' }
            });
            fetchRMs();
        } catch (err) {
            console.error('Error deleting RM:', err);
            alert('Failed to delete RM.');
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setRmId('');
        setName('');
        setEmail('');
        setMobile('');
        setPassword('');
        setPermissions([]);
        setError('');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <UserPlus className="text-blue-600" />
                    {isEditing ? 'Edit Relationship Manager' : 'Add Relationship Manager'}
                </h2>
                
                {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Name</label>
                        <input 
                            type="text" 
                            required 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="John Doe"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Mobile</label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="text" 
                                required 
                                value={mobile} 
                                onChange={e => setMobile(e.target.value)} 
                                placeholder="+91 9876543210"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="john@example.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Password {isEditing && '(Leave blank to keep unchanged)'}</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="password" 
                                required={!isEditing}
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="******"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Assign Permissions (Sidebar Tabs)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                            {availablePermissions.map(perm => (
                                <label key={perm} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={permissions.includes(perm)}
                                        onChange={() => handlePermissionChange(perm)}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                    />
                                    {perm}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 flex gap-3 mt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                            <Save size={18} />
                            {isEditing ? 'Update RM' : 'Save RM'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors">
                                <X size={18} /> Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* RM List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800">Relationship Managers List</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                                <th className="p-4 pl-6">#</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Mobile</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                            ) : rms.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No RMs found.</td></tr>
                            ) : (
                                rms.map((rm, index) => (
                                    <tr key={rm._id} className="hover:bg-slate-50">
                                        <td className="p-4 pl-6 text-sm text-slate-500">{index + 1}</td>
                                        <td className="p-4 font-semibold text-slate-800">{rm.name}</td>
                                        <td className="p-4 text-slate-600">{rm.mobile}</td>
                                        <td className="p-4 text-slate-600">{rm.email}</td>
                                        <td className="p-4 flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(rm)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(rm._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
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

export default AddRM;
