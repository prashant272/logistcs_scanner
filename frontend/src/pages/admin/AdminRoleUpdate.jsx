import React, { useState } from 'react';
import axios from 'axios';
import { Search, UserCheck, ShieldAlert, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRoleUpdate = () => {
    const [email, setEmail] = useState('');
    const [user, setUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error('Please enter an email address');
        
        try {
            setLoading(true);
            setUser(null);
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/user-role/${encodeURIComponent(email)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            setNewRole(res.data.role);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setLoading(false);
            if (error.response && error.response.status === 404) {
                toast.error('No user found with this email');
            } else {
                toast.error('Failed to fetch user details');
            }
        }
    };

    const handleUpdate = async () => {
        if (!newRole) return toast.error('Please select a role');
        if (newRole === user.role) return toast.error('User already has this role');

        if (!window.confirm(`Are you sure you want to change role for ${user.name} from ${user.role} to ${newRole}?`)) {
            return;
        }

        try {
            setUpdating(true);
            const token = sessionStorage.getItem('adminToken');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/user-role`, {
                email: user.email,
                newRole: newRole
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setUser({ ...user, role: newRole });
            toast.success('User role updated successfully');
            setUpdating(false);
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update user role');
            setUpdating(false);
        }
    };

    return (
        <div className="p-6 md:p-8 min-h-screen bg-slate-50/50">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-indigo-600" />
                        Role Management
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Search for a user by email to view or change their system role.</p>
                </div>

                {/* Search Box */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
                    <form onSubmit={handleSearch} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-bold text-slate-700 tracking-wide">USER EMAIL ADDRESS</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. user@example.com" 
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:font-normal"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            Search
                        </button>
                    </form>
                </div>

                {/* Result Card */}
                {user && (
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/60">
                        <div className="bg-indigo-50/50 px-6 md:px-8 py-5 border-b border-indigo-100/50 flex items-center justify-between">
                            <h2 className="font-black text-indigo-950 flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-indigo-600" />
                                User Profile Found
                            </h2>
                            <span className="px-3 py-1 bg-white text-indigo-700 text-xs font-black uppercase tracking-wider rounded-lg border border-indigo-100 shadow-sm">
                                {user.role}
                            </span>
                        </div>
                        
                        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Full Name</p>
                                    <p className="font-bold text-slate-800 text-lg">{user.name}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Email Address</p>
                                    <p className="font-bold text-slate-800 text-lg">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-1">Company / Organization</p>
                                    <p className="font-bold text-slate-800 text-lg">{user.company || 'Not specified'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-4 h-fit">
                                <h3 className="font-black text-slate-800 tracking-wide text-sm flex items-center gap-2">
                                    Change System Role
                                </h3>
                                
                                <div className="space-y-4">
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full h-12 bg-white border border-slate-300 rounded-xl px-4 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="vendor">Vendor</option>
                                        <option value="guest">Guest</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    
                                    <button 
                                        onClick={handleUpdate}
                                        disabled={updating || newRole === user.role}
                                        className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Update Role
                                    </button>
                                </div>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed pt-2">
                                    <span className="font-bold text-rose-500">Warning:</span> Changing a user's role will immediately alter their permissions and access to the platform. Ensure you have the right user.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRoleUpdate;
