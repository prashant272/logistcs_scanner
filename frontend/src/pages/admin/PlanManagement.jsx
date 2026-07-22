import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, Globe, Tag, 
  DollarSign, Clock, Users, ShieldAlert, Bold, Italic, Link as LinkIcon, 
  List, ListOrdered, Undo, Redo, Image, Quote, Table, Video
} from 'lucide-react';
import MultiCountrySelect from '../../components/common/MultiCountrySelect';

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [editId, setEditId] = useState(null);
  const [planName, setPlanName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [status, setStatus] = useState('Active');
  const [planType, setPlanType] = useState('Regular');
  const [inquiryLimit, setInquiryLimit] = useState('');
  const [duration, setDuration] = useState('Monthly');
  const [userType, setUserType] = useState('customer');
  const [serviceType, setServiceType] = useState('All');
  const [countries, setCountries] = useState([]);
  
  const editorRef = useRef(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/plans`, config);
      setPlans(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  // Rich Text editor command handler
  const handleEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const handleEdit = (plan) => {
    setEditId(plan._id);
    setPlanName(plan.name || '');
    setPrice(plan.price !== undefined ? plan.price : '');
    setCurrency(plan.currency || 'INR');
    setStatus(plan.status || 'Active');
    setPlanType(plan.planType || 'Regular');
    setInquiryLimit(plan.inquiryLimit !== undefined ? plan.inquiryLimit : '');
    setDuration(plan.duration || 'Monthly');
    setUserType(plan.userType || 'customer');
    setServiceType(plan.serviceType || 'All');
    setCountries(plan.country ? plan.country.split(',').map(c => c.trim()) : []);
    if (editorRef.current) {
      editorRef.current.innerHTML = plan.description || '';
    }
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setPlanName('');
    setPrice('');
    setCurrency('INR');
    setStatus('Active');
    setPlanType('Regular');
    setInquiryLimit('');
    setDuration('Monthly');
    setUserType('customer');
    setServiceType('All');
    setCountries([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!planName || !price || !inquiryLimit || !duration || !userType || countries.length === 0) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    const descriptionHtml = editorRef.current ? editorRef.current.innerHTML : '';

    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const payload = {
        name: planName,
        price: Number(price),
        currency,
        status,
        planType,
        inquiryLimit: Number(inquiryLimit),
        duration,
        userType,
        serviceType,
        country: countries.join(', '),
        description: descriptionHtml
      };

      if (editId) {
        const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/plans/${editId}`, payload, config);
        setPlans(prev => prev.map(p => p._id === editId ? res.data : p));
        setSuccess('Plan updated successfully!');
        handleCancelEdit();
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/plans`, payload, config);
        setPlans(prev => [res.data, ...prev]);
        setSuccess('Plan created successfully!');
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save subscription plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, config);
      setPlans(prev => prev.filter(p => p._id !== id));
      setSuccess('Plan deleted successfully!');
      if (editId === id) handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('Failed to delete plan.');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/plans/${id}`, { status: nextStatus }, config);
      setPlans(prev => prev.map(p => p._id === id ? res.data : p));
      setSuccess(`Plan status updated to ${nextStatus}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update plan status.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Subscription Plans</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Create and manage customer and vendor membership tiers</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Creator Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider flex items-center gap-2">
              <Plus className="text-[#00b2fe] w-5 h-5" /> {editId ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
            </h3>
            {editId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-650 tracking-wider cursor-pointer"
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

          <form onSubmit={handleSave} className="space-y-6">
            {/* Input Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Plan Name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] transition-all"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Plan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] cursor-pointer transition-all"
                >
                  <option value="Regular">Regular Plan</option>
                  <option value="Topup">Top-up Plan</option>
                </select>
              </div>
            </div>

            {/* Input Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Price & Currency <span className="text-red-500">*</span>
                </label>
                <div className="flex bg-[#f4f7fc] border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-[#00b2fe] transition-all overflow-hidden">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-slate-100 border-r border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Enter Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-transparent px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] cursor-pointer transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Input Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Inquiry Limit <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Inquiry Limit"
                  value={inquiryLimit}
                  onChange={(e) => setInquiryLimit(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] transition-all"
                  required
                />
              </div>
            </div>

            {/* Input Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Plan Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] cursor-pointer transition-all"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Select User Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] cursor-pointer transition-all"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            </div>

            {/* Country Dropdown & Service Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MultiCountrySelect
                selectedCountries={countries}
                onChange={setCountries}
                label="Select Countries"
                required={true}
                showCustomOthersInput={false}
              />
              <div className="group">
                <label className="block text-xs font-bold !text-slate-900 mb-1">
                  Select Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#00b2fe] cursor-pointer transition-all"
                >
                  <option value="All">All Services</option>
                  <option value="Land">Land Only</option>
                </select>
              </div>
            </div>

            {/* Custom Rich Text Description Editor */}
            <div className="space-y-1">
              <label className="block text-xs font-bold !text-slate-900 mb-1">
                Plan Details / Features Description
              </label>
              
              {/* Rich Editor Toolbar */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
                <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1.5 items-center">
                  <select 
                    onChange={(e) => handleEditorCommand('formatBlock', e.target.value)}
                    className="bg-white border border-slate-200 text-[10px] font-bold px-2 py-1 rounded cursor-pointer text-slate-700 focus:outline-none"
                  >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                  </select>
                  
                  <div className="w-px h-5 bg-slate-200 mx-1"></div>

                  <button type="button" onClick={() => handleEditorCommand('bold')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bold"><Bold size={14} /></button>
                  <button type="button" onClick={() => handleEditorCommand('italic')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Italic"><Italic size={14} /></button>
                  <button type="button" onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) handleEditorCommand('createLink', url);
                  }} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Insert Link"><LinkIcon size={14} /></button>
                  
                  <button type="button" onClick={() => handleEditorCommand('insertUnorderedList')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bullet List"><List size={14} /></button>
                  <button type="button" onClick={() => handleEditorCommand('insertOrderedList')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Numbered List"><ListOrdered size={14} /></button>

                  <div className="w-px h-5 bg-slate-200 mx-1"></div>
                  
                  <button type="button" onClick={() => {
                    const url = prompt('Enter Image URL:');
                    if (url) handleEditorCommand('insertImage', url);
                  }} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Insert Image"><Image size={14} /></button>
                  <button type="button" onClick={() => handleEditorCommand('formatBlock', 'blockquote')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Insert Quote"><Quote size={14} /></button>
                  
                  <button type="button" onClick={() => handleEditorCommand('undo')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Undo"><Undo size={14} /></button>
                  <button type="button" onClick={() => handleEditorCommand('redo')} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Redo"><Redo size={14} /></button>
                </div>

                {/* contentEditable Area */}
                <div 
                  ref={editorRef}
                  contentEditable
                  className="p-4 min-h-[160px] max-h-72 overflow-y-auto text-xs text-slate-800 focus:outline-none leading-relaxed font-semibold bg-white"
                  placeholder="Write plan details or specifications here..."
                ></div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center py-3 mt-4 rounded-xl text-xs font-extrabold text-white bg-[#00b2fe] hover:bg-[#009bdc] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-md cursor-pointer uppercase tracking-wider"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <span>{editId ? 'Update Plan' : 'Save Plan'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Plan Card Preview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider">Plan Card Preview</h3>
            </div>
            
            {/* Live Premium Card Container */}
            <div className="bg-gradient-to-br from-[#00b2fe] to-[#0092d0] rounded-3xl p-6 text-white shadow-xl min-h-[300px] flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="space-y-5">
                {/* Header & Badges */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-black tracking-tight truncate max-w-[160px]">
                      {planName || 'Plan Name Preview'}
                    </h4>
                    <span className="text-[9px] bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full uppercase font-black tracking-widest block w-fit mt-1.5">
                      {userType} Tier
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-2xl text-right">
                    <span className="text-[8px] text-white/70 block uppercase font-bold tracking-wider">Country</span>
                    <span className="font-extrabold text-xs flex items-center gap-1 mt-0.5">
                      <Globe size={11} /> <span className="truncate max-w-[100px]" title={countries.length > 0 ? countries.join(', ') : 'Not Selected'}>{countries.length > 0 ? countries.join(', ') : 'Not Selected'}</span>
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="py-2">
                  <div className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black">{currency === 'USD' ? '$' : '₹'}{price ? Number(price).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US') : '0'}</span>
                      <span className="text-xs font-semibold text-white/80 ml-1">/ {duration} ({currency})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/80 font-bold block mt-1">
                    Limit: <span className="font-black text-white">{inquiryLimit || '0'}</span> Enquiries
                  </span>
                </div>

                {/* Details Features */}
                <div className="pt-2 border-t border-white/15">
                  <span className="text-[9px] text-white/70 uppercase font-black tracking-wider block mb-2">Plan Details</span>
                  <div 
                    className="text-xs text-white/90 leading-relaxed font-semibold space-y-1 max-h-48 overflow-y-auto pr-1"
                    dangerouslySetInnerHTML={{ __html: editorRef.current ? editorRef.current.innerHTML : 'No specifications entered yet.' }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span className="font-bold text-white/80">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  status === 'Active' ? 'bg-emerald-450 text-white' : 'bg-red-550 text-white'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-[10px] text-slate-500 font-bold leading-normal">
            This card represents how customers and vendors will see and buy this plan in their dashboard upgrades section.
          </div>
        </div>
      </div>

        {/* Plans List Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider">Subscription Tiers List</h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#00b2fe]" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-wider text-xs">
              No subscription plans configured yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-slate-600">
                <thead className="bg-slate-50 text-[#0B1E43] uppercase text-[9px] font-black tracking-widest border-b border-slate-150">
                  <tr>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">User Type</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Country</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Limit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {plans.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-[#0B1E43] font-black">{p.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${p.planType === 'Topup' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {p.planType || 'Regular'}
                        </span>
                      </td>
                      <td className="p-4 uppercase tracking-wider text-slate-500">{p.userType}</td>
                      <td className="p-4 text-slate-500 font-bold">{p.serviceType || 'All'}</td>
                      <td className="p-4 flex items-center gap-1.5 mt-1.5">
                        <Globe size={13} className="text-slate-400" />
                        <span className="truncate max-w-[120px]" title={p.country}>{p.country}</span>
                      </td>
                      <td className="p-4 font-extrabold text-slate-800">
                        {p.currency === 'USD' ? '$' : '₹'} {p.price?.toLocaleString(p.currency === 'INR' ? 'en-IN' : 'en-US')}
                      </td>
                      <td className="p-4 text-slate-500">{p.duration}</td>
                      <td className="p-4 font-mono text-slate-700">{p.inquiryLimit} Enquiries</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(p._id, p.status)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer ${
                            p.status === 'Active' 
                              ? 'bg-green-50 text-green-600 border-green-100' 
                              : 'bg-red-50 text-red-500 border-red-100'
                          }`}
                        >
                          {p.status === 'Active' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-[#00b2fe] hover:text-[#009bdc] p-1.5 rounded-lg hover:bg-sky-50 transition-all inline-flex items-center cursor-pointer"
                          title="Edit Plan"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all inline-flex items-center cursor-pointer"
                          title="Delete Plan"
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
    );
  };

export default PlanManagement;
