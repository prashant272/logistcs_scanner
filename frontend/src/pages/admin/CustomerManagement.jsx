import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import { 
  User, Users, Mail, Phone, MapPin, Building, Calendar, Search, 
  ArrowRight, FileText, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Globe, Plus, X, Loader2
} from 'lucide-react';

const CustomerManagement = () => {
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'guests'
  const [customers, setCustomers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '', email: '', password: '', phone: '', company: ''
  });
  
  // Selected user history state
  const [selectedUser, setSelectedUser] = useState(null); // { type: 'customer'|'guest', id: string, name: string, email: string }
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search or tab changes
  useEffect(() => {
    setPage(1);
    if (activeTab === 'customers') {
      setCustomers([]);
    } else {
      setGuests([]);
    }
  }, [debouncedSearchQuery, activeTab]);

  // Fetch data
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    } else {
      fetchGuests();
    }
  }, [activeTab, page, debouncedSearchQuery]);

  const fetchCustomers = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError('');
      
      const token = sessionStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/customers?page=${page}&limit=10&search=${debouncedSearchQuery}`, config);
      
      if (page === 1) {
        setCustomers(data.data || []);
      } else {
        setCustomers(prev => [...prev, ...(data.data || [])]);
      }
      setHasMore(page < data.totalPages);
      
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Error fetching admin customers:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchGuests = async () => {
    try {
      if (page === 1) setLoading(true);
      setError('');
      const token = sessionStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/guests`, config);
      setGuests(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin guests:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    if (activeTab === 'customers') {
      setCustomers([]);
      fetchCustomers();
    } else {
      setGuests([]);
      fetchGuests();
    }
  };

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const lastCustomerElementRef = useInfiniteScroll(handleLoadMore, hasMore, loadingMore || loading);

  const fetchHistory = async (user) => {
    setSelectedUser(user);
    setLoadingHistory(true);
    setHistoryError('');
    setHistory([]);

    try {
      const token = sessionStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      let url = '';
      if (user.type === 'customer') {
        url = `${import.meta.env.VITE_API_BASE_URL}/admin/customer-history/${user.id}`;
      } else {
        url = `${import.meta.env.VITE_API_BASE_URL}/admin/guest-history?email=${encodeURIComponent(user.email)}`;
      }

      const { data } = await axios.get(url, config);
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching user history:', err);
      setHistoryError(err.response?.data?.message || 'Failed to load enquiry history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setAddingCustomer(true);
      const token = sessionStorage.getItem('adminToken');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        ...addFormData,
        role: 'customer'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Customer created successfully!');
      setShowAddModal(false);
      setAddFormData({ name: '', email: '', password: '', phone: '', company: '' });
      handleRefresh();
    } catch (err) {
      console.error('Failed to create customer', err);
      alert(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  const filteredCustomers = customers;

  const filteredGuests = guests.filter(g => 
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone?.includes(searchQuery)
  );

  // If viewing details / history of a user
  if (selectedUser) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-[#0066FF] font-black hover:underline mb-2 cursor-pointer transition-all uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} /> Back to Listings
        </button>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.025)] space-y-6">
          {/* User Meta info card */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[9px] bg-[#0066FF]/8 text-[#0066FF] border border-[#0066FF]/10 px-3 py-1 rounded-full uppercase font-black tracking-widest">
                {selectedUser.type} Profile
              </span>
              <h2 className="text-2xl font-black text-[#0B1E43] mt-2.5">{selectedUser.name || 'N/A'}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{selectedUser.email}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs w-full md:w-auto">
              {selectedUser.phone && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/70">
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider mb-1">Phone</span>
                  <span className="text-slate-700 font-extrabold">{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.company && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/70">
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider mb-1">Company</span>
                  <span className="text-slate-700 font-extrabold">{selectedUser.company}</span>
                </div>
              )}
              {selectedUser.country && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/70">
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider mb-1">Country</span>
                  <span className="text-slate-700 font-extrabold">{selectedUser.country}</span>
                </div>
              )}
              {selectedUser.createdAt && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/70">
                  <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider mb-1">Joined</span>
                  <span className="text-slate-700 font-extrabold">
                    {new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* History Records Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={14} className="text-[#0066FF]" /> Enquiries & Bookings History
            </h3>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0066FF] rounded-full animate-spin"></div>
              </div>
            ) : historyError ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="bg-slate-50/50 rounded-2xl p-12 text-center border border-slate-100">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No history found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-600">
                    <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="p-4">Type</th>
                        <th className="p-4">Route</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4">Price Quoted</th>
                        <th className="p-4">Target Vendor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold">
                      {history.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              record.isBooking 
                                ? 'bg-green-50 text-green-600 border border-green-100' 
                                : 'bg-[#0066FF]/8 text-[#0066FF] border border-[#0066FF]/10'
                            }`}>
                              {record.isBooking ? 'Booking' : 'Enquiry'}
                            </span>
                          </td>
                          <td className="p-4 text-[#0B1E43] font-black">
                            <div className="flex items-center gap-1.5">
                              <span>{record.fromLocation}</span>
                              <ArrowRight size={12} className="text-slate-400" />
                              <span>{record.toLocation}</span>
                            </div>
                          </td>
                          <td className="p-4 uppercase tracking-wider text-slate-500 font-black">
                            {record.type}
                          </td>
                          <td className="p-4 font-black text-[#0B1E43]">
                            {record.isBooking ? (
                                record.price ? `₹ ${record.price.toLocaleString('en-IN')}` : 'Not Quoted'
                            ) : (
                                record.responses && record.responses.length > 0 ? (
                                    <span className="text-slate-400 text-[10px] uppercase">Multiple Quotes</span>
                                ) : 'Not Quoted'
                            )}
                          </td>
                          <td className="p-4 text-slate-700">
                            {record.isBooking ? (
                                record.vendor ? (
                                  <div>
                                    <p className="font-extrabold text-slate-800">{record.vendor.name}</p>
                                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{record.vendor.company}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Broadcasted</span>
                                )
                            ) : (
                                record.responses && record.responses.length > 0 ? (
                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                       {record.responses.map(resp => (
                                           <div key={resp._id} className="flex flex-col border-b border-slate-50 last:border-0 pb-1.5 last:pb-0">
                                               <p className="font-extrabold text-slate-800 flex justify-between items-center gap-2">
                                                   <span className="truncate">{resp.vendor?.name || 'Unknown'}</span>
                                                   <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-black whitespace-nowrap ${resp.status === 'Accepted' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'}`}>{resp.status}</span>
                                               </p>
                                               <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                                                   {resp.vendor?.company || 'N/A'} {resp.price && `• ₹${resp.price.toLocaleString('en-IN')}`}
                                               </span>
                                           </div>
                                       ))}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic text-[10px] uppercase font-bold tracking-wider">No responses</span>
                                )
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 font-black uppercase text-[10px] tracking-wider ${
                              record.status === 'Accepted' ? 'text-green-600' :
                              record.status === 'Declined' ? 'text-red-500' :
                              record.status === 'Responded' ? 'text-[#0066FF]' :
                              'text-amber-500'
                            }`}>
                              {record.status === 'Accepted' && <CheckCircle2 size={12} />}
                              {record.status === 'Declined' && <XCircle size={12} />}
                              {record.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-450 font-medium">
                            {new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loadingMore && (
                    <div className="flex justify-center items-center py-6 text-slate-400">
                      <RefreshCw size={20} className="animate-spin mr-2" />
                      <span className="font-semibold text-xs">Loading more customers...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">Manage Customers & Guests</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">View and manage registered clients and guest enquiry data</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers or guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <button 
            onClick={handleRefresh} 
            className="p-2.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-650 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-[#0066FF]" : ""} />
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl transition-all shadow-sm font-bold flex items-center gap-2 text-xs"
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Accordion Tabs toggling */}
      <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/40 w-fit shadow-inner">
        <button
          onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'customers'
              ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/15'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={14} /> Customers ({customers.length})
        </button>
        <button
          onClick={() => { setActiveTab('guests'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeTab === 'guests'
              ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/15'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={14} /> Guests ({guests.length})
        </button>
      </div>

      {/* Main layout card */}
      {loading && page === 1 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0066FF] rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 text-red-650 p-4 rounded-2xl text-xs font-bold">
          {error}
        </div>
      ) : activeTab === 'customers' ? (
        // Customers table (Light/White theme)
        filteredCustomers.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-black text-[#0B1E43] uppercase tracking-wider mb-1">No customers found</h3>
            <p className="text-slate-400 text-xs">
              {searchQuery ? "No registered customers match your search filters." : "No registered customers present."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_12px_40px_rgba(11,30,67,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-600">
                <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">Customer Name</th>
                    <th className="p-5">Email Address</th>
                    <th className="p-5">Mobile Number</th>
                    <th className="p-5">Country</th>
                    <th className="p-5">Organization Name</th>
                    <th className="p-5">Signup Date</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {filteredCustomers.map((c, index) => (
                    <tr 
                      key={c._id} 
                      ref={index === filteredCustomers.length - 1 ? lastCustomerElementRef : null}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => fetchHistory({ ...c, type: 'customer', id: c._id })}
                    >
                      <td className="p-5 font-black text-[#0B1E43] group-hover:text-[#0066FF] transition-colors">{c.name || 'N/A'}</td>
                      <td className="p-5 text-slate-500 font-medium">{c.email}</td>
                      <td className="p-5 text-slate-700">{c.phone || 'N/A'}</td>
                      <td className="p-5">
                        <div className="flex items-center gap-1">
                          <Globe size={13} className="text-slate-400" />
                          <span>{c.country || 'India'}</span>
                        </div>
                      </td>
                      <td className="p-5 text-[#0B1E43] font-black">
                        <div className="flex items-center gap-2">
                          <Building size={15} className="text-slate-400" />
                          <span>{c.company || 'Not Specified'}</span>
                        </div>
                      </td>
                      <td className="p-5 text-slate-450 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button className="text-[#0066FF] font-black text-[10px] uppercase tracking-wider group-hover:underline inline-flex items-center gap-1 cursor-pointer">
                          View History <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // Guests table (Light/White theme)
        filteredGuests.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-sm font-black text-[#0B1E43] uppercase tracking-wider mb-1">No guest contacts found</h3>
            <p className="text-slate-400 text-xs">
              {searchQuery ? "No guest records match your search filters." : "No guest enquiry details available."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_12px_40px_rgba(11,30,67,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-slate-600">
                <thead className="bg-[#f8fafc] text-[#0B1E43] uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">Guest Name</th>
                    <th className="p-5">Email Address</th>
                    <th className="p-5">Mobile Number</th>
                    <th className="p-5">Organization Name</th>
                    <th className="p-5">Last Activity</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {filteredGuests.map((g) => (
                    <tr 
                      key={g.email} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => fetchHistory({ ...g, type: 'guest' })}
                    >
                      <td className="p-5 font-black text-[#0B1E43] group-hover:text-[#0066FF] transition-colors">{g.name || 'N/A'}</td>
                      <td className="p-5 text-slate-500 font-medium">{g.email}</td>
                      <td className="p-5 text-slate-700">{g.phone || 'N/A'}</td>
                      <td className="p-5 text-[#0B1E43] font-black">
                        <div className="flex items-center gap-2">
                          <Building size={15} className="text-slate-400" />
                          <span>{g.company || 'Not Specified'}</span>
                        </div>
                      </td>
                      <td className="p-5 text-slate-450 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button className="text-[#0066FF] font-black text-[10px] uppercase tracking-wider group-hover:underline inline-flex items-center gap-1 cursor-pointer">
                          View History <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
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
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={addingCustomer} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {addingCustomer ? <Loader2 size={16} className="animate-spin" /> : <User size={16} />} 
                  {addingCustomer ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;
