import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Edit2, Trash2, X, RefreshCw } from 'lucide-react';

const SystemUpdates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', type: 'Announcement' });
    const [submitting, setSubmitting] = useState(false);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/system-updates/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUpdates(res.data);
        } catch (error) {
            console.error('Error fetching updates', error);
            alert('Failed to load updates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = sessionStorage.getItem('adminToken');
            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/system-updates/admin/${currentId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${import.meta.env.VITE_API_BASE_URL}/system-updates/admin`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setShowModal(false);
            setFormData({ title: '', content: '', type: 'Announcement' });
            fetchUpdates();
        } catch (error) {
            console.error('Error saving update', error);
            alert('Failed to save update');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (update) => {
        setFormData({ title: update.title, content: update.content, type: update.type || 'Announcement' });
        setCurrentId(update._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this update?')) return;
        try {
            const token = sessionStorage.getItem('adminToken');
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/system-updates/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUpdates();
        } catch (error) {
            console.error('Error deleting update', error);
            alert('Failed to delete update');
        }
    };

    const openCreateModal = () => {
        setFormData({ title: '', content: '', type: 'Announcement' });
        setIsEditing(false);
        setShowModal(true);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vendor Updates</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Manage announcements and updates sent to vendors</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={fetchUpdates}
                        className="p-2.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={openCreateModal}
                        className="bg-[#0066FF] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20"
                    >
                        <PlusCircle size={18} />
                        New Update
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066FF]"></div>
                </div>
            ) : updates.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PlusCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No updates yet</h3>
                    <p className="text-slate-500 mb-6">Create your first update to notify all vendors.</p>
                    <button 
                        onClick={openCreateModal}
                        className="bg-[#0066FF] hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 transition-all"
                    >
                        Create Update
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {updates.map(update => (
                        <div key={update._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 hover:border-blue-100 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-lg uppercase tracking-wider">
                                        {update.type || 'Announcement'}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-800">{update.title}</h3>
                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg ml-auto md:ml-0">
                                        {new Date(update.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{update.content}</p>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                                <button 
                                    onClick={() => handleEdit(update)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors tooltip"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(update._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors tooltip"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800">
                                {isEditing ? 'Edit Update' : 'New Vendor Update'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="e.g. New Feature Release"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Type</label>
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    >
                                        <option value="Announcement">Announcement</option>
                                        <option value="System Update">System Update</option>
                                        <option value="Feature Update">Feature Update</option>
                                        <option value="Important">Important</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Content</label>
                                    <textarea 
                                        required
                                        rows="6"
                                        value={formData.content}
                                        onChange={e => setFormData({...formData, content: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
                                        placeholder="Write your update here... (Plain text is fine, line breaks are preserved)"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-[#0066FF] hover:bg-blue-600 disabled:opacity-70 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm hover:shadow-md hover:shadow-blue-500/20"
                                >
                                    {submitting ? 'Saving...' : (isEditing ? 'Update' : 'Post Update')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemUpdates;
