import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Download, 
  FileText, 
  Loader2, 
  Plus, 
  X, 
  Building2, 
  Mail, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Globe, 
  Calendar, 
  Search, 
  UserCheck, 
  MapPin, 
  Sparkles,
  ChevronDown,
  Trash2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import InvoiceTemplate from '../../components/shared/InvoiceTemplate';

const STANDARD_COUNTRIES = [
  'India',
  'United States',
  'United Arab Emirates',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Germany',
  'Saudi Arabia',
  'Qatar',
  'Oman',
  'Kuwait',
  'Other / Worldwide'
];

const AdminPlanInvoicesTab = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Create Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plansList, setPlansList] = useState([]);
  
  // Real-time user lookup
  const [userQuery, setUserQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isCustomPlan, setIsCustomPlan] = useState(false);

  const [formData, setFormData] = useState({
    vendorId: '',
    vendorEmail: '',
    companyName: '',
    address: '',
    country: 'India',
    currency: 'INR',
    gstNo: '',
    panNo: '',
    planName: '',
    sacCode: '9956',
    baseAmount: '',
    gstRate: 18,
    paymentMethod: 'Bank Transfer',
    paymentReferenceNo: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const invoiceRef = useRef();
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    fetchInvoices();
    fetchPlans();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/invoices/admin`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (Array.isArray(res.data)) {
        setInvoices(res.data);
      } else {
        console.error('Expected an array of invoices, but got:', res.data);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/plans`);
      const plans = Array.isArray(res.data) ? res.data : [];
      setPlansList(plans);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  // Debounced real-time user lookup
  const handleUserSearchChange = (val) => {
    setUserQuery(val);
    setShowUserDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setUserSearchResults([]);
      setIsSearchingUser(false);
      return;
    }

    setIsSearchingUser(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/invoices/admin/lookup-user?query=${encodeURIComponent(val)}`, {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
        });
        setUserSearchResults(res.data?.users || []);
      } catch (err) {
        console.error('User lookup error:', err);
      } finally {
        setIsSearchingUser(false);
      }
    }, 200);
  };

  // Helper to filter plans according to country
  const getFilteredPlans = (countryName) => {
    if (!plansList || plansList.length === 0) return [];
    if (!countryName) return plansList;
    const c = countryName.trim().toLowerCase();
    const isIndia = c === 'india' || c === 'in' || !c;

    if (isIndia) {
      return plansList.filter(p => {
        const pc = (p.country || '').trim().toLowerCase();
        return pc === 'india' || pc === 'in' || !pc || p.currency === 'INR';
      });
    } else {
      return plansList.filter(p => {
        const pc = (p.country || '').trim().toLowerCase();
        if (pc === 'india' || pc === 'in') return false;
        if (pc === c) return true;
        if ((c.includes('united states') || c === 'usa' || c === 'us') && (pc.includes('united states') || pc === 'usa' || pc === 'us')) return true;
        if ((c.includes('uae') || c.includes('united arab emirates')) && (pc.includes('uae') || pc.includes('united arab emirates'))) return true;
        if ((c.includes('uk') || c.includes('united kingdom')) && (pc.includes('uk') || pc.includes('united kingdom'))) return true;
        if (pc === 'worldwide' || pc === 'others' || pc === 'other' || p.currency === 'USD') return true;
        return false;
      });
    }
  };

  // When a user profile is clicked from search results
  const handleSelectUserProfile = (user) => {
    const rawCountry = (user.country || '').trim();
    const isForeign = rawCountry && rawCountry.toLowerCase() !== 'india' && rawCountry.toLowerCase() !== 'in';
    const finalCountry = rawCountry || 'India';
    const finalCurrency = isForeign ? 'USD' : 'INR';

    // Find applicable plans for this user's country
    const applicablePlans = getFilteredPlans(finalCountry);
    const defaultPlan = applicablePlans.length > 0 ? applicablePlans[0] : null;

    const resolvedCompanyName = user.company || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
    const resolvedAddress = [user.address, user.city, user.state, user.pincode].filter(Boolean).join(', ');

    setFormData({
      vendorId: user._id,
      vendorEmail: user.email || '',
      companyName: resolvedCompanyName,
      address: resolvedAddress,
      country: finalCountry,
      currency: finalCurrency,
      gstNo: user.gst || '',
      panNo: user.pan || '',
      planName: defaultPlan ? defaultPlan.name : (formData.planName || 'Yearly Membership Plan'),
      baseAmount: defaultPlan ? defaultPlan.price : (formData.baseAmount || ''),
      gstRate: isForeign ? 0 : 18,
      sacCode: isForeign ? '998313' : '9956',
      paymentMethod: 'Bank Transfer',
      paymentReferenceNo: '',
      date: new Date().toISOString().slice(0, 10),
    });

    setIsCustomPlan(false);
    setUserQuery(user.email || resolvedCompanyName);
    setShowUserDropdown(false);
  };

  // When Country is changed manually
  const handleCountryChange = (newCountry) => {
    const isForeign = newCountry && newCountry.trim().toLowerCase() !== 'india' && newCountry.trim().toLowerCase() !== 'in';
    const finalCurrency = isForeign ? 'USD' : 'INR';
    const applicablePlans = getFilteredPlans(newCountry);
    const matchingPlan = applicablePlans.find(p => p.name === formData.planName) || (applicablePlans.length > 0 ? applicablePlans[0] : null);

    setFormData(prev => ({
      ...prev,
      country: newCountry,
      currency: finalCurrency,
      gstRate: isForeign ? 0 : 18,
      sacCode: isForeign ? '998313' : '9956',
      planName: matchingPlan ? matchingPlan.name : (isCustomPlan ? prev.planName : ''),
      baseAmount: matchingPlan ? matchingPlan.price : (isCustomPlan ? prev.baseAmount : ''),
    }));
  };

  // When Plan is selected from dropdown
  const handlePlanDropdownChange = (selectedName) => {
    if (selectedName === '__custom__') {
      setIsCustomPlan(true);
      setFormData(prev => ({ ...prev, planName: '', baseAmount: '' }));
      return;
    }

    setIsCustomPlan(false);
    const foundPlan = plansList.find(p => p.name === selectedName);
    if (foundPlan) {
      setFormData(prev => ({
        ...prev,
        planName: foundPlan.name,
        baseAmount: foundPlan.price,
      }));
    } else {
      setFormData(prev => ({ ...prev, planName: selectedName }));
    }
  };

  const openCreateModal = () => {
    const defaultPlans = getFilteredPlans('India');
    const firstPlan = defaultPlans.length > 0 ? defaultPlans[0] : null;

    setFormData({
      vendorId: '',
      vendorEmail: '',
      companyName: '',
      address: '',
      country: 'India',
      currency: 'INR',
      gstNo: '',
      panNo: '',
      planName: firstPlan ? firstPlan.name : 'Yearly Membership Plan',
      sacCode: '9956',
      baseAmount: firstPlan ? firstPlan.price : '',
      gstRate: 18,
      paymentMethod: 'Bank Transfer',
      paymentReferenceNo: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setUserQuery('');
    setUserSearchResults([]);
    setIsCustomPlan(false);
    setIsModalOpen(true);
  };

  // Live Summary Calculation
  const isForeignCountry = (formData.country && formData.country.trim().toLowerCase() !== 'india' && formData.country.trim().toLowerCase() !== 'in') || formData.currency === 'USD';
  const numBase = Number(formData.baseAmount) || 0;
  const numGstRate = isForeignCountry ? 0 : (Number(formData.gstRate) || 0);
  const calculatedTax = Math.round((numBase * numGstRate) / 100);
  const calculatedTotal = numBase + calculatedTax;

  const currentAvailablePlans = getFilteredPlans(formData.country);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      alert('Please enter Company Name');
      return;
    }
    if (!formData.baseAmount || Number(formData.baseAmount) <= 0) {
      alert('Please enter a valid Base Amount');
      return;
    }

    try {
      setCreating(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/invoices/admin/create`,
        {
          ...formData,
          baseAmount: numBase,
          gstRate: numGstRate,
        },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
        }
      );

      if (res.data?.invoice) {
        setIsModalOpen(false);
        setUserQuery('');
        fetchInvoices();
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    const confirmed = window.confirm(`Are you sure you want to delete invoice "${invoice.invoiceNo}" for "${invoice.companyName}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(invoice._id);
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/invoices/admin/${invoice._id}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      setInvoices(prev => prev.filter(inv => inv._id !== invoice._id));
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (invoice) => {
    setDownloadingId(invoice._id);
    setSelectedInvoice(invoice);

    setTimeout(() => {
      const element = invoiceRef.current;
      if (!element) {
        setDownloadingId(null);
        setSelectedInvoice(null);
        return;
      }

      const opt = {
        margin:       [6, 6, 6, 6],
        filename:     `Invoice_${invoice.invoiceNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setDownloadingId(null);
        setSelectedInvoice(null);
      }).catch((err) => {
        console.error('PDF generation error:', err);
        setDownloadingId(null);
        setSelectedInvoice(null);
      });
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#0B1E43]">Plan Invoices</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Generated invoices for vendor & client subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#0066FF] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">
            Total: {invoices.length}
          </span>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-black text-slate-700">No Invoices Found</h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">No invoices have been created or purchased yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Invoice No</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Vendor / Company</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Country</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Plan Name</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Total Amount</th>
                <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const isUsd = inv.currency === 'USD' || (inv.country && inv.country.toLowerCase() !== 'india' && inv.country.toLowerCase() !== 'in');
                return (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-slate-900">{inv.invoiceNo}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold text-slate-600">
                        {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{inv.companyName}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{inv.vendor?.email || inv.address || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        isUsd 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        <Globe size={11} />
                        {inv.country || 'India'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        {inv.planName}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-black text-slate-900">
                        {isUsd ? `$ ${inv.totalAmount?.toLocaleString()}` : `₹${inv.totalAmount?.toLocaleString()}`}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv._id || deletingId === inv._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0066FF] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                          title="Download PDF Invoice"
                        >
                          {downloadingId === inv._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Download size={12} />
                          )}
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          disabled={deletingId === inv._id || downloadingId === inv._id}
                          className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer group"
                          title="Delete Invoice"
                        >
                          {deletingId === inv._id ? (
                            <Loader2 size={13} className="animate-spin text-rose-500" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-[#0B1E43] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0066FF]" />
                  Create Manual Plan Invoice
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Generate invoice for Indian (₹ + 18% GST) or International ($ 0% GST) vendors & clients
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* LIVE USER SEARCH & AUTO-FILL BOX */}
              <div ref={searchContainerRef} className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Search size={13} className="text-[#0066FF]" />
                    Search User / Vendor (Auto-Fill Profile Details)
                  </span>
                  {formData.vendorId && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <UserCheck size={12} /> Profile Linked
                    </span>
                  )}
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Type Email, Name, or Company to auto-fill..."
                    value={userQuery}
                    onChange={(e) => handleUserSearchChange(e.target.value)}
                    onFocus={() => {
                      if (userSearchResults.length > 0) setShowUserDropdown(true);
                    }}
                    className="w-full pl-9 pr-10 py-2.5 bg-blue-50/40 border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF] transition-all"
                  />
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                  
                  {isSearchingUser ? (
                    <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#0066FF]" />
                  ) : userQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUserQuery('');
                        setUserSearchResults([]);
                        setShowUserDropdown(false);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>

                {/* Autocomplete Dropdown */}
                {showUserDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-56 overflow-y-auto">
                    {userSearchResults.length > 0 ? (
                      <div className="py-1 divide-y divide-slate-100">
                        {userSearchResults.map((u) => {
                          const uCountry = u.country || 'India';
                          const isUForeign = uCountry.toLowerCase() !== 'india' && uCountry.toLowerCase() !== 'in';
                          const displayName = u.company || u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
                          return (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => handleSelectUserProfile(u)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-[#0066FF] group-hover:text-white transition-colors">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {displayName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                    <span>{u.email}</span>
                                    {u.phone && <span>• {u.phone}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isUForeign ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {uCountry}
                                </span>
                                <span className="text-[10px] uppercase font-black text-slate-400">
                                  {u.role || 'user'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : userQuery.length >= 2 ? (
                      <div className="px-4 py-4 text-center text-xs text-slate-500 font-medium">
                        No user profile found matching "{userQuery}". You can enter custom details below.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Vendor & Client Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    User / Vendor Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={formData.vendorEmail}
                    onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Company / Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cepta Global Pvt Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 210 Janakpuri District Center, New Delhi - 110058"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                />
              </div>

              {/* Country & Currency Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Country <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-semibold">Determines Currency & GST</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  >
                    {/* Add current country if not in standard list */}
                    {formData.country && !STANDARD_COUNTRIES.includes(formData.country) && (
                      <option value={formData.country}>{formData.country} (Custom Profile Country)</option>
                    )}
                    <option value="India">India (Domestic - INR ₹ + 18% GST)</option>
                    <option value="United States">United States (USD $ + 0% GST)</option>
                    <option value="United Arab Emirates">United Arab Emirates (USD $ + 0% GST)</option>
                    <option value="United Kingdom">United Kingdom (USD $ + 0% GST)</option>
                    <option value="Canada">Canada (USD $ + 0% GST)</option>
                    <option value="Australia">Australia (USD $ + 0% GST)</option>
                    <option value="Singapore">Singapore (USD $ + 0% GST)</option>
                    <option value="Germany">Germany (USD $ + 0% GST)</option>
                    <option value="Saudi Arabia">Saudi Arabia (USD $ + 0% GST)</option>
                    <option value="Qatar">Qatar (USD $ + 0% GST)</option>
                    <option value="Oman">Oman (USD $ + 0% GST)</option>
                    <option value="Kuwait">Kuwait (USD $ + 0% GST)</option>
                    <option value="Other / Worldwide">Other / Worldwide (USD $ + 0% GST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                  </select>
                </div>
              </div>

              {/* GST and PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isForeignCountry ? 'Tax ID / VAT No (Optional)' : 'GSTIN (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isForeignCountry ? 'e.g. US-TAX-98271' : '07AAAAA0000A1Z5'}
                    value={formData.gstNo}
                    onChange={(e) => setFormData({ ...formData, gstNo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.panNo}
                    onChange={(e) => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>
              </div>

              {/* Plan & Pricing Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Plan / Service <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {isForeignCountry ? 'Showing International/USD Plans' : 'Showing India/INR Plans'}
                    </span>
                  </label>
                  
                  <select
                    value={isCustomPlan ? '__custom__' : (formData.planName || '')}
                    onChange={(e) => handlePlanDropdownChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  >
                    {currentAvailablePlans.length > 0 ? (
                      currentAvailablePlans.map(p => (
                        <option key={p._id} value={p.name}>
                          {p.name} — {p.currency || (isForeignCountry ? 'USD' : 'INR')} {p.price} ({p.duration || 'Plan'})
                        </option>
                      ))
                    ) : (
                      <option value="Yearly Membership Plan">Yearly Membership Plan</option>
                    )}
                    <option value="__custom__">+ Enter Custom Plan Name...</option>
                  </select>

                  {/* If custom plan selected, show text input */}
                  {isCustomPlan && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom plan or service name"
                      value={formData.planName}
                      onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                      className="mt-2 w-full px-3.5 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Base Amount ({formData.currency === 'USD' ? '$' : '₹'}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formData.currency === 'USD' ? '$' : '₹'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 1000"
                      value={formData.baseAmount}
                      onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Payment Gateway">Payment Gateway / Razorpay</option>
                    <option value="Wire Transfer">Wire Transfer (International)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Reference / TXN ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN98765432"
                    value={formData.paymentReferenceNo}
                    onChange={(e) => setFormData({ ...formData, paymentReferenceNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066FF]"
                  />
                </div>
              </div>

              {/* LIVE AMOUNT PREVIEW CARD */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                  <span>Invoice Calculation Summary</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    isForeignCountry ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isForeignCountry ? 'International Export (0% Tax)' : 'Domestic Tax Invoice (18% GST)'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Amount:</span>
                    <span className="font-bold text-slate-800">
                      {formData.currency === 'USD' ? `$ ${numBase.toFixed(2)}` : `₹ ${numBase.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {isForeignCountry ? 'Export Tax (Zero-Rated):' : `GST (${numGstRate}%):`}
                    </span>
                    <span className="font-bold text-slate-800">
                      {isForeignCountry ? '$ 0.00' : `₹ ${calculatedTax.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#0B1E43] pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-[#0066FF]">
                      {formData.currency === 'USD' ? `$ ${calculatedTotal.toFixed(2)}` : `₹ ${calculatedTotal.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{creating ? 'Generating Invoice...' : 'Create & Generate Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Invoice Template for PDF Generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -9999 }}>
        {selectedInvoice && (
          <InvoiceTemplate invoice={selectedInvoice} forwardRef={invoiceRef} />
        )}
      </div>
    </div>
  );
};

export default AdminPlanInvoicesTab;
