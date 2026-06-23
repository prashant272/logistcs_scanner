import React, { useEffect, useState } from 'react';
import { 
  Phone, Mail, Search, MapPin, Building2, Ship, Plane, 
  Truck, Warehouse, Package, Coins, CheckCircle2, Clock, User 
} from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';

const CustomerEnquiriesTab = ({ title, type }) => {
  const {
    enquiries,
    loading,
    error,
    fetchClientEnquiries
  } = useEnquiries();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchClientEnquiries(type);
  }, [type]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTargetDate = (createdAtStr, speedStr) => {
    if (!createdAtStr) return 'N/A';
    const date = new Date(createdAtStr);
    const days = parseInt(speedStr) || 5;
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

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

  const filteredEnquiries = enquiries.filter((enq) => {
    const searchLower = searchQuery.toLowerCase();
    const vendorName = (enq.vendor?.name || '').toLowerCase();
    const vendorCompany = (enq.vendor?.company || '').toLowerCase();
    const fromLoc = (enq.fromLocation || '').toLowerCase();
    const toLoc = (enq.toLocation || '').toLowerCase();
    const comm = (enq.commodity || '').toLowerCase();
    const cargoType = (enq.type || '').toLowerCase();

    const matchesSearch = 
      vendorName.includes(searchLower) ||
      vendorCompany.includes(searchLower) ||
      fromLoc.includes(searchLower) ||
      toLoc.includes(searchLower) ||
      comm.includes(searchLower) ||
      cargoType.includes(searchLower);

    if (!matchesSearch) return false;
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

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Header Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-[#0B1E43] tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 font-bold tracking-wide mt-0.5 uppercase">
              {type === 'my' 
                ? 'Your enquiries matched with specific vendor plans' 
                : 'Direct enquiries broadcasted by you to the whole network'}
            </p>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <input 
              type="text" 
              placeholder="Search enquiries..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f4f7fc] border border-slate-200/80 rounded-2xl py-2.5 pl-5 pr-12 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>

          <div className="flex gap-2">
            {['all', '7days', '15days'].map((filterId) => (
              <button
                key={filterId}
                onClick={() => setSelectedFilter(filterId)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedFilter === filterId
                    ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {filterId === 'all' ? 'All' : filterId === '7days' ? 'Past 7 Days' : 'Past 15 Days'}
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

            if (enq.isBooking) {
              return (
                <div 
                  key={enq._id} 
                  className="bg-white rounded-3xl p-6 md:p-8 border border-amber-250 hover:border-amber-400 hover:shadow-xl transition-all duration-300 relative shadow-[0_12px_45px_rgba(245,158,11,0.02)]"
                >
                  {/* Top Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                        <CheckCircle2 size={20} className="fill-amber-50" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Shipment Booking</span>
                        <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                          {enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'Pending Carrier Assignment'}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                      <div className={`flex items-center gap-1.5 font-extrabold text-xs px-3.5 py-1.5 rounded-xl border ${
                        enq.status === 'Accepted' 
                          ? 'bg-green-50 text-green-600 border-green-200' 
                          : enq.status === 'Declined'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {enq.status === 'Accepted' ? 'Booking Confirmed' : enq.status === 'Declined' ? 'Booking Declined' : 'Carrier Contacted'}
                      </div>
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Carrier Info */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Carrier Details</span>
                      <div className="text-xs space-y-1.5 font-bold">
                        <div className="text-slate-800 font-black">{enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'N/A'}</div>
                        {enq.vendor && (
                          <>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone size={13} className="text-[#0066FF] shrink-0" />
                              <span>{enq.vendor.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail size={13} className="text-[#0066FF] shrink-0" />
                              <span className="break-all">{enq.vendor.email || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cargo Specs */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cargo Details</span>
                      <div className="text-xs space-y-1.5 font-bold text-slate-700">
                        <div className="flex items-center gap-1.5 capitalize">
                          {getEnquiryIcon(enq.type)}
                          <span className="font-extrabold">{enq.type} Freight</span>
                        </div>
                        <div>Weight/Size: <span className="font-black text-slate-800">{enq.weightRange || 'N/A'}</span></div>
                        <div>Date booked: <span className="font-black text-slate-800">{formatDate(enq.createdAt)}</span></div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Shipment Route</span>
                      <div className="text-xs space-y-1.5 font-bold text-slate-700">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">From</span>
                            <span className="font-black text-slate-800">{enq.fromLocation}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">To</span>
                            <span className="font-black text-slate-800">{enq.toLocation}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rate details</span>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estimated Price</span>
                        <div className="text-base font-black text-[#0066FF]">
                          ₹{enq.price ? enq.price.toLocaleString() : 'N/A'}
                        </div>
                        {enq.type === 'sea' && (
                          <div className="text-[10px] font-bold text-slate-400">Per Container</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={enq._id} 
                className="bg-gradient-to-br from-white to-[#f4f8ff]/30 rounded-3xl p-6 md:p-8 border border-sky-100/70 hover:border-sky-300 hover:shadow-xl transition-all duration-300 relative shadow-[0_12px_45px_rgba(11,30,67,0.025)]"
              >
                {/* Date of Enquiry Badge */}
                <div className="absolute top-6 right-6 text-xs text-slate-400 font-bold">
                  Posted on : - <span className="text-slate-700 font-black">{formatDate(enq.createdAt)}</span>
                </div>

                {/* Card Main Grid */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Column: Avatar & Contact Specs */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                      {getEnquiryIcon(enq.type)}
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-black text-[#0B1E43] tracking-tight">
                        {enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'Broadcasted Lead'}
                      </h4>

                      {enq.vendor && (
                        <div className="text-xs text-slate-500 font-bold space-y-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={13} className="text-[#0066FF]" /> 
                            <span>{enq.vendor.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Mail size={13} className="text-[#0066FF]" /> 
                            <span className="break-all">{enq.vendor.email || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {enq.commodity && (
                        <div className="inline-block mt-2 text-xs font-black text-slate-800 uppercase bg-[#f4f7fc] px-3 py-1 rounded-xl border border-slate-100">
                          Commodity - <span className="text-[#0066FF]">{enq.commodity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Specs Badges */}
                  <div className="flex flex-wrap gap-3 max-w-md items-center md:justify-center">
                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-sm text-center min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Weight</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">{enq.weightRange || 'N/A'}</div>
                    </div>

                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-sm text-center min-w-[80px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Load Type</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">
                        {enq.type === 'sea' ? (enq.handlingType || 'LCL') : (enq.truckLoad || 'General')}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100/90 rounded-2xl py-2 px-4 shadow-sm text-center min-w-[100px]">
                      <div className="text-[10px] text-slate-400 font-black tracking-wider uppercase">Target Delivery</div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">{getTargetDate(enq.createdAt, enq.deliverySpeed)}</div>
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

                  {/* Quoted display or Status */}
                  <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                    {type === 'direct' && enq.responses && enq.responses.length > 0 ? (
                      <div className="w-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Received Quotes ({enq.responses.length})</span>
                        <div className="space-y-2">
                          {enq.responses.map((resp, idx) => (
                            <div key={idx} className="flex flex-wrap items-center justify-between gap-4 text-xs font-black bg-blue-50/50 px-4 py-3 rounded-xl border border-blue-100/70">
                              <div className="flex items-center gap-2">
                                <User size={14} className="text-[#0066FF]" />
                                <span className="text-[#0B1E43]">{resp.vendor?.company || resp.vendor?.name || 'Vendor'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-emerald-600">
                                <Coins size={14} />
                                <span>{resp.quoteDetails?.allInCurrency || '₹'} {resp.price?.toLocaleString() || resp.quoteDetails?.allInCharges}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {hasQuote && (
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100/70">
                            <Coins size={14} />
                            <span>Vendor Price Quote: ₹{enq.price?.toLocaleString()}</span>
                          </div>
                        )}

                        <div className={`flex items-center gap-1.5 font-extrabold text-xs px-4 py-2 rounded-xl border ${
                          isAccepted 
                            ? 'bg-green-50 text-green-600 border-green-200' 
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {isAccepted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                          <span>{enq.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerEnquiriesTab;
