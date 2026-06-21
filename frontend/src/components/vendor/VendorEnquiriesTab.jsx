import React, { useEffect, useState } from 'react';
import { 
  Check, X, Phone, Mail, User, Info, Search, MapPin, 
  Building2, Ship, Plane, Truck, Warehouse, Package, 
  Clock, Calendar, Coins, CheckCircle2 
} from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';

const VendorEnquiriesTab = ({ title, type }) => {
  const {
    enquiries,
    loading,
    error,
    limitReached,
    fetchVendorEnquiries,
    updateEnquiryStatus
  } = useEnquiries();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', '7days', '15days', 'thismonth', or 'YYYY-MM'
  
  // State for Quote modal/prompt
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');

  useEffect(() => {
    fetchVendorEnquiries(type);
  }, [type]);

  const handleAction = async (id, newStatus, priceVal = null) => {
    try {
      await updateEnquiryStatus(id, newStatus, type, priceVal);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleQuoteSubmit = async (e, id) => {
    e.preventDefault();
    if (!quotePrice || isNaN(quotePrice)) {
      alert('Please enter a valid price');
      return;
    }
    await handleAction(id, 'Accepted', Number(quotePrice));
    setActiveQuoteId(null);
    setQuotePrice('');
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

  // Filtering Logic
  const filteredEnquiries = enquiries.filter((enq) => {
    // 1. Text Search query matching
    const searchLower = searchQuery.toLowerCase();
    const clientName = (enq.client?.name || enq.guestName || '').toLowerCase();
    const clientEmail = (enq.client?.email || enq.guestEmail || '').toLowerCase();
    const clientPhone = (enq.client?.phone || enq.guestPhone || '').toLowerCase();
    const clientCompany = (enq.client?.company || enq.guestCompany || '').toLowerCase();
    const fromLoc = (enq.fromLocation || '').toLowerCase();
    const toLoc = (enq.toLocation || '').toLowerCase();
    const comm = (enq.commodity || '').toLowerCase();
    const cargoType = (enq.type || '').toLowerCase();

    const matchesSearch = 
      clientName.includes(searchLower) ||
      clientEmail.includes(searchLower) ||
      clientPhone.includes(searchLower) ||
      clientCompany.includes(searchLower) ||
      fromLoc.includes(searchLower) ||
      toLoc.includes(searchLower) ||
      comm.includes(searchLower) ||
      cargoType.includes(searchLower);

    if (!matchesSearch) return false;

    // 2. Date Filtering
    if (selectedFilter === 'all') return true;

    const enqDate = new Date(enq.createdAt || Date.now());
    const today = new Date();

    if (selectedFilter === '7days') {
      const diffTime = Math.abs(today - enqDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    if (selectedFilter === '15days') {
      const diffTime = Math.abs(today - enqDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 15;
    }

    if (selectedFilter === 'thismonth') {
      return enqDate.getMonth() === today.getMonth() && enqDate.getFullYear() === today.getFullYear();
    }

    // YYYY-MM matching
    const [filterYear, filterMonth] = selectedFilter.split('-');
    return enqDate.getFullYear() === parseInt(filterYear) && (enqDate.getMonth() + 1) === parseInt(filterMonth);
  });

  return (
    <div className="space-y-6">
      {limitReached && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Free Limit Reached</h4>
            <p className="text-xs font-semibold text-white/90 mt-1">
              You are currently viewing a limited list of 5 enquiries. Please purchase a premium subscription plan matching your country to unlock all direct booking requests and matched leads.
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
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                  selectedFilter === filter.id
                    ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-[#0066FF]/15'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {filter.label}
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
        <div className="text-center py-12 text-red-500 font-bold text-xs bg-white rounded-3xl border border-slate-100">
          {error}
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="text-center py-12 text-slate-400 font-semibold text-xs bg-white rounded-3xl border border-slate-100">
          No matching enquiries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEnquiries.map((enq) => {
            const hasQuote = enq.price !== undefined && enq.price !== null;
            const isAccepted = enq.status === 'Accepted';

            return (
              <div 
                key={enq._id} 
                className="bg-gradient-to-br from-white to-[#f4f8ff]/30 rounded-3xl p-6 md:p-8 border border-sky-100/70 hover:border-sky-300 hover:shadow-xl transition-all duration-300 relative shadow-[0_12px_45px_rgba(11,30,67,0.025)]"
              >
                {/* Date of Enquiry Badge */}
                <div className="absolute top-6 right-6 text-xs text-slate-400 font-bold">
                  Date of Enquiry : - <span className="text-slate-700 font-black">{formatDate(enq.createdAt)}</span>
                </div>

                {/* Card Main Grid */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Column: Avatar & Contact Specs */}
                  <div className="flex items-start gap-4">
                    {/* Circle Icon Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                      {getEnquiryIcon(enq.type)}
                    </div>

                    {/* Customer & Commodity Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-[#0B1E43] tracking-tight">
                          {enq.client?.company || enq.guestCompany || enq.client?.name || enq.guestName || 'Customer'}
                        </h4>
                        {enq.client?.role === 'vendor' && (
                          <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                            Verified Vendor
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-bold space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={13} className="text-[#0066FF]" /> 
                          <span>{enq.client?.phone || enq.guestPhone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail size={13} className="text-[#0066FF]" /> 
                          <span className="break-all">{enq.client?.email || enq.guestEmail || 'N/A'}</span>
                        </div>
                      </div>

                      {enq.commodity && (
                        <div className="inline-block mt-2 text-xs font-black text-slate-800 uppercase bg-[#f4f7fc] px-3 py-1 rounded-xl border border-slate-100">
                          Commodity - <span className="text-[#0066FF]">{enq.commodity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Specs Badges */}
                  <div className="flex flex-wrap gap-3 max-w-md items-center md:justify-center">
                    {/* Specs Badge: Weight */}
                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Weight</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">{enq.weightRange || 'N/A'}</div>
                    </div>

                    {/* Specs Badge: Load Type */}
                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Load Type</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">
                        {enq.type === 'sea' ? (enq.handlingType || 'LCL') : (enq.truckLoad || 'General')}
                      </div>
                    </div>

                    {/* Specs Badge: Speed / Target Date */}
                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[100px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Target Delivery</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">{getTargetDate(enq.createdAt, enq.deliverySpeed)}</div>
                    </div>

                    {/* Specs Badge: Volume / CBM */}
                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] text-center min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Volume</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">
                        {enq.type === 'sea' ? 'CBM - 0-5' : (enq.vehicleType || 'Standard')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route & Actions Bottom Bar */}
                <div className="mt-6 pt-6 border-t border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Ports / Locations Route */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2 bg-[#f4f7fc] px-3.5 py-2 rounded-xl border border-slate-150">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{enq.fromLocation}</span>
                    </div>
                    <span className="text-[#0066FF] font-black text-lg">↔</span>
                    <div className="flex items-center gap-2 bg-[#f4f7fc] px-3.5 py-2 rounded-xl border border-slate-150">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{enq.toLocation}</span>
                    </div>
                  </div>

                  {/* Pricing / Quoted display */}
                  {hasQuote && (
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100/70">
                      <Coins size={14} />
                      <span>Quoted Price: ₹{enq.price.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Actions / Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Status Accepted Badge */}
                    {isAccepted ? (
                      <div className="flex items-center gap-1.5 bg-green-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-green-500/10">
                        <CheckCircle2 size={14} />
                        <span>Accepted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAction(enq._id, 'Accepted')}
                        className="bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-green-500/10 cursor-pointer"
                      >
                        Accept
                      </button>
                    )}

                    {/* Quote trigger button */}
                    <button
                      onClick={() => setActiveQuoteId(activeQuoteId === enq._id ? null : enq._id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                    >
                      {hasQuote ? 'Update Quote' : 'Quote'}
                    </button>
                  </div>
                </div>

                {/* Inline Quote Form */}
                {activeQuoteId === enq._id && (
                  <form 
                    onSubmit={(e) => handleQuoteSubmit(e, enq._id)}
                    className="mt-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-wrap items-center gap-3 animate-fadeIn"
                  >
                    <div className="flex-grow min-w-[200px]">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Enter Price Quote (INR)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 15000"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
                        required
                      />
                    </div>
                    <div className="flex gap-2 self-end">
                      <button 
                        type="submit" 
                        className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                      >
                        Submit Quote
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActiveQuoteId(null)}
                        className="bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorEnquiriesTab;
