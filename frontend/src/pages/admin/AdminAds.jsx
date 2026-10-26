import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, ToggleLeft, ToggleRight, Layout, ImagePlus, Link } from 'lucide-react';
import api from '../../api/axios';

const AdminAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAd, setCurrentAd] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        sponsorName: 'Logistics Partner',
        headline: '',
        description: '',
        imageUrl: '',
        features: '', // We will split by comma
        buttonText: 'View Offer',
        linkUrl: '',
        placement: 'top',
        targetSection: 'both',
        targetUrl: '',
        openInNewTab: true,
        isActive: true
    });

    const fileInputRef = useRef(null);

    const fetchAds = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const res = await api.get('/ads/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAds(res.data);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
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
        uploadData.append('file', file);

        setUploadingImage(true);
        try {
            const token = sessionStorage.getItem('adminToken');
            const res = await api.post('/upload', uploadData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            
            const uploadedUrl = res.data.url || res.data.imageUrl || res.data; 
            if (typeof uploadedUrl === 'string') {
                setFormData({ ...formData, imageUrl: uploadedUrl });
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

            const payload = {
                ...formData,
                features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
            };

            if (currentAd) {
                await api.put(`/ads/admin/${currentAd._id}`, payload, { headers });
            } else {
                await api.post('/ads/admin', payload, { headers });
            }
            
            setIsModalOpen(false);
            fetchAds();
        } catch (error) {
            console.error('Error saving ad:', error);
            alert(error.response?.data?.message || 'Error saving ad');
        }
    };

    const handleSectionChange = (e) => {
        const section = e.target.value;
        let autoUrl = formData.targetUrl;
        if (section === 'customer_direct') autoUrl = '/customer/direct-enquiry';
        else if (section === 'customer_my') autoUrl = '/customer/my-enquiry';
        else if (section === 'customer_dashboard') autoUrl = '/customer/dashboard';
        else if (section === 'customer_finance') autoUrl = '/customer/finance';
        else if (section === 'customer_plans') autoUrl = '/customer/plans';
        else if (section === 'customer_complaint') autoUrl = '/customer/complaint';
        else if (section === 'customer_profile') autoUrl = '/customer/profile';
        else if (section === 'direct_enquiry') autoUrl = '/vendor/direct-enquiries';
        else if (section === 'b2b_enquiry') autoUrl = '/vendor/b2b-enquiries';
        else if (section === 'both' || section === 'customer_all') autoUrl = '';

        setFormData({
            ...formData,
            targetSection: section,
            targetUrl: autoUrl
        });
    };

    const handleEdit = (ad) => {
        setCurrentAd(ad);
        setFormData({
            title: ad.title,
            sponsorName: ad.sponsorName || 'Logistics Partner',
            headline: ad.headline || '',
            description: ad.description || '',
            imageUrl: ad.imageUrl || '',
            features: ad.features ? ad.features.join(', ') : '',
            buttonText: ad.buttonText || 'View Offer',
            linkUrl: ad.linkUrl || '',
            placement: ad.placement || 'top',
            targetSection: ad.targetSection || 'both',
            targetUrl: ad.targetUrl || '',
            openInNewTab: ad.openInNewTab !== false,
            isActive: ad.isActive
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this Ad?')) return;
        try {
            const token = sessionStorage.getItem('adminToken');
            await api.delete(`/ads/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAds();
        } catch (error) {
            console.error('Error deleting ad:', error);
        }
    };

    const toggleStatus = async (ad) => {
        try {
            const token = sessionStorage.getItem('adminToken');
            await api.put(`/ads/admin/${ad._id}`, { isActive: !ad.isActive }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAds();
        } catch (error) {
            console.error('Error toggling ad status:', error);
        }
    };

    const openModal = () => {
        setCurrentAd(null);
        setFormData({
            title: '',
            sponsorName: 'Logistics Partner',
            headline: '',
            description: '',
            imageUrl: '',
            features: '',
            buttonText: 'View Offer',
            linkUrl: '',
            placement: 'top',
            targetSection: 'both',
            targetUrl: '',
            openInNewTab: true,
            isActive: true
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Advertisement Management</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                        Manage banner ads across Vendor & Customer panels (Enquiries, Dashboard, Custom Tabs)
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#0066FF]/20"
                >
                    <Plus size={16} strokeWidth={2.5} /> Add New Ad
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : ads.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-[#0066FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Layout size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Ads Found</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">You haven't created any advertisements yet.</p>
                    <button onClick={openModal} className="text-[#0066FF] font-bold text-sm hover:underline">
                        + Create First Ad
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map(ad => (
                        <div key={ad._id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${ad.isActive ? 'border-blue-100 shadow-md shadow-blue-50/50' : 'border-slate-200 shadow-sm opacity-75'}`}>
                            {ad.imageUrl ? (
                                <div className="h-40 w-full overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                                    {!ad.isActive && <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>}
                                </div>
                            ) : (
                                <div className="h-40 w-full bg-slate-100 flex items-center justify-center border-b border-slate-100">
                                    <ImageIcon size={32} className="text-slate-300" />
                                </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-3 gap-3">
                                    <h3 className="font-bold text-slate-800 text-base leading-tight flex-1">{ad.title}</h3>
                                    <button onClick={() => toggleStatus(ad)} className={ad.isActive ? "text-green-500" : "text-slate-400"} title={ad.isActive ? 'Active' : 'Inactive'}>
                                        {ad.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                                
                                {ad.linkUrl && (
                                    <p className="text-xs text-blue-500 truncate mb-4 flex items-center gap-1.5 font-medium">
                                        <Link size={12} /> {ad.linkUrl}
                                    </p>
                                )}
                                
                                <div className="mt-auto space-y-2">
                                    <div className="bg-slate-50 rounded-lg p-2.5">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Target Panel / Section</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                                    ad.placement === 'sidebar' 
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                        : ad.placement === 'inline'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {ad.placement ? `${ad.placement} Ad` : 'Top Ad'}
                                                </span>
                                                {ad.linkUrl && (
                                                    <span className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        {ad.openInNewTab !== false ? '↗ New Tab' : 'Same Tab'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 capitalize block">
                                            {ad.targetSection === 'both' ? 'Vendor: Direct & B2B' : 
                                             ad.targetSection === 'direct_enquiry' ? 'Vendor: Direct Enquiries' : 
                                             ad.targetSection === 'b2b_enquiry' ? 'Vendor: B2B Enquiries' :
                                             ad.targetSection === 'customer_direct' ? 'Customer: Direct Enquiry' :
                                             ad.targetSection === 'customer_my' ? 'Customer: My Enquiry' :
                                             ad.targetSection === 'customer_dashboard' ? 'Customer: Dashboard' :
                                             ad.targetSection === 'customer_finance' ? 'Customer: Finance' :
                                             ad.targetSection === 'customer_plans' ? 'Customer: Plans' :
                                             ad.targetSection === 'customer_complaint' ? 'Customer: Complaints' :
                                             ad.targetSection === 'customer_profile' ? 'Customer: Profile' :
                                             ad.targetSection === 'customer_all' ? 'Customer: All Pages' : 'Custom Tab / Multiple URLs'}
                                        </span>
                                        {ad.targetUrl && (
                                            <span className="text-[10px] text-[#0066FF] font-mono font-bold block mt-1 truncate bg-blue-50/60 px-2 py-0.5 rounded">
                                                Tab: {ad.targetUrl}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                        <button onClick={() => handleEdit(ad)} className="flex-1 bg-blue-50 text-[#0066FF] hover:bg-[#0066FF] hover:text-white transition-colors py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(ad._id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-scaleUp">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">
                                {currentAd ? 'Edit Ad' : 'Create New Ad'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Ad Title / Reference *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        placeholder="e.g., BNB Worldwide Credit Partner"
                                    />
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Banner Image *</label>
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
                                                {uploadingImage ? 'Uploading...' : 'Upload Image'}
                                            </button>
                                            <input
                                                type="text"
                                                name="imageUrl"
                                                value={formData.imageUrl}
                                                onChange={handleInputChange}
                                                className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none transition-colors"
                                                placeholder="Or Paste Image URL..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Sponsor Name</label>
                                        <input
                                            type="text"
                                            name="sponsorName"
                                            value={formData.sponsorName}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., Container Leasing Partner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Ad Placement</label>
                                        <select
                                            name="placement"
                                            value={formData.placement}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        >
                                            <option value="top">Top Banner</option>
                                            <option value="inline">Inline (Between Enquiries)</option>
                                            <option value="sidebar">Sidebar (Right Column)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Headline *</label>
                                    <input
                                        type="text"
                                        name="headline"
                                        value={formData.headline}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        placeholder="e.g., Move More. Spend Less."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors"
                                        placeholder="Brief description of the offer..."
                                        rows="2"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Features / Tags (Comma separated)</label>
                                    <input
                                        type="text"
                                        name="features"
                                        value={formData.features}
                                        onChange={handleInputChange}
                                        className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors"
                                        placeholder="e.g., Priority rates, Pan-India delivery"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Button Text</label>
                                        <input
                                            type="text"
                                            name="buttonText"
                                            value={formData.buttonText}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., Get Quote"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Destination Link URL (Optional)</label>
                                        <input
                                            type="text"
                                            name="linkUrl"
                                            value={formData.linkUrl}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., https://bnbworldwide.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Target Section / Panel</label>
                                        <select
                                            name="targetSection"
                                            value={formData.targetSection}
                                            onChange={handleSectionChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-colors"
                                        >
                                            <optgroup label="Vendor Panel">
                                                <option value="both">Vendor: Direct & B2B Enquiries</option>
                                                <option value="direct_enquiry">Vendor: Direct Enquiries Only</option>
                                                <option value="b2b_enquiry">Vendor: B2B Enquiries Only</option>
                                            </optgroup>
                                            <optgroup label="Customer Panel">
                                                <option value="customer_all">Customer: All Pages</option>
                                                <option value="customer_dashboard">Customer: Dashboard (/customer/dashboard)</option>
                                                <option value="customer_my">Customer: My Enquiry (/customer/my-enquiry)</option>
                                                <option value="customer_direct">Customer: Direct Enquiry (/customer/direct-enquiry)</option>
                                                <option value="customer_finance">Customer: Finance & Credit (/customer/finance)</option>
                                                <option value="customer_plans">Customer: Plans (/customer/plans)</option>
                                                <option value="customer_complaint">Customer: Complaints (/customer/complaint)</option>
                                                <option value="customer_profile">Customer: Profile (/customer/profile)</option>
                                            </optgroup>
                                            <optgroup label="Custom / Multiple URLs">
                                                <option value="custom_url">Custom Page / Tab URL (or multiple)</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                            Target Tab / Page URL (Where to Show)
                                        </label>
                                        <input
                                            type="text"
                                            name="targetUrl"
                                            value={formData.targetUrl}
                                            onChange={handleInputChange}
                                            className="w-full bg-white border border-slate-300 focus:border-[#0066FF] rounded-xl px-4 py-3 text-sm font-mono text-slate-800 outline-none transition-colors"
                                            placeholder="e.g., /customer/my-enquiry, /customer/finance"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                            💡 Comma-separated URLs supported (e.g. <span className="font-mono text-blue-600">/customer/my-enquiry, /customer/finance</span>)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                        <input
                                            type="checkbox"
                                            id="openInNewTab"
                                            name="openInNewTab"
                                            checked={formData.openInNewTab}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                                        />
                                        <label htmlFor="openInNewTab" className="text-xs font-bold text-slate-700 cursor-pointer">
                                            Open Destination Link in a separate browser tab (target="_blank")
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                                        />
                                        <label htmlFor="isActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                                            Activate this Ad immediately
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} type="button" className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} type="button" className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-[#0066FF] hover:bg-[#0052cc] text-white shadow-md shadow-[#0066FF]/20 transition-all flex items-center gap-2">
                                <CheckCircle size={16} /> Save Ad
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAds;
