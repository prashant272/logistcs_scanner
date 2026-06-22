import React, { useState } from 'react';
import { User, ShieldCheck, Upload, Loader2, Info, Image as ImageIcon, MapPin, Landmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import CountrySelect from '../common/CountrySelect';

const CustomerProfileTab = () => {
    const { user, updateProfile, deleteAccount, logout } = useAuth();

    const [formData, setFormData] = useState({
        firstName: user?.name ? user.name.split(' ')[0] : (user?.firstName || ''),
        lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : (user?.lastName || ''),
        email: user?.email || '',
        phone: user?.phone || '',
        company: user?.company || '',
        country: user?.address || '',
        profilePhoto: user?.profilePhoto || '',
    });

    const [uploading, setUploading] = useState({
        profilePhoto: false
    });

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));
        setError(null);
        
        try {
            const uploadData = new FormData();
            uploadData.append('file', file);

            const token = localStorage.getItem('userToken');
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/upload`, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setFormData(prev => ({
                ...prev,
                [field]: res.data.url
            }));
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || "File upload failed. Please try again.");
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                company: formData.company,
                address: formData.country,
                profilePhoto: formData.profilePhoto
            };
            const res = await updateProfile(payload);
            if (res.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("An unexpected error occurred while saving profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            setIsDeleting(true);
            try {
                const res = await deleteAccount();
                if (res.success) {
                    logout();
                } else {
                    setError(res.message);
                }
            } catch (err) {
                setError("An error occurred while deleting your account.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Format Created At date
    const createdAtDate = user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A';

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Title Header */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-[#0B1E43] tracking-tight">My Profile</h2>
                    <p className="text-sm text-slate-500 font-semibold mt-1">Manage your personal details and account settings.</p>
                </div>
                <div className="text-sm text-slate-500 font-semibold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">Account Created:</span> {createdAtDate}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {saved && (
                    <div className="bg-green-50 border border-green-200/80 text-green-800 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm animate-fadeIn">
                        <ShieldCheck size={18} className="text-green-600 shrink-0" />
                        <span>Changes saved successfully! Your profile has been updated.</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200/80 text-red-800 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                        <Info size={18} className="text-red-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* SECTION 1: PHOTO */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
                    <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <User size={16} className="text-[#0066FF]" /> Profile Photo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-[#f8fafc] border border-slate-100 rounded-2xl space-y-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Profile Photo</label>
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {formData.profilePhoto ? (
                                        <img src={formData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-grow space-y-2">
                                    <label className="relative inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-sm">
                                        {uploading.profilePhoto ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                                                <span>Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} className="text-[#0066FF]" />
                                                <span>Choose Photo</span>
                                            </>
                                        )}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                                            className="hidden" 
                                            disabled={uploading.profilePhoto}
                                        />
                                    </label>
                                    <p className="text-[11px] text-slate-500 font-medium">Supported formats: JPG, PNG, WEBP (Max 5MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: PERSONAL & CONTACT DETAILS */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
                    <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <User size={16} className="text-[#0066FF]" /> Personal & Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">First Name</label>
                            <input 
                                type="text" 
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                                placeholder="e.g. Prashant"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Last Name</label>
                            <input 
                                type="text" 
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                                placeholder="e.g. Jha"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address (Registered)</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                disabled
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 font-semibold cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Phone Number</label>
                            <input 
                                type="text" 
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                                placeholder="+919801017333"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: COMPANY & LOCATION */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
                    <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Landmark size={16} className="text-[#0066FF]" /> Organization & Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Organization / Company</label>
                            <input 
                                type="text" 
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                                placeholder="e.g. Cepta Global"
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <CountrySelect
                                selectedCountry={formData.country}
                                selectedPhoneCode=""
                                onChange={({ country }) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        country
                                    }));
                                }}
                                label="Country"
                                required={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit & Delete */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                    <button 
                        type="button" 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        <span>Delete Account</span>
                    </button>

                    <button 
                        type="submit" 
                        disabled={saving || uploading.profilePhoto}
                        className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold px-8 py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 cursor-pointer uppercase tracking-wider flex items-center gap-2 w-full md:w-auto justify-center"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving Profile...</span>
                            </>
                        ) : (
                            <span>Save Profile Details</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerProfileTab;
