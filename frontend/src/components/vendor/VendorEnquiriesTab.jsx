import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Check, X, Phone, Mail, User, Info, Search, MapPin,
  Building2, Ship, Plane, Truck, Warehouse, Package,
  Clock, Calendar, Coins, CheckCircle2, Eye, ToggleLeft, ToggleRight, Lock, Paperclip, AlertTriangle
} from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';

const cleanCompanyName = (rawName) => {
  if (!rawName) return 'Customer';
  let name = String(rawName).replace(/\bundefined\b/gi, '').replace(/\bnull\b/gi, '').replace(/\s+/g, ' ').trim();
  return name || 'Customer';
};

const maskCompanyName = (name) => {
  const cleaned = cleanCompanyName(name);
  return cleaned.split(' ').map(word => {
    if (word.length <= 2) return word[0] + 'X';
    let chars = word.split('');
    for (let i = 1; i < chars.length; i++) {
      if (i === chars.length - 1) {
        if (word.length > 3) continue;
      }
      if (word.length > 5 && (i === 3 || i === 4 || i === 5)) {
        continue;
      }
      chars[i] = 'X';
    }
    return chars.join('').toUpperCase();
  }).join(' ');
};

const VendorEnquiriesTab = ({ title, type }) => {
  const {
    enquiries,
    loading,
    error,
    limitReached,
    fetchVendorEnquiries,
    updateEnquiryStatus
  } = useEnquiries();
  const navigate = useNavigate();
  const location = useLocation();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', '7days', '15days', 'thismonth', or 'YYYY-MM'

  // Status filter from URL or default to 'all'
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const filter = new URLSearchParams(location.search).get('filter');
    if (filter) {
      setStatusFilter(filter);
    }
  }, [location]);

  // State for Quote modal/prompt
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [quoteDetails, setQuoteDetails] = useState({
    freightCharges: '',
    freightCurrency: 'INR',
    otherCharges: '',
    otherCurrency: 'INR',
    allInCharges: '',
    allInCurrency: 'INR'
  });

  const [limitError, setLimitError] = useState('');

  // State for View details modal
  const [viewingEnquiry, setViewingEnquiry] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [type, selectedFilter, statusFilter]);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      if (page === 1 && loading) return; // Prevent double fetch on mount if already loading
      setLoadingMore(page > 1);
      try {
        const res = await fetchVendorEnquiries(type, page, 10, searchQuery, selectedFilter, statusFilter);
        if (isMounted) {
          if (res && res.totalPages) {
            setHasMore(page < res.totalPages);
          } else {
            setHasMore(false);
          }
        }
      } finally {
        if (isMounted) setLoadingMore(false);
      }
    };
    fetch();

    return () => { isMounted = false; };
  }, [type, page, searchQuery, selectedFilter, statusFilter]);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const lastEnquiryElementRef = useInfiniteScroll(handleLoadMore, hasMore, loadingMore || loading);

  const handleAction = async (id, newStatus, priceVal = null, qDetails = null) => {
    console.log('[handleAction] id:', id, 'newStatus:', newStatus, 'type:', type, 'priceVal:', priceVal, 'qDetails:', qDetails);
    try {
      const res = await updateEnquiryStatus(id, newStatus, type, priceVal, qDetails);
      console.log('[handleAction] success response:', res);
    } catch (err) {
      console.error('Error updating status:', err);
      const message = err.response?.data?.message || 'Error updating status';
      if (err.response?.status === 403 && message.includes('Monthly limit reached')) {
        setLimitError(message);
      } else {
        alert(message);
      }
    }
  };

  const handleQuoteSubmit = async (e, id) => {
    e.preventDefault();
    const hasAnyPrice = quoteDetails.freightCharges || quoteDetails.otherCharges || quoteDetails.allInCharges;
    if (!hasAnyPrice) {
      alert('Please enter at least one price amount');
      return;
    }
    const finalPrice = Number(quoteDetails.allInCharges || quoteDetails.freightCharges || quoteDetails.otherCharges || 0);
    await handleAction(id, 'Accepted', finalPrice, quoteDetails);
    setActiveQuoteId(null);
    setQuoteDetails({
      freightCharges: '', freightCurrency: 'INR',
      otherCharges: '', otherCurrency: 'INR',
      allInCharges: '', allInCurrency: 'INR'
    });
  };

  // Generate dynamic date filters (current month + past 5 months)
  const getDateFilters = () => {
    const filters = [
      { id: 'all', label: 'All Enquiries' },
      { id: '7days', label: 'Past 7 Days' },
      { id: '15days', label: 'Past 15 Days' },
      { id: 'thismonth', label: 'This Month' }
    ];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const year = d.getFullYear();
      const month = d.getMonth();

      // Format to YYYY-MM
      const monthStr = String(month + 1).padStart(2, '0');
      const filterId = `${year}-${monthStr}`;
      const label = `${monthNames[month]} ${year}`;

      // Avoid duplicate "This Month" filter if it is the current month
      const isCurrentMonth = i === 0;
      if (!isCurrentMonth) {
        filters.push({ id: filterId, label });
      }

      d.setMonth(d.getMonth() - 1);
    }

    return filters;
  };

  const dateFilters = getDateFilters();

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper to get estimated delivery date based on speed (in days)
  const getTargetDate = (createdAtStr, speedStr) => {
    if (!createdAtStr) return 'N/A';
    const date = new Date(createdAtStr);
    const days = parseInt(speedStr) || 5; // Default to 5 days if not specified
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

  // Icon selector based on freight/enquiry type
  const getEnquiryIcon = (enqType) => {
    switch (enqType) {
      case 'sea':
        return <Ship className="w-5 h-5 text-sky-600" />;
      case 'air':
        return <Plane className="w-5 h-5 text-indigo-600" />;
      case 'land':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'warehouse':
        return <Warehouse className="w-5 h-5 text-amber-600" />;
      default:
        return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  // Filtering Logic (Backend handles date, search, and status)
  const filteredEnquiries = enquiries;

  return (
    <div className="space-y-6">
      {limitReached && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Free Limit Reached</h4>
            <p className="text-xs font-semibold text-white/90 mt-1">
              You have reached your limit of accepting enquiries. Please purchase a premium subscription plan matching your country to unlock more direct booking requests and matched leads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.href = '/vendor/upgrade'}
            className="bg-white hover:bg-slate-100 text-orange-600 font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shrink-0 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Title & Header Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0B1E43] tracking-tight">{title}</h1>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
              Manage your {type} enquiries & quotes
            </p>
          </div>
          <div>
            <h2 className="text-base font-black text-[#0B1E43] tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wide mt-0.5 uppercase">
              {type === 'my'
                ? 'Enquiries matched with your pricing'
                : 'Direct enquiries broadcasted by customers for custom bidding'}
            </p>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="space-y-4">
          {/* Search bookings/enquiries */}
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f4f7fc] border border-slate-200/80 rounded-2xl py-3 pl-5 pr-12 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>

          {/* Date Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${selectedFilter === filter.id
                  ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-[#0066FF]/15'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 mt-3 pt-3">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'not_accepted', label: 'Not Accepted' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all duration-200 cursor-pointer border ${statusFilter === f.id
                  ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cargo Enquiry Cards List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold text-xs uppercase tracking-wider bg-white rounded-3xl border border-slate-100">
          Loading Enquiries...
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted</h3>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">
            {error}
          </p>
          {error.toLowerCase().includes('upgrade') && (
            <button
              onClick={() => window.location.href = '/vendor/upgrade'}
              className="bg-[#0066FF] hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer uppercase text-xs tracking-wider"
            >
              View Plans
            </button>
          )}
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-semibold text-xs bg-white rounded-3xl border border-slate-100">
          No matching enquiries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEnquiries.map((enq, index) => {
            if (enq.isLocked) {
              return (
                <div ref={index === filteredEnquiries.length - 1 ? lastEnquiryElementRef : null} key={enq._id} className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-base font-black text-[#0B1E43]">New Enquiry Received</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm">Update your plan to see this enquiry and unlock all direct booking requests.</p>
                    <button onClick={() => window.location.href = '/vendor/upgrade'} className="mt-4 bg-[#0066FF] hover:bg-[#0052cc] text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-wider transition-all">
                      Upgrade Plan
                    </button>
                  </div>
                  {/* Dummy blurred content behind */}
                  <div className="w-full flex items-center justify-between opacity-30 pointer-events-none">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-slate-200 rounded"></div>
                        <div className="w-24 h-3 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const isAccepted = type === 'direct' ? (enq.myResponse && enq.myResponse.status === 'Accepted') : (enq.status === 'Accepted');
            const quoteData = type === 'direct' ? (enq.myResponse?.quoteDetails) : enq.quoteDetails;
            const quotePrice = type === 'direct' ? (enq.myResponse?.price) : enq.price;
            const hasQuote = type === 'direct' ? !!(quotePrice || quoteData?.allInCharges) : (enq.price !== undefined && enq.price !== null);

            return (
              <div
                ref={index === filteredEnquiries.length - 1 ? lastEnquiryElementRef : null}
                key={enq._id}
                className="bg-gradient-to-br from-white to-[#f4f8ff]/35 rounded-2xl p-5 md:p-6 border border-sky-100/75 hover:border-sky-300 hover:shadow-lg transition-all duration-300 relative shadow-[0_8px_30px_rgba(11,30,67,0.02)] space-y-4"
              >
                {/* Date of Enquiry (Original Style but fixed layout) */}
                <div className="flex justify-end w-full mb-2.5 -mt-4">
                  <div className="text-[10px] text-slate-700 font-extrabold pb-1 md:pb-0 border-b border-slate-100 md:border-none">
                    Date of Enquiry : <span className="text-slate-900 font-black">{formatDate(enq.createdAt)}</span>
                  </div>
                </div>

                {/* Card Top Row: Icon, Ports, and Load Details */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {/* Circle Icon Badge */}
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                      {getEnquiryIcon(enq.type)}
                    </div>

                    {/* Ports / Locations Route */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-750">
                      <div className="flex items-center gap-2 bg-[#f4f7fc] px-3 py-2 rounded-xl border border-slate-150 shadow-sm">
                        <MapPin size={12} className="text-[#0066FF]" />
                        <span>{enq.fromLocation}</span>
                      </div>

                      {enq.type === 'cha' ? (
                        <>
                          <span className="text-slate-300 font-black">-</span>
                          <div className="flex items-center gap-2 bg-[#f4f7fc] px-3 py-2 rounded-xl border border-slate-150 shadow-sm text-slate-700">
                            <span className="text-[#0066FF]">{enq.chaServiceType || 'CHA'}</span>
                            <span>{enq.chaCargoType || 'Customs Clearance'}</span>
                          </div>
                        </>
                      ) : enq.type !== 'warehouse' && (
                        <>
                          <span className="text-slate-300 font-black">→</span>
                          <div className="flex items-center gap-2 bg-[#f4f7fc] px-3 py-2 rounded-xl border border-slate-150 shadow-sm">
                            <MapPin size={12} className="text-[#0066FF]" />
                            <span>{enq.toLocation}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Top-Right Badges: Mode, Container, Load Type, Date of Shipment */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Mode / Type Badge */}
                    <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg px-3 py-1.5 text-center min-w-[60px] shadow-sm">
                      <div className="text-[9px] text-[#0066FF] font-black uppercase tracking-wider">{enq.type === 'cha' ? 'Type' : 'Mode'}</div>
                      <div className="text-[10px] font-black text-[#0052cc] mt-0.5" title={enq.type === 'cha' ? (enq.chaCargoType || 'CHA') : ''}>
                        {enq.type === 'cha' 
                          ? (enq.chaCargoType ? (enq.chaCargoType.toLowerCase().includes('import') ? 'IMPORT' : enq.chaCargoType.toLowerCase().includes('export') ? 'EXPORT' : 'CUSTOMS') : 'CHA')
                          : (enq.type ? enq.type.toUpperCase() : 'N/A')}
                      </div>
                    </div>

                    {/* Container Type for Sea FCL */}
                    {(enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'FCL' || enq.truckLoad?.toUpperCase() === 'FCL') && enq.fclStandard) && (
                      <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 text-center min-w-[70px] shadow-sm">
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider">Container Type</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.fclStandard}</div>
                      </div>
                    )}

                    {/* Vehicle Type for Land */}
                    {(enq.type === 'land' && enq.vehicleType) && (
                      <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 text-center min-w-[70px] shadow-sm">
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider">Vehicle Type</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.vehicleType}</div>
                      </div>
                    )}

                    {/* Load Type */}
                    {(enq.type === 'sea' && enq.seaLoadType) && (
                      <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 text-center min-w-[70px] shadow-sm">
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider">Load Type</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.seaLoadType}</div>
                      </div>
                    )}
                    {(enq.type === 'land' && enq.truckLoad) && (
                      <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 text-center min-w-[70px] shadow-sm">
                        <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider">Load Type</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.truckLoad}</div>
                      </div>
                    )}
                    {/* Date of Shipment / Target Delivery */}
                    <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1.5 text-center min-w-[100px] shadow-sm">
                      <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider font-mono">Date of Shipment</div>
                      <div className="text-[10px] font-black text-slate-800 mt-0.5">{getTargetDate(enq.createdAt, enq.deliverySpeed)}</div>
                    </div>
                  </div>
                </div>

                {/* Card Middle Row: Shipper Details and Matched Info */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-1">

                  {/* Left Sub-Section: Company & Details Box */}
                  <div className="space-y-2 w-full lg:max-w-md">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-[#0B1E43] tracking-tight uppercase">
                        {isAccepted
                          ? cleanCompanyName(enq.guestCompany || enq.guestName || enq.client?.company || enq.client?.name)
                          : maskCompanyName(enq.guestCompany || enq.guestName || enq.client?.company || enq.client?.name)
                        }
                      </h4>
                      {enq.clientCreditRequired && (
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider">
                          Credit Required
                        </span>
                      )}
                      {enq.client?.role === 'vendor' ? (
                        enq.client?.activePlan && typeof enq.client.activePlan === 'object' && enq.client.activePlan.price > 0 && enq.client?.planEndDate && new Date(enq.client.planEndDate) > new Date() ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                            Verified Vendor
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                            Vendor
                          </span>
                        )
                      ) : (
                        enq.client?.activePlan && typeof enq.client.activePlan === 'object' && enq.client.activePlan.price > 0 && enq.client?.planEndDate && new Date(enq.client.planEndDate) > new Date() ? (
                          <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                            Verified Customer
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                            Customer
                          </span>
                        )
                      )}
                    </div>

                    {/* Red/Green Details Box */}
                    {!isAccepted ? (
                      <div className="border border-dashed border-red-200 bg-red-50/10 rounded-xl p-3 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                        <span className="bg-red-150 text-red-755 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md absolute -top-2.5 left-3 border border-red-200">
                          Hidden Before Accept
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-red-100/80 text-center pt-1">
                          <div className="px-1 py-2 sm:py-0 space-y-0.5">
                            <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Mobile No.</span>
                            <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm mx-auto">
                              <Lock size={10} className="text-slate-400" />
                            </div>
                          </div>

                          <div className="px-1 py-2 sm:py-0 space-y-0.5">
                            <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Email ID</span>
                            <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm mx-auto">
                              <Lock size={10} className="text-slate-400" />
                            </div>
                          </div>

                          <div className="px-1 py-2 sm:py-0 space-y-0.5">
                            <span className="text-[8px] font-black text-slate-450 uppercase tracking-wider block">Commodity</span>
                            <div className="w-10 h-6 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm mx-auto">
                              <Lock size={10} className="text-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-emerald-250 bg-emerald-50/10 rounded-xl p-3 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)]">
                        <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md absolute -top-2.5 left-3 border border-emerald-200">
                          Visible After Accept
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-emerald-100 text-center pt-1 mt-1">
                          <div className="px-2 py-2 sm:py-0 space-y-0.5 min-w-0">
                            <span className="text-[8px] font-black text-slate-455 uppercase tracking-wider block">Mobile No.</span>
                            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-800">
                              <Phone size={10} className="text-[#0066FF] shrink-0" />
                              <span className="truncate">{enq.guestPhone || enq.client?.phone || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="px-2 py-2 sm:py-0 space-y-0.5 min-w-0">
                            <span className="text-[8px] font-black text-slate-455 uppercase tracking-wider block">Email ID</span>
                            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-800">
                              <Mail size={10} className="text-[#0066FF] shrink-0" />
                              <span className="break-all" title={enq.guestEmail || enq.client?.email}>{enq.guestEmail || enq.client?.email || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="px-2 py-2 sm:py-0 space-y-0.5 min-w-0">
                            <span className="text-[8px] font-black text-slate-455 uppercase tracking-wider block">Commodity</span>
                            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-800">
                              <Package size={10} className="text-[#0066FF] shrink-0" />
                              <span className="truncate" title={enq.commodity}>{enq.commodity || 'General Cargo'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Sub-Section: Message Attachment, Volume, Target Price */}
                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    {/* Message Attached Option */}
                    {enq.message ? (
                      <div className="flex items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 text-[9px] font-black text-slate-800 uppercase bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/65 shadow-sm">
                          <span>Message Attached</span>
                        </div>
                        {!isAccepted ? (
                          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <Lock size={11} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-sm">
                              <Paperclip size={11} />
                            </div>
                            <button
                              onClick={() => setViewingEnquiry(enq)}
                              className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 border border-blue-100 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="View Message Details"
                            >
                              <Eye size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Document Attached Option */}
                    {enq.attachment ? (
                      <div className="flex items-center gap-1.5">
                        <div className="inline-flex items-center gap-1 text-[9px] font-black text-slate-800 uppercase bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/65 shadow-sm">
                          <span>Doc Attached</span>
                        </div>
                        {!isAccepted ? (
                          <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <Lock size={11} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <a
                              href={enq.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border border-emerald-100 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="Download/View Document"
                            >
                              <Paperclip size={11} />
                            </a>
                            <button
                              onClick={() => setViewingEnquiry(enq)}
                              className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-600 border border-blue-100 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="View Details"
                            >
                              <Eye size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Weight Badge */}
                    {enq.weightRange && (
                      <div className="bg-white border border-slate-200/90 rounded-xl py-1.5 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[75px]">
                        <div className="text-[9px] text-slate-600 font-black tracking-wider uppercase">Weight</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.weightRange}</div>
                      </div>
                    )}

                    {/* Volume Badge */}
                    {enq.cbmRange && (
                      <div className="bg-white border border-slate-200/90 rounded-xl py-1.5 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[75px]">
                        <div className="text-[9px] text-slate-600 font-black tracking-wider uppercase">Volume</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{enq.cbmRange}</div>
                      </div>
                    )}

                    {/* Units/Qty Badge */}
                    {(enq.fclUnit || enq.quantity || enq.weightRange || enq.truckLoad) && (
                      <div className="bg-white border border-slate-200/90 rounded-xl py-1.5 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[85px]">
                        <div className="text-[9px] text-slate-600 font-black tracking-wider uppercase">Units / Qty</div>
                        <div className="text-[10px] font-black text-slate-850 mt-0.5">
                          {isAccepted ? (
                            enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'FCL' || enq.truckLoad?.toUpperCase() === 'FCL') ? (enq.fclUnit ? `${enq.fclUnit} ${enq.fclStandard ? `x ${enq.fclStandard}` : 'Container'}` : 'N/A') :
                              enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'LCL' || enq.truckLoad?.toUpperCase() === 'LCL') ? (enq.quantity ? `${enq.quantity} Boxes` : 'N/A') :
                                enq.type === 'air' ? (enq.weightRange ? `${enq.weightRange}` : 'N/A') :
                                  enq.type === 'land' ? (enq.truckLoad ? `${enq.truckLoad}` : 'N/A') :
                                    (enq.fclUnit || enq.quantity || enq.weightRange || 'N/A')
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-slate-400">
                              <Lock size={10} />
                              <span className="tracking-widest">XXX</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* My Price Badge (Only visible when quoted) */}
                    {((isAccepted && hasQuote) || enq.vendorOwnPrice || enq.price) && (
                      <div className="bg-white border border-slate-200/90 rounded-xl py-1.5 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[85px]">
                        <div className="text-[9px] text-slate-600 font-black tracking-wider uppercase">My Price</div>
                        <div className="text-[10px] font-black text-slate-850 mt-0.5">
                          $ {isAccepted && hasQuote ? Number(quotePrice || quoteData?.allInCharges).toLocaleString() : (enq.vendorOwnPrice || enq.price).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Target Price Badge */}
                    <div className="bg-white border border-slate-200/90 rounded-xl py-1.5 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[85px]">
                      <div className="text-[9px] text-slate-600 font-black tracking-wider uppercase">Target Price</div>
                      <div className="text-[10px] font-black text-slate-850 mt-0.5 flex justify-center items-center h-4">
                        {!isAccepted ? (
                          <div className="flex items-center gap-1 text-slate-400" title="Visible after accept">
                            <Lock size={9} />
                            <span className="text-[8px] uppercase">Hidden</span>
                          </div>
                        ) : (
                          enq.targetPrice ? `$ ${enq.targetPrice.toLocaleString()}` : 'N/A'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Row: Route & Actions Bottom Bar */}
                <div className="pt-3 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side: Quoted Total if any */}
                  <div>
                    {hasQuote && quoteData ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/70 shadow-sm">
                        <Coins size={12} />
                        <span>
                          Quoted Total: {quoteData.allInCurrency || '₹'} {quotePrice?.toLocaleString() || quoteData.allInCharges}
                        </span>
                      </div>
                    ) : <div />}
                  </div>

                  {/* Actions / Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Accepted Badge */}
                    {isAccepted ? (
                      <div className="flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl shadow-md shadow-emerald-500/10">
                        <CheckCircle2 size={12} />
                        <span>Accepted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAction(enq._id, 'Accepted')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer uppercase tracking-wider"
                      >
                        Accept
                      </button>
                    )}

                    {/* Quote trigger button */}
                    {isAccepted && (
                      <button
                        onClick={() => setActiveQuoteId(activeQuoteId === enq._id ? null : enq._id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] px-5 py-2 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer uppercase tracking-wider"
                      >
                        {hasQuote ? 'Update Quote' : 'Quote'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detailed Quote Form Modal */}
                {activeQuoteId === enq._id && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-150 overflow-hidden flex flex-col animate-scaleUp">
                      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-base font-black text-[#0B1E43] tracking-tight">Submit Freight Quote</h3>
                        <button onClick={() => setActiveQuoteId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
                      </div>
                      <form onSubmit={(e) => handleQuoteSubmit(e, enq._id)} className="p-6 space-y-4">

                        {/* Freight Charges */}
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Freight Charges</label>
                            <input type="number" placeholder="0" value={quoteDetails.freightCharges} onChange={e => setQuoteDetails({ ...quoteDetails, freightCharges: e.target.value })} className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#0066FF]" />
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Currency</label>
                            <select value={quoteDetails.freightCurrency} onChange={e => setQuoteDetails({ ...quoteDetails, freightCurrency: e.target.value })} className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#0066FF] cursor-pointer">
                              <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AED">AED</option>
                            </select>
                          </div>
                        </div>

                        {/* Other Charges */}
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Other Charges (If Any)</label>
                            <input type="number" placeholder="0" value={quoteDetails.otherCharges} onChange={e => setQuoteDetails({ ...quoteDetails, otherCharges: e.target.value })} className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#0066FF]" />
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Currency</label>
                            <select value={quoteDetails.otherCurrency} onChange={e => setQuoteDetails({ ...quoteDetails, otherCurrency: e.target.value })} className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#0066FF] cursor-pointer">
                              <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AED">AED</option>
                            </select>
                          </div>
                        </div>

                        {/* All In Charges */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <div className="flex-1 space-y-1">
                            <label className="block text-[10px] font-black text-slate-800 uppercase">All In Charges (Total)</label>
                            <input type="number" placeholder="Total Amount" value={quoteDetails.allInCharges} onChange={e => setQuoteDetails({ ...quoteDetails, allInCharges: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0066FF] shadow-sm" />
                          </div>
                          <div className="w-24 space-y-1">
                            <label className="block text-[10px] font-black text-slate-800 uppercase">Currency</label>
                            <select value={quoteDetails.allInCurrency} onChange={e => setQuoteDetails({ ...quoteDetails, allInCurrency: e.target.value })} className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0066FF] shadow-sm cursor-pointer">
                              <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="AED">AED</option>
                            </select>
                          </div>
                        </div>

                        <button type="submit" className="w-full mt-4 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold py-3 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer">
                          Submit Quote
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Fallback Button */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-black text-sm px-8 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading More...' : 'Load More (Manual)'}
          </button>
        </div>
      )}

      {/* Loading Spinner for Intersection Observer */}
      {loadingMore && !hasMore && (
        <div className="flex justify-center py-6 text-slate-400 items-center">
          <Clock className="w-5 h-5 animate-spin mr-2" />
          <span className="font-semibold text-xs">Loading more enquiries...</span>
        </div>
      )}
      {/* View Modal */}
      {viewingEnquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-150 overflow-hidden flex flex-col animate-scaleUp">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-[#0B1E43] tracking-tight">Enquiry Details</h3>
              </div>
              <button
                onClick={() => setViewingEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">Exact Date & Time</span>
                <p className="text-sm font-bold text-[#0066FF]">
                  {new Date(viewingEnquiry.createdAt).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </p>
              </div>
              {viewingEnquiry.commodity && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">Commodity Description</span>
                  <p className="text-sm font-bold text-slate-800 bg-[#f4f7fc] p-3 rounded-xl border border-slate-100">{viewingEnquiry.commodity}</p>
                </div>
              )}
              {viewingEnquiry.price && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">My Price (Original Rate)</span>
                  <p className="text-sm font-bold text-slate-800 bg-[#f4f7fc] p-3 rounded-xl border border-slate-100">$ {viewingEnquiry.price.toLocaleString()}</p>
                </div>
              )}
              {viewingEnquiry.targetPrice && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">Target Price</span>
                  <p className="text-sm font-bold text-[#0066FF] bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">$ {viewingEnquiry.targetPrice.toLocaleString()}</p>
                </div>
              )}
              {viewingEnquiry.attachment && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">Attached Document / Image</span>
                  <div className="bg-[#f4f7fc] border border-slate-200/60 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <Paperclip size={14} className="text-[#0066FF] flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={viewingEnquiry.attachment.split('/').pop()}>
                        {viewingEnquiry.attachment.split('/').pop() || 'View Document'}
                      </span>
                    </div>
                    <a
                      href={viewingEnquiry.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black rounded-lg transition-all flex-shrink-0"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}
              {viewingEnquiry.message && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-600 uppercase font-black tracking-wider">Message from Customer</span>
                  <div className="bg-amber-50 border border-amber-100/60 rounded-xl p-3 text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewingEnquiry.message}
                  </div>
                </div>
              )}
              {type === 'direct' ? (
                viewingEnquiry.myResponse?.quoteDetails && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-[#0066FF] uppercase font-black tracking-wider">Your Submitted Quote Breakdown</span>
                    <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4 text-xs font-medium text-slate-700 space-y-3">
                      {viewingEnquiry.myResponse.quoteDetails.freightCharges && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Freight Charges:</span>
                          <span className="font-bold text-slate-800">{viewingEnquiry.myResponse.quoteDetails.freightCurrency} {Number(viewingEnquiry.myResponse.quoteDetails.freightCharges).toLocaleString()}</span>
                        </div>
                      )}
                      {viewingEnquiry.myResponse.quoteDetails.otherCharges && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Other Charges:</span>
                          <span className="font-bold text-slate-800">{viewingEnquiry.myResponse.quoteDetails.otherCurrency} {Number(viewingEnquiry.myResponse.quoteDetails.otherCharges).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                        <span className="font-black text-slate-900">All In Charges (Total):</span>
                        <span className="font-black text-[#0066FF] text-sm">{viewingEnquiry.myResponse.quoteDetails.allInCurrency} {Number(viewingEnquiry.myResponse.quoteDetails.allInCharges).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                viewingEnquiry.quoteDetails && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-[#0066FF] uppercase font-black tracking-wider">Submitted Quote Breakdown</span>
                    <div className="bg-blue-50/50 border border-blue-100/60 rounded-xl p-4 text-xs font-medium text-slate-700 space-y-3">
                      {viewingEnquiry.quoteDetails.freightCharges && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Freight Charges:</span>
                          <span className="font-bold text-slate-800">{viewingEnquiry.quoteDetails.freightCurrency} {Number(viewingEnquiry.quoteDetails.freightCharges).toLocaleString()}</span>
                        </div>
                      )}
                      {viewingEnquiry.quoteDetails.otherCharges && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Other Charges:</span>
                          <span className="font-bold text-slate-800">{viewingEnquiry.quoteDetails.otherCurrency} {Number(viewingEnquiry.quoteDetails.otherCharges).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                        <span className="font-black text-slate-900">All In Charges (Total):</span>
                        <span className="font-black text-[#0066FF] text-sm">{viewingEnquiry.quoteDetails.allInCurrency} {Number(viewingEnquiry.quoteDetails.allInCharges).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
      {/* Alert Note at the bottom */}
      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 flex items-start gap-3 mt-8">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold leading-relaxed">
          Note : Mobile No., Email ID and Commodity details will be visible to the vendor only after they accept the enquiry.
        </p>
      </div>

      {/* Limit Reached Modal */}
      {limitError && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-150 overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-[#0B1E43] tracking-tight">Monthly Limit Exceeded</h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                {limitError}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setLimitError('')}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black py-3 rounded-xl transition-all shadow-sm uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setLimitError('');
                  navigate('/vendor/upgrade');
                }}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black py-3 rounded-xl transition-all shadow-md shadow-[#0066FF]/10 uppercase tracking-wider cursor-pointer"
              >
                See Plans
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorEnquiriesTab;
