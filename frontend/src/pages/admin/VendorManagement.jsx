import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { 
  ShieldCheck, Truck, Mail, Phone, MapPin, Building, Calendar, 
  Search, ExternalLink, LogIn, CheckCircle2, AlertCircle, Upload, RefreshCw
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
  const [assigningRmId, setAssigningRmId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchRMs();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search or status changes
  useEffect(() => {
    setPage(1);
    setVendors([]);
  }, [debouncedSearchQuery, statusFilter]);

  // Fetch vendors whenever page, search, or status changes
  useEffect(() => {
    fetchVendors();
  }, [page, debouncedSearchQuery, statusFilter]);

  const fetchRMs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/rm`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRms(data || []);
    } catch (err) {
      console.error('Error fetching RMs:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors?page=${page}&limit=10&search=${debouncedSearchQuery}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (page === 1) {
        setVendors(data.data || []);
      } else {
        setVendors(prev => [...prev, ...(data.data || [])]);
      }
      setHasMore(page < data.totalPages);
      
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setVendors([]);
    fetchVendors();
  };

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const lastVendorElementRef = useInfiniteScroll(handleLoadMore, hasMore, loadingMore || loading);

  // Impersonate / Login as Vendor
  const handleLoginAsVendor = async (vendorId) => {
    try {
      const token = localStorage.getItem('adminToken');
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
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${vendorId}/verify`, { status }, config);
      
      // Update local state
      setVendors(prev => prev.map(v => v._id === vendorId ? { 
        ...v, 
        isVerified: data.isVerified, 
        verificationStatus: data.verificationStatus 
      } : v));
    } catch (err) {
      console.error('Update status failed:', err);
      alert('Failed to update status');
    }
  };

  const handleAssignRM = async (vendorId, rmId) => {
    try {
      setAssigningRmId(vendorId);
      const token = localStorage.getItem('adminToken');
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
      const token = localStorage.getItem('adminToken');
      
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
            <RefreshCw size={14} />
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
                  <th className="p-4">First Name</th>
                  <th className="p-4">Last Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Created</th>
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
                          <LogIn size={12} /> Login
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
                      <td className="p-4 font-mono text-[10px] text-slate-500">{vendor._id.slice(-8).toUpperCase()}</td>
                      <td className="p-4 text-slate-450 font-medium">
                        {/* Simulate Last Login or format date */}
                        {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
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
    </div>
  );
};

export default VendorManagement;
