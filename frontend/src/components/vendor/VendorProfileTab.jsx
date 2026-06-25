import React, { useState } from 'react';
import { User, ShieldCheck, Upload, FileText, Image as ImageIcon, Loader2, Info, Landmark, MapPin, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import CountrySelect from '../common/CountrySelect';

const VendorProfileTab = ({ user: propUser }) => {
  const { user: authUser, updateProfile } = useAuth();
  const user = propUser || authUser;

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    address: user?.address || '',
    profilePhoto: user?.profilePhoto || '',
    uploadedDocument: user?.uploadedDocument || '',
    country: user?.country || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    website: user?.website || '',
    alternativeEmail: user?.alternativeEmail || '',
    alternativeNumber: user?.alternativeNumber || '',
    dateOfIncorporation: user?.dateOfIncorporation ? new Date(user.dateOfIncorporation).toISOString().split('T')[0] : '',
    companyAge: user?.companyAge || '',
    directorsNames: user?.directorsNames || '',
    directorsCount: user?.directorsCount || 0,
    lastYearTurnover: user?.lastYearTurnover || '',
    companyProfile: user?.companyProfile || '',
    serviceIn: user?.serviceIn || 'Both', // 'B2B', 'B2C', 'Both'
    services: user?.services || [], // ['Air', 'Sea', 'Land', 'Warehouse', 'CHA']
    deductionPercentage: user?.deductionPercentage || 0.00,
    gst: user?.gst || '',
    serviceLocations: user?.serviceLocations || []
  });

  const [newLocation, setNewLocation] = useState('');

  const [uploading, setUploading] = useState({
    profilePhoto: false,
    uploadedDocument: false
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  const handleServiceChange = (serviceName) => {
    const updatedServices = [...formData.services];
    if (updatedServices.includes(serviceName)) {
      setFormData({
        ...formData,
        services: updatedServices.filter(s => s !== serviceName)
      });
    } else {
      setFormData({
        ...formData,
        services: [...updatedServices, serviceName]
      });
    }
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    const loc = newLocation.trim();
    if (loc && !formData.serviceLocations.includes(loc)) {
      setFormData(prev => ({
        ...prev,
        serviceLocations: [...prev.serviceLocations, loc]
      }));
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (locToRemove) => {
    setFormData(prev => ({
      ...prev,
      serviceLocations: prev.serviceLocations.filter(loc => loc !== locToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (formData.serviceIn === 'Both') {
      const val = parseFloat(formData.deductionPercentage);
      if (isNaN(val) || val <= 0) {
        setError("Deduction percentage is required and must be greater than 0 when Service Mode is set to Both.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateProfile(formData);
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

  const getLSID = (id) => {
    if (!id) return 'N/A';
    let hash = 0;
    const str = id.toString();
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 900000;
    }
    return 1000000000 + Math.abs(hash);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#0B1E43] tracking-tight flex items-center gap-3">
            Partner Profile
            <span className="bg-[#0066FF]/10 text-[#0066FF] text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
              LSID: LS-{getLSID(user?._id || user?.id)}
            </span>
          </h2>
          <p className="text-sm text-slate-500 font-semibold mt-1">Manage your company credentials, uploads, services, and bidding preferences.</p>
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

        {/* SECTION 1: PHOTO & DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
          <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-[#0066FF]" /> Profile Media & Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Photo */}
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

            {/* Document Upload */}
            <div className="p-5 bg-[#f8fafc] border border-slate-100 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Business Document (Certificate of Incorporation / ID)</label>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <div className="flex-grow space-y-2">
                  <label className="relative inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer transition-all shadow-sm">
                    {uploading.uploadedDocument ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-[#0066FF]" />
                        <span>Choose Document</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.png,.webp,.txt"
                      onChange={(e) => handleFileUpload(e, 'uploadedDocument')}
                      className="hidden" 
                      disabled={uploading.uploadedDocument}
                    />
                  </label>
                  {formData.uploadedDocument ? (
                    <a 
                      href={formData.uploadedDocument} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block text-[11px] text-[#0066FF] font-bold underline truncate max-w-[220px]"
                    >
                      View uploaded file
                    </a>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium">Supported: PDF, Word, Images (Max 10MB)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REPRESENTATIVE & CONTACT DETAILS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
          <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-[#0066FF]" /> Contact & Representative Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">First Name</label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. Mohammad"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. Waseeq"
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
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Alternative Email</label>
              <input 
                type="email" 
                value={formData.alternativeEmail}
                onChange={(e) => setFormData({ ...formData, alternativeEmail: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="Alternative email address"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Alternative Number</label>
              <input 
                type="text" 
                value={formData.alternativeNumber}
                onChange={(e) => setFormData({ ...formData, alternativeNumber: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="Alternative contact number"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: COMPANY DETAILS & DIRECTORS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
          <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Landmark size={16} className="text-[#0066FF]" /> Company Registration Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Organization Name</label>
              <input 
                type="text" 
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">GST Number</label>
              <input 
                type="text" 
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. 22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Website URL</label>
              <input 
                type="text" 
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. www.universallogisticservices.in"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Date of Incorporation</label>
              <input 
                type="date" 
                value={formData.dateOfIncorporation}
                onChange={(e) => setFormData({ ...formData, dateOfIncorporation: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Age of Company</label>
              <input 
                type="text" 
                value={formData.companyAge}
                onChange={(e) => setFormData({ ...formData, companyAge: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. 5 Years"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Last Financial Year Turnover</label>
              <input 
                type="text" 
                value={formData.lastYearTurnover}
                onChange={(e) => setFormData({ ...formData, lastYearTurnover: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="e.g. 1 Lakh/Crore"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Number of Directors</label>
              <input 
                type="number" 
                value={formData.directorsCount}
                onChange={(e) => setFormData({ ...formData, directorsCount: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Name of Directors</label>
              <input 
                type="text" 
                value={formData.directorsNames}
                onChange={(e) => setFormData({ ...formData, directorsNames: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="Separate names with commas"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Company Profile Brief</label>
              <textarea 
                value={formData.companyProfile}
                onChange={(e) => setFormData({ ...formData, companyProfile: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                rows="3"
                placeholder="Give a short summary of your company profile and core strengths..."
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: LOCATION & ADDRESS DETAILS */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-6">
          <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={16} className="text-[#0066FF]" /> Address & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">State</label>
              <input 
                type="text" 
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">City</label>
              <input 
                type="text" 
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Pincode</label>
              <input 
                type="text" 
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[#0B1E43] uppercase tracking-wide">Headquarters Address</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] focus:ring-4 focus:ring-[#0066FF]/5 transition-all font-semibold"
                placeholder="Full address of company headquarters"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: SERVICES, MODES & DEDUCTION SETTINGS */}
        <div className="bg-[#f8fafc] rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-[0_8px_30px_rgba(11,30,67,0.015)] space-y-6">
          <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-3">
            <Settings2 size={16} className="text-[#0066FF]" /> Service & Bidding Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Service Mode B2B / B2C */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-[#0B1E43] uppercase tracking-wider">Service Mode</label>
              <div className="flex flex-col gap-3">
                {['B2B', 'B2C', 'Both'].map((mode) => (
                  <label key={mode} className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input 
                      type="radio" 
                      name="serviceIn"
                      value={mode}
                      checked={formData.serviceIn === mode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Both') {
                          alert('please enter deduction percentage for vendor');
                        }
                        setFormData({ ...formData, serviceIn: val });
                      }}
                      className="w-4 h-4 text-[#0066FF] focus:ring-[#0066FF] border-slate-300"
                    />
                    <span>
                      {mode === 'B2B' && 'B2B (Only visible to Vendors)'}
                      {mode === 'B2C' && 'B2C (Only visible to Customers)'}
                      {mode === 'Both' && 'Both (Visible to Everyone)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Services offered */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-[#0B1E43] uppercase tracking-wider">Services Offered</label>
              <div className="grid grid-cols-2 gap-2">
                {['Air', 'Sea', 'Land', 'Warehouse', 'CHA'].map((service) => {
                  const isChecked = formData.services.includes(service);
                  return (
                    <label 
                      key={service} 
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-blue-50/70 border-[#0066FF]/35 text-[#0066FF]' 
                          : 'bg-[#f8fafc] border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleServiceChange(service)}
                        className="rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF] w-3.5 h-3.5"
                      />
                      <span>{service}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Deduction percentage */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-[#0B1E43] uppercase tracking-wider">
                Deduction Percentage (%) {formData.serviceIn === 'Both' && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max="100"
                  required={formData.serviceIn === 'Both'}
                  value={formData.deductionPercentage}
                  onChange={(e) => setFormData({ ...formData, deductionPercentage: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#0B1E43]">%</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-2">
                This percentage will reduce the display price of your quotes *only* when other vendors browse your rates.
              </p>
            </div>

            {/* Service Locations */}
            <div className="md:col-span-3 p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
              <label className="block text-xs font-bold text-[#0B1E43] uppercase tracking-wider">Service Locations</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLocation(e);
                    }
                  }}
                  className="flex-grow bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF]"
                  placeholder="Type a location (e.g. Mumbai, Delhi, Gujarat) and press Enter or click Add"
                />
                <button 
                  type="button"
                  onClick={handleAddLocation}
                  className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>
              
              {formData.serviceLocations && formData.serviceLocations.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.serviceLocations.map((loc, idx) => (
                    <span 
                      key={idx} 
                      className="bg-blue-50 text-[#0066FF] border border-[#0066FF]/20 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    >
                      {loc}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveLocation(loc)}
                        className="hover:text-red-500 font-extrabold focus:outline-none text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-semibold italic">No service locations added yet. All locations will be served by default.</p>
              )}
            </div>

          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving || uploading.profilePhoto || uploading.uploadedDocument}
            className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold px-8 py-4 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 cursor-pointer uppercase tracking-wider flex items-center gap-2"
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

export default VendorProfileTab;
