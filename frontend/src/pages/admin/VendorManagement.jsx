import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { 
  ShieldCheck, Truck, Mail, Phone, MapPin, Building, Calendar, 
  Search, ExternalLink, LogIn, CheckCircle2, AlertCircle, Upload, RefreshCw, Plus, X, Loader2, Activity, Edit
} from 'lucide-react';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [uploadingVendorId, setUploadingVendorId] = useState(null);
  const [rms, setRms] = useState([]);
  const [plans, setPlans] = useState([]);
  const [assigningRmId, setAssigningRmId] = useState(null);
  const [updatingPlanId, setUpdatingPlanId] = useState(null);
  
  // Activity Modal State
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add Vendor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingVendor, setAddingVendor] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '', email: '', password: '', phone: '', company: '', country: '', state: '', city: ''
  });

  // Edit Vendor Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(false);
  const [editVendorId, setEditVendorId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    company: '', email: '', phone: '', country: ''
  });

  // Credit Vendor Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditingVendor, setCreditingVendor] = useState(false);
  const [creditVendorId, setCreditVendorId] = useState(null);
  const [creditFormData, setCreditFormData] = useState({
    takesCreditDays: 0, givesCreditDays: 0
  });

  // Verify Documents Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingVendor, setVerifyingVendor] = useState(false);
  const [verifyVendorId, setVerifyVendorId] = useState(null);
  const [verifyFormData, setVerifyFormData] = useState({
    gst: '', pan: ''
  });

  // Duplicate Branch Confirm Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateVendorInfo, setDuplicateVendorInfo] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    gst: '', pan: '', address: ''
  });

  useEffect(() => {
    fetchRMs();
    fetchPlans();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchVendors = useCallback(async (targetPage = page, isReset = false) => {
    try {
      if (targetPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');
      const token = sessionStorage.getItem('adminToken');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors?page=${targetPage}&limit=10&search=${debouncedSearchQuery}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (targetPage === 1 || isReset) {
        setVendors(data.data || []);
      } else {
        setVendors(prev => [...prev, ...(data.data || [])]);
      }
      setHasMore(targetPage < data.totalPages);
      
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearchQuery, statusFilter]);

  // Reset page when search or status changes
  useEffect(() => {
    setPage(1);
    setVendors([]);
    fetchVendors(1, true);
  }, [debouncedSearchQuery, statusFilter, fetchVendors]);

  // Fetch vendors when page changes
  useEffect(() => {
    if (page > 1) {
      fetchVendors(page);
    }
  }, [page, fetchVendors]);

  const fetchRMs = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/rm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRms(data || []);
    } catch (err) {
      console.error('Error fetching RMs:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/plans`);
      setPlans(data || []);
    } catch (err) {
      console.error('Error toggling verification:', err);
    }
  };

  const handleUpdateCredit = async (e) => {
    e.preventDefault();
    if (!creditVendorId) return;

    try {
      setCreditingVendor(true);
      const token = sessionStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${creditVendorId}/credit`,
        creditFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVendors(prev => prev.map(v => 
        v._id === creditVendorId 
          ? { ...v, takesCreditDays: creditFormData.takesCreditDays, givesCreditDays: creditFormData.givesCreditDays }
          : v
      ));
      
      setShowCreditModal(false);
    } catch (err) {
      console.error('Error updating credit:', err);
      alert(err.response?.data?.message || 'Failed to update credit');
    } finally {
      setCreditingVendor(false);
    }
  };

  const handleViewActivity = async (vendorId) => {
    setLoadingActivity(true);
    setActivityData(null);
    setActivityModalOpen(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/vendor-history/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityData(data);
    } catch (err) {
      console.error('Error fetching activity:', err);
      alert('Failed to fetch vendor activity');
      setActivityModalOpen(false);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleUnacceptEnquiry = async (vendorId, enquiryId) => {
    if (!window.confirm("Are you sure you want to revert this acceptance? The enquiry will be set back to Pending for this vendor.")) return;
    try {
      const token = sessionStorage.getItem('adminToken');
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/vendor-history/${vendorId}/unaccept/${enquiryId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh the modal data
      handleViewActivity(vendorId);
    } catch (err) {
      console.error('Error unaccepting enquiry:', err);
      alert(err.response?.data?.message || 'Failed to revert acceptance');
    }
  };

  const handleAssignPlan = async (vendorId, planId) => {
    try {
      setUpdatingPlanId(vendorId);
      const token = sessionStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${vendorId}/plan`, { planId }, config);
      
      alert('Plan updated successfully!');
      
      // Update local state
      setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, activePlan: data.vendor.activePlan, planEndDate: data.vendor.planEndDate, topupEnquiryLimit: data.vendor.topupEnquiryLimit } : v));
    } catch (err) {
      console.error('Update plan failed:', err);
      alert(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setVendors([]);
    fetchVendors(1, true);
  };

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const lastVendorElementRef = useInfiniteScroll(handleLoadMore, hasMore, loadingMore || loading);

  // Impersonate / Login as Vendor
  const handleLoginAsVendor = async (vendorId) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/impersonate/${vendorId}`, config);
      
      // Save vendor's token into userToken
      localStorage.setItem('userToken', data.token);
      // Open vendor dashboard in the same tab
      window.location.href = '/vendor/dashboard';
    } catch (err) {
      console.error('Impersonation failed:', err);
      alert(err.response?.data?.message || 'Failed to login as vendor');
    }
  };

  // Set Verification status (Approved / Pending / Declined)
  const handleSetStatus = async (vendorId, status) => {
    // Optimistic Update
    const previousVendors = [...vendors];
    setVendors(prev => prev.map(v => v._id === vendorId ? { 
      ...v, 
      isVerified: status === 'Approved', 
      verificationStatus: status 
    } : v));

    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${vendorId}/verify`, { status }, config);
    } catch (err) {
      console.error('Update status failed:', err);
      // Revert Optimistic Update on failure
      setVendors(previousVendors);
      alert('Failed to update status');
    }
  };

  const handleAssignRM = async (vendorId, rmId) => {
    try {
      setAssigningRmId(vendorId);
      const token = sessionStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/rm/assign`, { vendorId, rmId }, config);
      
      // Update local state
      setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, assignedRM: rmId ? { _id: rmId } : null } : v));
    } catch (err) {
      console.error('Assign RM failed:', err);
      alert('Failed to assign RM');
    } finally {
      setAssigningRmId(null);
    }
  };

  // Handle Certificate Upload on behalf of the Vendor
  const handleCertificateUpload = async (e, vendorId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingVendorId(vendorId);
      const token = sessionStorage.getItem('adminToken');
      
      // 1. Upload the file
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const uploadedUrl = uploadRes.data.url;

      // 2. Associate the document with the vendor profile in backend
      // We will perform a profile update using vendor's impersonated scope or admin-level vendor update
      // For simplicity, update directly or impersonate to save
      const impersonateRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/impersonate/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const vendorToken = impersonateRes.data.token;
      
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        uploadedDocument: uploadedUrl
      }, {
        headers: { Authorization: `Bearer ${vendorToken}` }
      });

      // Update local state
      setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, uploadedDocument: uploadedUrl } : v));
      alert('Certificate uploaded successfully!');
    } catch (err) {
      console.error('Certificate upload failed:', err);
      alert('Failed to upload certificate');
    } finally {
      setUploadingVendorId(null);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      setAddingVendor(true);
      const token = sessionStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        ...addFormData,
        role: 'vendor'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Vendor created successfully!');
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', password: '', phone: '', company: '', country: '', state: '', city: '' });
      handleRefresh();
    } catch (err) {
      console.error('Add vendor failed:', err);
      alert(err.response?.data?.message || 'Failed to add vendor');
    } finally {
      setAddingVendor(false);
    }
  };

  const handleVerifyDocumentsSubmit = async (e, isBranchOf = null) => {
    if (e) e.preventDefault();
    try {
      setVerifyingVendor(true);
      const token = sessionStorage.getItem('adminToken');
      
      let payload = { ...verifyFormData };
      
      if (isBranchOf) {
        payload = {
            pan: branchFormData.pan, // The branch PAN (editable, defaults to duplicate's PAN)
            gst: branchFormData.gst, // The NEW unique branch GST
            branchAddress: branchFormData.address, // The NEW branch address (optional)
            isBranchOf: isBranchOf
        };
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${verifyVendorId}/verify-documents`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setVendors(prev => prev.map(v => v._id === verifyVendorId ? data.vendor : v));
      
      alert('Documents verified successfully!');
      setShowVerifyModal(false);
      setShowDuplicateModal(false);
      setShowBranchForm(false);
      setVerifyFormData({ gst: '', pan: '' });
      setBranchFormData({ gst: '', address: '' });
      setVerifyVendorId(null);
      setDuplicateVendorInfo(null);
    } catch (err) {
      console.error('Verify documents failed:', err);
      if (err.response?.status === 409 && err.response?.data?.duplicateVendor) {
        // Trigger duplicate confirmation modal
        setDuplicateVendorInfo(err.response.data.duplicateVendor);
        setShowDuplicateModal(true);
        setShowBranchForm(false);
        setBranchFormData({ 
            gst: '', 
            pan: err.response.data.duplicateVendor?.pan || '', 
            address: '' 
        });
      } else {
        alert(err.response?.data?.message || 'Failed to verify documents');
      }
    } finally {
      setVerifyingVendor(false);
    }
  };

  const openVerifyModal = (vendor) => {
    setVerifyVendorId(vendor._id);
    setVerifyFormData({
      gst: vendor.gst || '',
      pan: vendor.pan || ''
    });
    setShowVerifyModal(true);
  };

  const handleEditClick = (vendor) => {
    setEditVendorId(vendor._id);
    setEditFormData({
      company: vendor.company || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      country: vendor.country || 'India'
    });
    setShowEditModal(true);
  };

  const handleEditVendor = async (e) => {
    e.preventDefault();
    setEditingVendor(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${editVendorId}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchVendors(page, true);
      alert('Vendor details updated successfully');
    } catch (err) {
      console.error('Error updating vendor:', err);
      alert(err.response?.data?.message || 'Failed to update vendor');
    } finally {
      setEditingVendor(false);
    }
  };

  const handleUpdateLimit = async (vendorId, limit) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${vendorId}/enquiry-limit`, { limit }, config);
      alert('Limit updated successfully!');
      
      // Update local state
      setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, topupEnquiryLimit: Number(limit) } : v));
    } catch (err) {
      console.error('Update limit failed:', err);
      alert('Failed to update limit');
    }
  };

  const filteredVendors = vendors;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Vendor Management</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Manage transport partners, view certificates, verify status, and login to dashboards</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all shadow-sm cursor-pointer"
          >
            <option value="All Status">All Status</option>
            <option value="Approved">Approved</option>
            <option value="Pre Approved">Pre Approved</option>
            <option value="Declined">Declined</option>
            <option value="Pending">Pending</option>
            <option value="Login">Login</option>
            <option value="Premium Vendors">Premium Vendors</option>
            <option value="Paid Vendors">Paid Vendors</option>
          </select>

          <button 
            onClick={handleRefresh} 
            className="p-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-650 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Vendors"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-[#0066FF]" : ""} />
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl transition-all shadow-sm font-bold flex items-center gap-2 text-xs"
          >
            <Plus size={16} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0066FF] rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-650 p-4 rounded-2xl text-xs font-bold">
          {error}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-sm font-black text-[#0B1E43] uppercase tracking-wider mb-1">No vendors found</h3>
          <p className="text-slate-400 text-xs">
            {searchQuery ? "No transport partners match your search filters." : "No registered transport partners available."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_12px_40px_rgba(11,30,67,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-4 text-center">Dashboard</th>
                  <th className="p-4 text-center">Activity</th>
                  <th className="p-4 text-center">Edit</th>
                  <th className="p-4 text-center">Credit</th>
                  <th className="p-4">First Name</th>
                  <th className="p-4">Last Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Current Plan</th>
                  <th className="p-4 text-center">Change Plan</th>
                  <th className="p-4">Enquiry Limit</th>
                  <th className="p-4">Carrier ID</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4">Document</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Assign RM</th>
                  <th className="p-4 text-center">Upload Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {filteredVendors.map((vendor, index) => {
                  const firstName = vendor.firstName || vendor.name?.split(' ')[0] || 'N/A';
                  const lastName = vendor.lastName || vendor.name?.split(' ').slice(1).join(' ') || 'N/A';
                  const baseLimit = vendor.activePlan?.inquiryLimit || 5;
                  const totalLimit = baseLimit + (vendor.topupEnquiryLimit || 0);
                  
                  return (
                    <tr 
                      key={vendor._id} 
                      ref={index === filteredVendors.length - 1 ? lastVendorElementRef : null}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Login Dashboard impersonation */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleLoginAsVendor(vendor._id)}
                          className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm shadow-[#0066FF]/10 uppercase tracking-wider"
                          title="Login directly as this vendor"
                        >
                          <LogIn size={12} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewActivity(vendor._id)}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-black p-1.5 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer transition-colors"
                          title="View Vendor Activity"
                        >
                          <Activity size={14} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEditClick(vendor)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 text-[10px] font-black p-1.5 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer transition-colors"
                          title="Edit Vendor Details"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setCreditVendorId(vendor._id);
                            setCreditFormData({
                              takesCreditDays: vendor.takesCreditDays || 0,
                              givesCreditDays: vendor.givesCreditDays || 0
                            });
                            setShowCreditModal(true);
                          }}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-[10px] font-black p-1.5 rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer transition-colors"
                          title="Manage Vendor Credit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </td>
                      <td className="p-4 text-slate-800">{firstName}</td>
                      <td className="p-4 text-slate-800">{lastName}</td>
                      <td className="p-4 text-slate-500 font-medium">{vendor.email}</td>
                      <td className="p-4 text-[#0B1E43] font-black">
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-slate-400 shrink-0" />
                          <span>{vendor.company || 'Not Specified'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700">{vendor.country || 'India'}</td>
                      <td className="p-4 text-slate-700">{vendor.phone || 'N/A'}</td>
                      <td className="p-4 text-slate-450 font-medium">
                        {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      {/* New Columns */}
                      <td className="p-4 text-slate-700">
                        {vendor.activePlan && vendor.activePlan.name ? (
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            {vendor.activePlan.name}
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Free Plan
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <select
                          disabled={updatingPlanId === vendor._id}
                          value={vendor.activePlan?._id || ''}
                          onChange={(e) => handleAssignPlan(vendor._id, e.target.value)}
                          className="bg-white border border-slate-200/80 rounded-xl px-2 py-1.5 text-[10px] text-slate-700 font-bold focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all cursor-pointer shadow-sm w-32"
                        >
                          <option value="">Free Plan</option>
                          {plans.map(plan => (
                            <option key={plan._id} value={plan._id}>{plan.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            defaultValue={totalLimit}
                            className="w-16 bg-white border border-slate-200 rounded p-1 text-[10px] text-center font-bold focus:outline-none focus:border-[#0066FF]"
                            onBlur={(e) => {
                              const newVal = parseInt(e.target.value);
                              if (newVal !== totalLimit && !isNaN(newVal)) {
                                // Calculate extra needed to reach the new total
                                const newExtra = newVal - baseLimit;
                                handleUpdateLimit(vendor._id, newExtra);
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-500">{vendor._id.slice(-8).toUpperCase()}</td>
                      <td className="p-4 text-slate-450 font-medium">
                          <div className="flex flex-col gap-1">
                            <span>{vendor.lastActive ? new Date(vendor.lastActive).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</span>
                            {vendor.lastLoginSource && (
                              <span className={`w-fit px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${vendor.lastLoginSource === 'app' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {vendor.lastLoginSource === 'app' ? '📱 App' : '🌐 Web'}
                              </span>
                            )}
                          </div>
                      </td>
                      {/* Document Viewer */}
                      <td className="p-4">
                        {vendor.uploadedDocument ? (
                          <a 
                            href={vendor.uploadedDocument} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#0066FF] hover:underline flex items-center gap-1 uppercase text-[10px] font-black tracking-wider"
                          >
                            View Doc <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic font-medium">No Document</span>
                        )}
                        <button
                          onClick={() => openVerifyModal(vendor)}
                          className="mt-2 px-2.5 py-1 w-full rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                        >
                          Verify Doc
                        </button>
                      </td>
                      {/* Verification Status controls (3 buttons) */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col gap-1 w-fit mx-auto">
                          <button
                            onClick={() => handleSetStatus(vendor._id, 'Approved')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                              (vendor.verificationStatus === 'Approved' || (vendor.isVerified && !vendor.verificationStatus))
                                ? 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/10' 
                                : 'bg-green-50 text-green-650 border-green-100 hover:bg-green-100/50'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleSetStatus(vendor._id, 'Pending')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                              (vendor.verificationStatus === 'Pending' || (!vendor.isVerified && !vendor.verificationStatus))
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/10' 
                                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50'
                            }`}
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => handleSetStatus(vendor._id, 'Pre Approved')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                              (vendor.verificationStatus === 'Pre Approved')
                                ? 'bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-500/10' 
                                : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/50'
                            }`}
                          >
                            Pre Approve
                          </button>
                          <button
                            onClick={() => handleSetStatus(vendor._id, 'Declined')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                              vendor.verificationStatus === 'Declined'
                                ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10' 
                                : 'bg-red-50 text-red-650 border-red-100 hover:bg-red-100/50'
                            }`}
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                      {/* Assign RM column */}
                      <td className="p-4 text-center">
                        <select
                          disabled={assigningRmId === vendor._id}
                          value={vendor.assignedRM?._id || vendor.assignedRM || ''}
                          onChange={(e) => handleAssignRM(vendor._id, e.target.value)}
                          className="bg-white border border-slate-200/80 rounded-xl px-2 py-1.5 text-[10px] text-slate-700 font-bold focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all cursor-pointer shadow-sm w-24"
                        >
                          <option value="">No RM</option>
                          {rms.map(rm => (
                            <option key={rm._id} value={rm._id}>{rm.name}</option>
                          ))}
                        </select>
                      </td>
                      {/* Upload Certificate column */}
                      <td className="p-4 text-center">
                        <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all">
                          <Upload size={12} /> 
                          {uploadingVendorId === vendor._id ? 'Uploading...' : 'Upload'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,image/*" 
                            onChange={(e) => handleCertificateUpload(e, vendor._id)} 
                            disabled={uploadingVendorId === vendor._id}
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loadingMore && (
              <div className="flex justify-center items-center py-6 text-slate-400">
                <RefreshCw size={20} className="animate-spin mr-2" />
                <span className="font-semibold text-xs">Loading more vendors...</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Add New Vendor</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddVendor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                <input required type="text" value={addFormData.name} onChange={e => setAddFormData({...addFormData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                <input required type="email" value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter email" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                <input required type="tel" value={addFormData.phone} onChange={e => setAddFormData({...addFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter phone" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                <input type="text" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Leave blank to auto-generate" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Company Name</label>
                <input type="text" value={addFormData.company} onChange={e => setAddFormData({...addFormData, company: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter company name (optional)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Country</label>
                  <input type="text" value={addFormData.country} onChange={e => setAddFormData({...addFormData, country: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter country" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">State</label>
                  <input type="text" value={addFormData.state} onChange={e => setAddFormData({...addFormData, state: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter state" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">City</label>
                  <input type="text" value={addFormData.city} onChange={e => setAddFormData({...addFormData, city: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter city" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={addingVendor} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {addingVendor ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                  {addingVendor ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Vendor Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-[#0B1E43]">Manage Credit Limits</h2>
              <button 
                onClick={() => setShowCreditModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCredit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Takes Credit (Days)</label>
                <p className="text-[10px] text-slate-400 mb-2 font-medium">How many days of credit does this vendor need?</p>
                <input
                  type="number"
                  required
                  min="0"
                  value={creditFormData.takesCreditDays}
                  onChange={(e) => setCreditFormData(prev => ({ ...prev, takesCreditDays: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0B1E43] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gives Credit (Days)</label>
                <p className="text-[10px] text-slate-400 mb-2 font-medium">How many days of credit does this vendor provide?</p>
                <input
                  type="number"
                  required
                  min="0"
                  value={creditFormData.givesCreditDays}
                  onChange={(e) => setCreditFormData(prev => ({ ...prev, givesCreditDays: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-[#0B1E43] focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditingVendor}
                  className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0066FF]/20 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {creditingVendor ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E43]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
              <div>
                <h3 className="text-xl font-extrabold text-[#0B1E43] flex items-center gap-2">
                  <Activity className="text-indigo-600" size={24} /> 
                  Vendor Activity History
                </h3>
                {activityData?.vendor && (
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {activityData.vendor.name} - {activityData.vendor.company}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setActivityModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingActivity ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-500 font-bold">Loading activity data...</p>
                </div>
              ) : activityData ? (
                <div className="space-y-6">
                  {/* Last Login Card */}
                  <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <LogIn size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Last Login Date</p>
                        <p className="font-bold text-slate-700">
                          {activityData.vendor.lastActive 
                            ? new Date(activityData.vendor.lastActive).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1 text-right">Account Created</p>
                      <p className="font-bold text-slate-700">
                        {new Date(activityData.vendor.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  {/* Accepted Enquiries Table */}
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B1E43] uppercase tracking-wider mb-4 flex items-center justify-between">
                      Accepted Enquiries ({activityData.history.length})
                    </h4>
                    
                    {activityData.history.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <p className="text-slate-400 font-bold">No accepted enquiries found for this vendor.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f8fafc] text-[#0B1E43] text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <tr>
                              <th className="p-4">Action Date (Accepted)</th>
                              <th className="p-4">Creation Date</th>
                              <th className="p-4">Route</th>
                              <th className="p-4">Type</th>
                              <th className="p-4 text-center">Nature</th>
                              <th className="p-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {activityData.history.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-green-600">
                                  {new Date(item.acceptedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-4 font-bold text-slate-600 text-xs">
                                  {new Date(item.enquiryCreated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="p-4 font-bold text-slate-700">
                                  {item.fromLocation} <span className="text-slate-400 mx-1">→</span> {item.toLocation}
                                </td>
                                <td className="p-4 uppercase text-[10px] font-black tracking-widest text-slate-500">
                                  {item.type}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.isDirect ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {item.isDirect ? 'Direct' : 'Public'}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleUnacceptEnquiry(activityData.vendor._id, item.enquiryId)}
                                    className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-black uppercase text-[9px] tracking-wider rounded-lg transition-colors border border-rose-100"
                                    title="Revert Acceptance"
                                  >
                                    Revoke
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
              ) : (
                <div className="text-center text-red-500 font-bold py-8">Failed to load data.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#f8fafc] p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-[#0B1E43]">Edit Vendor Details</h3>
                <p className="text-xs text-slate-500 font-bold mt-1">Update vendor's profile information</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({...editFormData, company: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  placeholder="Company Name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  placeholder="vendor@company.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  placeholder="+91..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Country</label>
                <input
                  type="text"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all"
                  placeholder="India"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingVendor}
                  className="flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-wider bg-[#0066FF] text-white hover:bg-[#0052cc] transition-colors shadow-[0_10px_20px_rgba(0,102,255,0.2)] hover:shadow-[0_10px_20px_rgba(0,102,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingVendor ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Documents Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Verify Vendor Documents</h2>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVerifyDocumentsSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GST Number</label>
                <input required type="text" value={verifyFormData.gst} onChange={e => setVerifyFormData({...verifyFormData, gst: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter GST" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">PAN Number</label>
                <input required type="text" value={verifyFormData.pan} onChange={e => setVerifyFormData({...verifyFormData, pan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter PAN" />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowVerifyModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={verifyingVendor} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {verifyingVendor ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                  {verifyingVendor ? 'Verifying...' : 'Verify & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Branch Confirmation Modal */}
      {showDuplicateModal && duplicateVendorInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-amber-200 my-8">
            <div className="p-4 border-b border-amber-100 flex items-center gap-3 bg-amber-50 sticky top-0">
              <AlertCircle className="text-amber-500" size={24} />
              <h2 className="text-lg font-black text-amber-800">Duplicate Record Found</h2>
            </div>
            
            <div className="p-5 space-y-4">
              {!showBranchForm ? (
                  <>
                      <p className="text-sm font-medium text-slate-700">
                        The PAN you entered is already linked to another vendor account:
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                        <p><strong>Company:</strong> {duplicateVendorInfo.company || 'N/A'}</p>
                        <p><strong>Email:</strong> {duplicateVendorInfo.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {duplicateVendorInfo.phone || 'N/A'}</p>
                        <p><strong>GST:</strong> {duplicateVendorInfo.gst || 'N/A'}</p>
                        <p><strong>PAN:</strong> {duplicateVendorInfo.pan || 'N/A'}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Is this vendor another branch of the above company?
                      </p>
                      <div className="pt-2 flex flex-col gap-3">
                        <button 
                          onClick={() => setShowBranchForm(true)}
                          className="w-full px-4 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-500/20"
                        >
                          <Building size={16} /> 
                          Yes, this is another branch
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                              setShowDuplicateModal(false);
                              setShowBranchForm(false);
                          }} 
                          className="w-full px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center"
                        >
                          No, cancel verification
                        </button>
                      </div>
                  </>
              ) : (
                  <form onSubmit={(e) => handleVerifyDocumentsSubmit(e, duplicateVendorInfo._id)} className="space-y-4">
                      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                          <p className="text-xs font-bold text-blue-800 mb-1">Creating Branch for: {duplicateVendorInfo.company}</p>
                          <p className="text-[10px] font-medium text-blue-600">Please provide the branch's unique GST. PAN can be the same or edited. Address is optional.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Branch GST Number *</label>
                        <input required type="text" value={branchFormData.gst} onChange={e => setBranchFormData({...branchFormData, gst: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter branch's unique GST" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Branch PAN Number *</label>
                        <input required type="text" value={branchFormData.pan} onChange={e => setBranchFormData({...branchFormData, pan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" placeholder="Enter branch's PAN" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Branch Address (Optional)</label>
                        <textarea value={branchFormData.address} onChange={e => setBranchFormData({...branchFormData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" placeholder="Enter full branch address" />
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <button 
                          type="submit"
                          disabled={verifyingVendor}
                          className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifyingVendor ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                          Verify & Link Branch
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowBranchForm(false)} 
                          className="w-full px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-center"
                        >
                          Back
                        </button>
                      </div>
                  </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
