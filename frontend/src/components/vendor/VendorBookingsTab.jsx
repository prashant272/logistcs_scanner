import React, { useEffect, useState } from 'react';
import { 
  Check, X, Phone, Mail, User, Info, Search, MapPin, 
  Building2, Ship, Plane, Truck, Warehouse, Package, 
  Clock, Calendar, Coins, CheckCircle2 
} from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';
import { useAuth } from '../../context/AuthContext';

const VendorBookingsTab = ({ title = 'Bookings', type = 'my' }) => {
  const { user } = useAuth();
  const {
    loading,
    error,
    limitReached,
    fetchVendorBookings,
    updateEnquiryStatus
  } = useEnquiries();

  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for quote/price confirmation in bookings
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');

  const loadBookings = async () => {
    try {
      const data = await fetchVendorBookings(type);
      setBookings(data?.data || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [type]);

  const handleAction = async (id, newStatus, priceVal = null) => {
    try {
      await updateEnquiryStatus(id, newStatus, type, priceVal);
      // Reload bookings to reflect state changes (e.g. accepted direct booking moves to my bookings)
      loadBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
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

  // Helper to get estimated delivery date based on transit speed (in days)
  const getTargetDate = (createdAtStr, speedStr) => {
    if (!createdAtStr) return 'N/A';
    const created = new Date(createdAtStr);
    const days = parseInt(speedStr) || 3;
    created.setDate(created.getDate() + days);
    return formatDate(created);
  };

  const getFreightIcon = (fType) => {
    switch (fType) {
      case 'sea': return <Ship className="w-5 h-5 text-sky-600" />;
      case 'air': return <Plane className="w-5 h-5 text-indigo-600" />;
      case 'land': return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'warehouse': return <Warehouse className="w-5 h-5 text-amber-600" />;
      default: return <Package className="w-5 h-5 text-slate-600" />;
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((bkg) => {
    const clientName = (bkg.client?.name || bkg.guestName || '').toLowerCase();
    const clientEmail = (bkg.client?.email || bkg.guestEmail || '').toLowerCase();
    const clientPhone = (bkg.client?.phone || bkg.guestPhone || '').toLowerCase();
    const clientCompany = (bkg.client?.company || bkg.guestCompany || '').toLowerCase();
    const origin = (bkg.fromLocation || '').toLowerCase();
    const destination = (bkg.toLocation || '').toLowerCase();
    const commodity = (bkg.commodity || '').toLowerCase();
    const id = (bkg._id || '').toLowerCase();

    const query = searchQuery.toLowerCase();

    return (
      clientName.includes(query) ||
      clientEmail.includes(query) ||
      clientPhone.includes(query) ||
      clientCompany.includes(query) ||
      origin.includes(query) ||
      destination.includes(query) ||
      commodity.includes(query) ||
      id.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {limitReached && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider">Free Limit Reached</h4>
            <p className="text-xs font-semibold text-white/90 mt-1">
              You are currently viewing a limited list of 5 bookings. Please purchase a premium subscription plan matching your country to unlock all booking requests and matched leads.
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

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
      
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[#0B1E43] tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {type === 'my' 
              ? 'Track and manage active booked cargo shipments and dispatch schedules'
              : 'Public booking requests matching your operations'}
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative max-w-sm w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search client, route, commodity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0066FF] focus:bg-white bg-slate-50/50 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Loading bookings...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-xs font-bold text-red-500">
          {error}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 rounded-2xl">
          No bookings found
        </div>
      ) : (
        /* Dynamic bookings list */
        <div className="grid grid-cols-1 gap-5">
          {filteredBookings.map((bkg) => {
            const hasQuoteInput = activeQuoteId === bkg._id;
            const isInitiator = bkg.client?._id === user?._id || bkg.client === user?._id || (user?._id && String(bkg.client) === String(user._id));

            return (
              <div 
                key={bkg._id} 
                className="bg-gradient-to-br from-white to-[#f8fafc]/40 border border-slate-100/80 rounded-2xl p-5 hover:border-[#0066FF]/20 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] group"
              >
                {/* Left status accent strip */}
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${
                  bkg.status === 'Accepted' ? 'bg-emerald-500' :
                  bkg.status === 'Declined' ? 'bg-rose-500' :
                  'bg-amber-500'
                }`} />

                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pl-2">
                  
                  {/* Left block: Client & Cargo info */}
                  <div className="space-y-3.5 flex-1 w-full">
                    {/* Header line */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[#0066FF] font-black font-mono text-[11px] bg-[#0066FF]/5 border border-[#0066FF]/10 px-2 py-0.5 rounded-lg tracking-wider">
                        BKG-{bkg._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-black tracking-wider uppercase">
                        {bkg.type} Freight
                      </span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100/50 px-2 py-0.5 rounded-lg font-black tracking-wider uppercase flex items-center gap-1">
                        <CheckCircle2 size={10} /> Booking
                      </span>
                    </div>

                    {/* Route display */}
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                      <MapPin size={13} className="text-[#0066FF]" />
                      <span>{bkg.fromLocation}</span>
                      <span className="text-[#0066FF] font-black">↔</span>
                      <span>{bkg.toLocation}</span>
                    </div>

                    {/* Cargo Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-bold">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Commodity</span>
                        <span className="text-slate-800 truncate block font-black">{bkg.commodity || 'General Cargo'}</span>
                      </div>
                      
                      {bkg.type === 'air' && bkg.weightRange && (
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Weight Class</span>
                          <span className="text-slate-800 truncate block font-black">{bkg.weightRange}</span>
                        </div>
                      )}

                      {bkg.type === 'land' && (bkg.truckLoad || bkg.vehicleType) && (
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Truck load</span>
                          <span className="text-slate-800 truncate block font-black">{bkg.truckLoad || bkg.vehicleType}</span>
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Transit Time</span>
                        <span className="text-slate-800 block font-black flex items-center gap-1"><Clock size={11} className="text-slate-400" /> {bkg.deliverySpeed || '3-5'} Days</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-400 block uppercase font-black text-[8px] tracking-wider">Delivery Target</span>
                        <span className="text-slate-800 block font-black flex items-center gap-1"><Calendar size={11} className="text-slate-400" /> {getTargetDate(bkg.createdAt, bkg.deliverySpeed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Client contacts & Status */}
                  <div className="flex flex-col lg:items-end justify-between lg:text-right gap-3 lg:border-l lg:border-slate-100 lg:pl-6 w-full lg:w-auto lg:min-w-[220px] shrink-0">
                    
                    {/* Client Company Name */}
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Shipper</span>
                      <div className="flex flex-wrap items-center lg:justify-end gap-1.5 font-black text-xs text-slate-800">
                        <Building2 size={13} className="text-slate-400" />
                        <span>{bkg.client?.company || bkg.guestCompany || bkg.client?.name || bkg.guestName || 'Customer'}</span>
                        {bkg.client?.role === 'vendor' ? (
                          bkg.client?.activePlan && bkg.client?.planEndDate && new Date(bkg.client.planEndDate) > new Date() ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                              Verified Vendor
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                              Vendor
                            </span>
                          )
                        ) : (
                          bkg.client?.activePlan && bkg.client?.planEndDate && new Date(bkg.client.planEndDate) > new Date() && (
                            <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                              Verified Customer
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Contacts */}
                    <div className="space-y-1 text-[10px] text-slate-500 font-bold">
                      <div className="flex items-center lg:justify-end gap-1.5">
                        <Phone size={11} className="text-slate-400" />
                        <span>{bkg.client?.phone || bkg.guestPhone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center lg:justify-end gap-1.5">
                        <Mail size={11} className="text-slate-400" />
                        <span className="break-all">{bkg.client?.email || bkg.guestEmail || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Price and status badges */}
                    <div className="flex flex-col lg:items-end gap-2 pt-1">
                      {type === 'direct' ? (
                        <div className="text-left lg:text-right space-y-1 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl">
                          <div className="text-[9px] font-bold text-slate-500">
                            Customer booked at: <span className="text-[#0066FF] font-black">₹ {(bkg.price || 0).toLocaleString()}</span>
                          </div>
                          <div className="text-[9px] font-bold text-slate-500">
                            Your active price: <span className="text-emerald-600 font-black">{bkg.vendorOwnPrice ? `₹ ${bkg.vendorOwnPrice.toLocaleString()}` : 'Not Configured'}</span>
                          </div>
                        </div>
                      ) : (
                        bkg.price ? (
                          <div className="text-left lg:text-right">
                            <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Estimated Rate</span>
                            <span className="text-sm font-black text-[#0066FF]">₹ {bkg.price.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="text-left lg:text-right">
                            <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">Rate</span>
                            <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-lg">Quoted / Pending</span>
                          </div>
                        )
                      )}

                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        bkg.status === 'Accepted' ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' : 
                        bkg.status === 'Declined' ? 'text-rose-600 border-rose-100 bg-rose-50/50' : 
                        'text-amber-600 border-amber-100 bg-amber-50/50'
                      }`}>
                        {bkg.status}
                      </span>
                    </div>

                  </div>

                </div>

                {/* Actions row for Direct Bookings */}
                {type === 'direct' && bkg.status === 'Pending' && !isInitiator && (
                  <div className="border-t border-slate-50 pt-4 flex flex-col sm:flex-row justify-end items-center gap-3 pl-2">
                    
                    {!hasQuoteInput ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setActiveQuoteId(bkg._id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                        >
                          <Check size={12} /> Confirm Booking
                        </button>
                        <button
                          onClick={() => handleAction(bkg._id, 'Declined')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                        >
                          <X size={12} /> Decline
                        </button>
                      </div>
                    ) : (
                      /* Price Quote submit box */
                      <form onSubmit={(e) => handleQuoteSubmit(e, bkg._id)} className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-[10px] text-slate-400 font-bold">Booking Rate (₹):</span>
                        <input
                          type="number"
                          placeholder="Rate"
                          value={quotePrice}
                          onChange={(e) => setQuotePrice(e.target.value)}
                          className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-[#0066FF]"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-wider"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveQuoteId(null); setQuotePrice(''); }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-wider"
                        >
                          Cancel
                        </button>
                      </form>
                    )}

                  </div>
                )}

                {/* Actions row for My Bookings */}
                {type === 'my' && !isInitiator && (
                  <div className="border-t border-slate-50 pt-4 flex flex-wrap justify-end items-center gap-2.5 pl-2">
                    <button
                      onClick={() => handleAction(bkg._id, 'Accepted')}
                      className={`flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                        bkg.status === 'Accepted'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => handleAction(bkg._id, 'Pending')}
                      className={`flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                        bkg.status === 'Pending'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      <Clock size={12} /> Pending
                    </button>
                    <button
                      onClick={() => handleAction(bkg._id, 'Declined')}
                      className={`flex items-center justify-center gap-1.5 text-[10px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                        bkg.status === 'Declined'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
      </div>

    </div>
  );
};

export default VendorBookingsTab;
