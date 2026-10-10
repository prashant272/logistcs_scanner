import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Layout, Globe, ImagePlus } from 'lucide-react';
import api from '../../api/axios';

const AdminPopups = () => {
    const [popups, setPopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPopup, setCurrentPopup] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        imageUrl: '',
        buttonText: 'Got It',
        buttonLink: '',
        targetAudience: 'all',
        displayType: 'global',
        targetRoutes: '',
        frequency: 'once',
        isActive: true
    });

    const fileInputRef = useRef(null);

    const fetchPopups = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.get('/popups/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPopups(res.data);
        } catch (error) {
            console.error('Error fetching popups:', error);
            alert('Failed to fetch popups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPopups();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file); // Depending on your backend, this could be 'file' or 'image'

        setUploadingImage(true);
        try {
            const token = sessionStorage.getItem('adminToken');
            const res = await api.post('/upload', uploadData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Assuming the backend returns the image URL as `res.data.url` or `res.data.imageUrl`
            const uploadedUrl = res.data.url || res.data.imageUrl || res.data; 
            
            if (typeof uploadedUrl === 'string') {
                setFormData({ ...formData, imageUrl: uploadedUrl });
            } else {
                alert('Image uploaded but could not parse URL from response.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = sessionStorage.getItem('adminToken');
            const headers = { Authorization: `Bearer ${token}` };
            
            // Format routes from comma-separated string to array
            let routesArray = [];
            if (formData.displayType === 'specific_route' && formData.targetRoutes) {
                routesArray = formData.targetRoutes.split(',').map(r => r.trim()).filter(r => r);
            }
            
            const payload = {
                ...formData,
                targetRoutes: routesArray
            };

            if (currentPopup) {
                await api.put(`/popups/admin/${currentPopup._id}`, payload, { headers });
            } else {
                await api.post('/popups/admin', payload, { headers });
            }
            
            setIsModalOpen(false);
            fetchPopups();
        } catch (error) {
            console.error('Error saving popup:', error);
            alert(error.response?.data?.message || 'Error saving popup');
        }
    };

    const handleEdit = (popup) => {
        setCurrentPopup(popup);
        setFormData({
            title: popup.title,
            content: popup.content || '',
            imageUrl: popup.imageUrl || '',
            buttonText: popup.buttonText || 'Got It',
            buttonLink: popup.buttonLink || '',
            targetAudience: popup.targetAudience,
            displayType: popup.displayType,
            targetRoutes: popup.targetRoutes.join(', '),
            frequency: popup.frequency,
            isActive: popup.isActive
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this popup?')) return;
        
        try {
            const token = sessionStorage.getItem('adminToken');
            await api.delete(`/popups/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPopups();
        } catch (error) {
            console.error('Error deleting popup:', error);
            alert('Failed to delete popup');
        }
    };

    const toggleStatus = async (popup) => {
        try {
            const token = sessionStorage.getItem('adminToken');
            await api.put(`/popups/admin/${popup._id}`, { isActive: !popup.isActive }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPopups();
        } catch (error) {
            console.error('Error toggling popup status:', error);
            alert('Failed to update status');
        }
    };

    const openModal = () => {
        setCurrentPopup(null);
        setFormData({
            title: '',
            content: '',
            imageUrl: '',
            buttonText: 'Got It',
            buttonLink: '',
            targetAudience: 'all',
            displayType: 'global',
            targetRoutes: '',
            frequency: 'once',
            isActive: true
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Popup Management</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                        Create and manage dynamic popups for customers and vendors
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#0066FF]/20"
                >
                    <Plus size={16} strokeWidth={2.5} /> Add New Popup
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : popups.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-[#0066FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Layout size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Popups Found</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">You haven't created any popups yet. Start by creating one for your users.</p>
                    <button
                        onClick={openModal}
                        className="text-[#0066FF] font-bold text-sm hover:underline"
                    >
                        + Create First Popup
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popups.map(popup => (
                        <div key={popup._id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${popup.isActive ? 'border-blue-100 shadow-md shadow-blue-50/50' : 'border-slate-200 shadow-sm opacity-75'}`}>
                            {popup.imageUrl && (
                                <div className="h-40 w-full overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                                    <img src={popup.imageUrl} alt={popup.title} className="w-full h-full object-cover" />
                                    {!popup.isActive && <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>}
                                </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-3 gap-3">
                                    <h3 className="font-bold text-slate-800 text-base leading-tight flex-1">{popup.title}</h3>
                                    <button onClick={() => toggleStatus(popup)} className={popup.isActive ? "text-green-500" : "text-slate-400"} title={popup.isActive ? 'Active' : 'Inactive'}>
                                        {popup.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{popup.content || 'No content provided.'}</p>
                                
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-slate-50 rounded-lg p-2 flex flex-col justify-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Audience</span>
                                        <span className="text-xs font-bold text-slate-700 capitalize">{popup.targetAudience}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2 flex flex-col justify-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Display</span>
                                        <span className="text-xs font-bold text-slate-700 capitalize flex items-center gap-1">
                                            {popup.displayType === 'global' ? <><Globe size={12}/> Global</> : <><Layout size={12}/> Specific</>}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleEdit(popup)} className="flex-1 bg-blue-50 text-[#0066FF] hover:bg-[#0066FF] hover:text-white transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(popup._id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {currentPopup ? 'Edit Popup' : 'Create New Popup'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto suggestions-scrollbar flex-1">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Popup Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        placeholder="e.g., Diwali Special Offer!"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Content (Optional)</label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors resize-none"
                                        placeholder="Add a message or description here..."
                                    ></textarea>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Cover Image (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                            {formData.imageUrl ? (
                                                <>
                                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={20} />
                                                    </button>
                                                </>
                                            ) : (
                                                <ImageIcon size={24} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="w-full bg-white border border-slate-300 hover:border-[#0066FF] hover:text-[#0066FF] text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                                {uploadingImage ? <div className="w-4 h-4 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div> : <ImagePlus size={16} />} 
                                                {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">OR</span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>
                                            <input
                                                type="text"
                                                name="imageUrl"
                                                value={formData.imageUrl}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none transition-colors"
                                                placeholder="Paste Image URL directly..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Button Text</label>
                                        <input
                                            type="text"
                                            name="buttonText"
                                            value={formData.buttonText}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., Learn More"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Button Link / URL</label>
                                        <input
                                            type="text"
                                            name="buttonLink"
                                            value={formData.buttonLink}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., https://example.com/offer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Target Audience</label>
                                        <select
                                            name="targetAudience"
                                            value={formData.targetAudience}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        >
                                            <option value="all">All Users</option>
                                            <option value="customer">Customers Only</option>
                                            <option value="vendor">Vendors Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Display Frequency</label>
                                        <select
                                            name="frequency"
                                            value={formData.frequency}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        >
                                            <option value="once">Show Once (per session)</option>
                                            <option value="always">Show Every Time</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Display Rules</label>
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="displayType" value="global" checked={formData.displayType === 'global'} onChange={handleInputChange} className="w-4 h-4 text-[#0066FF]" />
                                            <span className="text-sm font-bold text-slate-700">Show Globally (All pages)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="displayType" value="specific_route" checked={formData.displayType === 'specific_route'} onChange={handleInputChange} className="w-4 h-4 text-[#0066FF]" />
                                            <span className="text-sm font-bold text-slate-700">Specific Routes</span>
                                        </label>
                                    </div>

                                    {formData.displayType === 'specific_route' && (
                                        <div className="animate-fadeIn">
                                            <input
                                                type="text"
                                                name="targetRoutes"
                                                value={formData.targetRoutes}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors"
                                                placeholder="e.g., /vendor/my-pricing, /customer/dashboard"
                                                required={formData.displayType === 'specific_route'}
                                            />
                                            <p className="text-[10px] font-bold text-slate-400 mt-1.5">Enter comma-separated paths where this popup should appear.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                                        Activate this popup immediately
                                    </label>
                                </div>

                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} type="button" className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} type="button" className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-md shadow-[#0066FF]/20 transition-all flex items-center gap-2">
                                <CheckCircle size={16} /> Save Popup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPopups;
