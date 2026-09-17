import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Phone, Mail, Search, MapPin, Building2, Ship, Plane, 
  Truck, Warehouse, Package, Coins, CheckCircle2, Clock, User, X, Hash 
} from 'lucide-react';
import { useEnquiries } from '../../services/EnquiryService';

const CustomerEnquiriesTab = ({ title, type }) => {
  const {
    enquiries,
    loading,
    error,
    fetchClientEnquiries
  } = useEnquiries();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showResponsesModal, setShowResponsesModal] = useState(null);

  const getLSID = (id) => {
    if (!id) return 'N/A';
    let hash = 0;
    const str = id.toString();
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 900000;
    }
    return 1000000000 + Math.abs(hash);
  };
  
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('id') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
  }, [selectedFilter, type]);

  useEffect(() => {
    const loadEnquiries = async () => {
      const res = await fetchClientEnquiries(type, page, 10, searchQuery, selectedFilter);
      if (res && res.totalPages) {
        setHasMore(page < res.totalPages);
      } else {
        setHasMore(false);
      }
    };
    loadEnquiries();
  }, [type, page, searchQuery, selectedFilter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

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

  const filteredEnquiries = enquiries; // Now filtered by backend

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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        <div className="space-y-6">
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
                          <h4 className="text-sm font-extrabold text-slate-800 leading-tight flex items-center gap-2">
                            {enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'Pending Carrier Assignment'}
                            {enq.vendor?.activePlan?.price > 0 && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            )}
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
                          <div className="text-slate-800 font-black flex items-center gap-2 cursor-pointer hover:text-[#0066FF]" onClick={() => setSelectedVendor(enq.vendor)}>
                            {enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'N/A'}
                            {enq.vendor?.activePlan?.price > 0 && (
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={9} /> Verified
                              </span>
                            )}
                          </div>
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
                          <div>{enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'FCL' || enq.truckLoad?.toUpperCase() === 'FCL') ? 'Container' : 'Weight/Size'}: <span className="font-black text-slate-800">{enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'FCL' || enq.truckLoad?.toUpperCase() === 'FCL') ? (enq.fclStandard || 'N/A') : (enq.weightRange || 'N/A')}</span></div>
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
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">{enq.type === 'cha' ? 'Port/Airport' : enq.type === 'warehouse' ? 'Location' : 'From'}</span>
                              <span className="font-black text-slate-800">{enq.fromLocation}</span>
                            </div>
                          </div>
                          {enq.type !== 'cha' && enq.type !== 'warehouse' && (
                            <div className="flex items-start gap-1.5">
                              <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">To</span>
                                <span className="font-black text-slate-800">{enq.toLocation}</span>
                              </div>
                            </div>
                          )}
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
                  className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 hover:border-[#0066FF]/20 hover:shadow-xl transition-all duration-300 relative shadow-[0_4px_25px_rgba(11,30,67,0.03)]"
                >
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                        {getEnquiryIcon(enq.type)}
                      </div>
                      <div>
                        <h3 className="text-[#0B1E43] font-black text-lg tracking-tight">
                          {enq.vendor ? (enq.vendor.company || enq.vendor.name) : 'Broadcasted Lead'}
                        </h3>
                        <p className="text-slate-400 text-xs font-bold mt-0.5">Enquiry ID: {enq.enquiryId || `DEQ-${getLSID(enq._id)}`}</p>
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs font-bold text-left sm:text-right">
                      Posted on : <span className="text-[#0B1E43] font-black">{formatDate(enq.createdAt)}</span>
                    </div>
                  </div>

                  {/* Middle Row (Specs) */}
                  <div className="flex flex-wrap items-stretch gap-3 mb-6">
                    {/* Route Box */}
                    <div className="flex items-center gap-4 bg-[#f4f7fc]/80 px-5 py-3.5 rounded-2xl border border-slate-100 grow min-w-[280px]">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase mb-1">
                          <MapPin size={12} className="text-[#0066FF]" /> {enq.type === 'cha' ? 'Port/Airport' : enq.type === 'warehouse' ? 'Location' : 'Origin'}
                        </div>
                        <span className="font-extrabold text-[#0B1E43] text-sm">{enq.fromLocation}</span>
                      </div>
                      
                      {enq.type !== 'warehouse' && enq.type !== 'cha' && (
                        <>
                          <div className="flex-shrink-0 text-[#0066FF] font-black">⇄</div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase mb-1">
                              <MapPin size={12} className="text-[#0066FF]" /> Destination
                            </div>
                            <span className="font-extrabold text-[#0B1E43] text-sm">{enq.toLocation}</span>
                          </div>
                        </>
                      )}
                      
                      {enq.type === 'cha' && (
                         <>
                          <div className="flex-shrink-0 text-[#0066FF] font-black">-</div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase mb-1">
                              <Building2 size={12} className="text-[#0066FF]" /> Service
                            </div>
                            <span className="font-extrabold text-[#0B1E43] text-sm">{enq.chaServiceType || 'CHA'}</span>
                          </div>
                         </>
                      )}
                    </div>

                    {/* Weight / Size */}
                    <div className="bg-[#f4f7fc]/80 px-4 py-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 grow sm:grow-0">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0066FF] shadow-sm shrink-0 border border-slate-100">
                        <Package size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{enq.type === 'sea' && (enq.seaLoadType?.toUpperCase() === 'FCL' || enq.truckLoad?.toUpperCase() === 'FCL') ? 'Container' : 'Weight'}</div>
                        <div className="text-sm font-extrabold text-[#0B1E43] mt-0.5">{enq.weightRange || (enq.fclStandard ? enq.fclStandard : 'N/A')}</div>
                      </div>
                    </div>

                    {/* Load Type */}
                    <div className="bg-[#f4f7fc]/80 px-4 py-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 grow sm:grow-0">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0066FF] shadow-sm shrink-0 border border-slate-100">
                        <Warehouse size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Load Type</div>
                        <div className="text-sm font-extrabold text-[#0B1E43] mt-0.5">
                           {enq.type === 'sea' ? (enq.seaLoadType || enq.handlingType || enq.truckLoad || 'LCL') : (enq.truckLoad || 'General')}
                        </div>
                      </div>
                    </div>

                    {/* Target Delivery */}
                    <div className="bg-[#f4f7fc]/80 px-4 py-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 grow sm:grow-0">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0066FF] shadow-sm shrink-0 border border-slate-100">
                        <Clock size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Delivery</div>
                        <div className="text-sm font-extrabold text-[#0B1E43] mt-0.5">
                           {enq.shipmentDate ? formatDate(enq.shipmentDate) : getTargetDate(enq.createdAt, enq.deliverySpeed)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row (Avatars + Button or Status) */}
                  <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Avatars Side */}
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-2">
                          <User size={16} className="text-[#0066FF]" />
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                             Acceptance Received ({enq.responses?.length || 0})
                          </span>
                       </div>
                       
                       {type === 'direct' && enq.responses && enq.responses.length > 0 && (
                         <div className="flex -space-x-2">
                            {enq.responses.slice(0, 3).map((resp, idx) => {
                               const colors = ['bg-pink-100 text-pink-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700'];
                               return (
                                 <div key={idx} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black uppercase shadow-sm ${colors[idx % colors.length]}`}>
                                    {(resp.vendor?.company || resp.vendor?.name || 'V').charAt(0)}
                                 </div>
                               );
                            })}
                            {enq.responses.length > 3 && (
                               <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-600 shadow-sm">
                                  +{enq.responses.length - 3}
                               </div>
                            )}
                         </div>
                       )}
                    </div>

                    {/* Action Button / Quote Display */}
                    <div className="flex items-center justify-end">
                      {type === 'direct' && enq.responses && enq.responses.length > 0 ? (
                        <button
                           onClick={() => setShowResponsesModal(enq)}
                           className="flex items-center gap-2 bg-[#0066FF] hover:bg-[#0055D4] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-[#0066FF]/20"
                        >
                           View All Quotes <span className="text-sm font-black leading-none mt-[1px]">→</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          {hasQuote && (
                            <div className="flex flex-col items-end px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
                                <span className="text-[9px] uppercase font-black opacity-80">Total Quote</span>
                                <span className="text-sm font-black">₹ {enq.price ? enq.price.toLocaleString() : 'N/A'}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-1.5 font-extrabold text-xs px-4 py-2.5 rounded-xl border ${
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

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setSelectedVendor(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <Building2 size={32} className="text-[#0066FF]" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
                {selectedVendor.company || selectedVendor.name || 'Vendor Details'}
                {selectedVendor.activePlan?.price > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </h3>
              {selectedVendor.name && selectedVendor.company && (
                <p className="text-sm font-bold text-slate-500 mb-6">Contact: {selectedVendor.name}</p>
              )}
              
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600">
                    <Hash size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">LS ID</p>
                    <p className="text-sm font-bold text-slate-800">LS-{getLSID(selectedVendor._id)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-emerald-600">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mobile Number</p>
                    <p className="text-sm font-bold text-slate-800">{selectedVendor.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100/50 flex items-center justify-center text-purple-600">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</p>
                    <p className="text-sm font-bold text-slate-800 break-all">{selectedVendor.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedVendor(null)}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl transition-colors uppercase text-xs tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responses Modal */}
      {showResponsesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-[#0B1E43]">Received Quotes</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                  {showResponsesModal.responses.length} Carrier{showResponsesModal.responses.length !== 1 ? 's' : ''} Accepted
                </p>
              </div>
              <button 
                onClick={() => setShowResponsesModal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-4 bg-slate-50/30">
              {showResponsesModal.responses.map((resp, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-black bg-white px-5 py-4 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(11,30,67,0.03)] hover:border-[#0066FF]/30 transition-all hover:shadow-md group">
                  <div 
                      className="flex items-center gap-3 cursor-pointer p-2 -ml-2 rounded-xl transition-colors group-hover:bg-[#0066FF]/5"
                      onClick={() => setSelectedVendor(resp.vendor)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 flex items-center justify-center text-[#0066FF]">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#0B1E43] group-hover:text-[#0066FF] transition-colors">{resp.vendor?.company || resp.vendor?.name || 'Vendor'}</span>
                        {resp.vendor?.activePlan?.price > 0 && (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5 block">View Details</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:border-l sm:border-slate-100 sm:pl-6">
                    {resp.quoteDetails?.freightCharges ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-400 uppercase font-black">Freight</span>
                            <span className="font-extrabold text-slate-700 text-sm">{resp.quoteDetails.freightCurrency} {Number(resp.quoteDetails.freightCharges).toLocaleString()}</span>
                        </div>
                    ) : null}
                    
                    {resp.quoteDetails?.otherCharges ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-slate-400 uppercase font-black">Other</span>
                            <span className="font-extrabold text-slate-700 text-sm">{resp.quoteDetails.otherCurrency} {Number(resp.quoteDetails.otherCharges).toLocaleString()}</span>
                        </div>
                    ) : null}
                    
                    {resp.quoteDetails?.allInCharges ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-[#0066FF]/70 uppercase font-black">All-In</span>
                            <span className="font-black text-[#0066FF] text-lg">{resp.quoteDetails.allInCurrency} {Number(resp.quoteDetails.allInCharges).toLocaleString()}</span>
                        </div>
                    ) : null}
                    
                    {(!resp.quoteDetails || (!resp.quoteDetails.freightCharges && !resp.quoteDetails.otherCharges && !resp.quoteDetails.allInCharges)) && (
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-[#0066FF]/70 uppercase font-black">Total Quote</span>
                            <span className="font-black text-[#0066FF] text-lg">₹ {resp.price ? resp.price.toLocaleString() : 'N/A'}</span>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerEnquiriesTab;
