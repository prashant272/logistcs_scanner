import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Sparkles, Ship, Plane, Truck, Warehouse, Package, 
  Coins, CheckCircle2, ChevronRight, Phone, Mail, Building, 
  FileText, X, AlertCircle, Loader2, Calendar, Clock, ToggleLeft, ToggleRight, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEnquiries } from '../../services/EnquiryService';

import { COUNTRIES } from '../../utils/countries';

const SearchResults = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createEnquiry } = useEnquiries();

  // If no search state is passed, go back to dashboard or home page
  useEffect(() => {
    if (!state) {
      const targetPath = user 
        ? (user.role === 'customer' ? '/customer' : '/vendor') 
        : '/';
      navigate(targetPath, { replace: true });
    }
  }, [state, navigate, user]);

  const searchPayload = state?.payload || {};
  const searchResults = state?.results || [];
  const queryDetails = state?.searchQueryDetails || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Guest details form state
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestCompany, setGuestCompany] = useState('');
  const [guestCommodity, setGuestCommodity] = useState('');
  const [guestPhoneCode, setGuestPhoneCode] = useState('+91');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState(() => {
    const saved = localStorage.getItem('guestInfo');
    return saved ? JSON.parse(saved).guestEmail : '';
  });
  const [messageInput, setMessageInput] = useState('');
  const [clientCreditRequired, setClientCreditRequired] = useState(true);
  const [showWalletAlertModal, setShowWalletAlertModal] = useState(false);
  const [walletAlertStep, setWalletAlertStep] = useState(1);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'enquiry' | 'book', rate: ... }

  const handleCreditToggle = () => {
    if (!user?.walletBalance || user.walletBalance <= 0) {
      setWalletAlertStep(1);
      setShowWalletAlertModal(true);
    } else {
      setClientCreditRequired(!clientCreditRequired);
    }
  };

  const broadcastTriggered = useRef(false);

  // Auto-broadcast if no rates match on load
  useEffect(() => {
    if (state && searchResults.length === 0) {
      if (broadcastTriggered.current) return;
      broadcastTriggered.current = true;

      const savedGuest = localStorage.getItem('guestInfo');
      if (user) {
        if (user.role === 'vendor') {
          // Do not auto-broadcast for vendors. Let them trigger it manually.
          broadcastTriggered.current = false;
        } else {
          // User logged in: Automatically trigger broadcast
          handleAutoBroadcast();
        }
      } else if (savedGuest) {
        // Guest user with saved info: Automatically trigger broadcast using saved info
        const guestInfo = JSON.parse(savedGuest);
        setPendingAction({ type: 'enquiry', rate: null });
        setLoading(true);
        const broadcastPayload = {
          fromLocation: searchPayload.fromLocation,
          toLocation: searchPayload.toLocation,
          type: searchPayload.type,
          category: queryDetails.airCategory,
          airline: queryDetails.airAirline,
          weightRange: queryDetails.weight,
          truckLoad: queryDetails.loadType,
          vehicleType: queryDetails.vehicleType,
          handlingType: queryDetails.handlingType || 'General Cargo',
          additionalServices: queryDetails.additionalServices || '',
          deliverySpeed: '3-5',
          price: null,
          vendor: null,
          isDirect: true,
          isBooking: !!(user && user.role === 'vendor'),
          ...guestInfo
        };
        createEnquiry(broadcastPayload)
          .then(() => {
            setSuccess(true);
          })
          .catch(err => {
            console.error(err);
            setError("Failed to broadcast enquiry.");
          })
          .finally(() => setLoading(false));
      } else {
        // Guest user: Prompt for details to raise broadcast
        setPendingAction({ type: 'enquiry', rate: null });
        setIsGuestModalOpen(true);
      }
    }
  }, [state]);

  const handleAutoBroadcast = async () => {
    setLoading(true);
    setError(null);
    try {
      const broadcastPayload = {
        fromLocation: searchPayload.fromLocation,
        toLocation: searchPayload.toLocation,
        type: searchPayload.type,
        category: queryDetails.airCategory,
        airline: queryDetails.airAirline,
        weightRange: queryDetails.weight,
        truckLoad: queryDetails.loadType,
        vehicleType: queryDetails.vehicleType,
        handlingType: queryDetails.handlingType || 'General Cargo',
        additionalServices: queryDetails.additionalServices || '',
        deliverySpeed: '3-5',
        price: null,
        vendor: null,
        isDirect: true,
        isBooking: !!(user && user.role === 'vendor')
      };
      await createEnquiry(broadcastPayload);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to broadcast enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (actionType, rate) => {
    setPendingAction({ type: actionType, rate });
    setIsGuestModalOpen(true);
  };

  const executeEnquiryFlow = async (actionType, rate, guestInfo = null) => {
    setLoading(true);
    setError(null);

    const isBooking = !!(user && user.role === 'vendor');

    // 1. Primary Payload targeted specifically to this vendor
    const primaryPayload = {
      fromLocation: searchPayload.fromLocation,
      toLocation: searchPayload.toLocation,
      type: searchPayload.type,
      category: queryDetails.airCategory,
      airline: queryDetails.airAirline,
      weightRange: queryDetails.weight,
      truckLoad: queryDetails.loadType,
      vehicleType: queryDetails.vehicleType,
      handlingType: queryDetails.handlingType || 'General Cargo',
      additionalServices: queryDetails.additionalServices || '',
      deliverySpeed: rate ? rate.deliverySpeed : '3-5',
      price: rate ? rate.price : null,
      vendor: rate ? rate.vendor._id : null,
      isDirect: false, // Targeted matched enquiry
      isBooking: isBooking,
      message: messageInput,
      clientCreditRequired,
      ...(guestInfo || {})
    };

    // 2. Broadcast Payload sent to all other vendors (Direct Enquiry)
    const broadcastPayload = {
      fromLocation: searchPayload.fromLocation,
      toLocation: searchPayload.toLocation,
      type: searchPayload.type,
      category: queryDetails.airCategory,
      airline: queryDetails.airAirline,
      weightRange: queryDetails.weight,
      truckLoad: queryDetails.loadType,
      vehicleType: queryDetails.vehicleType,
      handlingType: queryDetails.handlingType || 'General Cargo',
      additionalServices: queryDetails.additionalServices || '',
      deliverySpeed: '3-5',
      price: null,
      vendor: null,
      isDirect: true, // Public broadcast direct enquiry
      isBooking: isBooking,
      message: messageInput,
      clientCreditRequired,
      excludedVendor: rate ? rate.vendor._id : null,
      ...(guestInfo || {})
    };

    try {
      // Trigger targeted enquiry
      await createEnquiry(primaryPayload);
      
      setSuccess(true);
      setIsGuestModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!guestEmail || !guestPhone) return;

    const guestInfo = {
      guestName: guestCompany,
      guestCompany,
      guestEmail,
      guestPhone: `${guestPhoneCode}${guestPhone}`,
      commodity: guestCommodity
    };

    // Cache guest details in localStorage only if not logged in
    if (!user) {
      localStorage.setItem('guestInfo', JSON.stringify(guestInfo));
    }

    if (pendingAction && pendingAction.rate) {
      // Execute targeted + broadcast flow
      executeEnquiryFlow(pendingAction.type, pendingAction.rate, guestInfo);
    } else {
      // Auto broadcast flow
      setLoading(true);
      const isBooking = !!(user && user.role === 'vendor');
      const broadcastPayload = {
        fromLocation: searchPayload.fromLocation,
        toLocation: searchPayload.toLocation,
        type: searchPayload.type,
        category: queryDetails.airCategory,
        airline: queryDetails.airAirline,
        weightRange: queryDetails.weight,
        truckLoad: queryDetails.loadType,
        vehicleType: queryDetails.vehicleType,
        handlingType: queryDetails.handlingType || 'General Cargo',
        additionalServices: queryDetails.additionalServices || '',
        deliverySpeed: '3-5',
        price: null,
        vendor: null,
        isDirect: true,
        isBooking: isBooking,
        message: messageInput,
        clientCreditRequired,
        ...guestInfo
      };
      createEnquiry(broadcastPayload)
        .then(() => {
          setSuccess(true);
          setIsGuestModalOpen(false);
        })
        .catch(err => {
          console.error(err);
          setError("Failed to broadcast enquiry.");
        })
        .finally(() => setLoading(false));
    }
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

  if (!state) return null;

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 font-sans py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Back navigation bar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-all text-slate-600 cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Back to search</span>
        </div>

        {/* Route Details Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgba(11,30,67,0.015)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0066FF]/5 flex items-center justify-center shrink-0 border border-[#0066FF]/10 shadow-sm">
              {getFreightIcon(searchPayload.type)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-[#0066FF] uppercase tracking-wider">
                <span>{searchPayload.type} Freight</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{queryDetails.airCategory || queryDetails.storageType || 'General Cargo'}</span>
              </div>
              <h2 className="text-base font-extrabold text-[#0B1E43] tracking-tight mt-0.5 flex flex-wrap items-center gap-2">
                <span>{searchPayload.fromLocation}</span>
                <span className="text-[#0066FF]">↔</span>
                <span>{searchPayload.toLocation}</span>
              </h2>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {queryDetails.weight && (
              <span className="bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600">
                Weight: {queryDetails.weight}
              </span>
            )}
            {queryDetails.loadType && (
              <span className="bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600">
                Load: {queryDetails.loadType}
              </span>
            )}
            {queryDetails.vehicleType && (
              <span className="bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600">
                Vehicle: {queryDetails.vehicleType}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 shadow-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* LOADING & SUCCESS STATES */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] space-y-4 max-w-lg mx-auto">
            <Loader2 className="animate-spin text-[#0066FF] w-8 h-8 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Processing Shipment Request...</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">Connecting with providers and publishing details to matches.</p>
          </div>
        ) : success ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.02)] space-y-6 max-w-md mx-auto animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-inner mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-base">
                {pendingAction?.type === 'book' ? 'Booking Request Raised Successfully!' : 'Enquiry Raised Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {pendingAction?.type === 'book' 
                  ? 'Your booking request has been submitted successfully. The cargo operator will coordinate transit details shortly.'
                  : 'Your cargo details have been successfully matched. The selected vendor has been notified directly, and our network of logistics operators is bidding on your request.'}
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link 
                to={user ? (user.role === 'customer' ? '/customer' : '/vendor') : '/'} 
                className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md shadow-[#0066FF]/10 text-center"
              >
                {user ? 'Go to Dashboard' : 'Go to Home'}
              </Link>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          /* COMPARISON RATE CARDS LIST */
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-[#0066FF]" /> Matched Vendor Rates
              </h3>
              <span className="text-xs text-slate-400 font-bold">{searchResults.length} Match(es) found</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {searchResults.map((rate) => {
                  const validityDate = formatDate(rate.validUntil);
                  const displayCurrency = rate.currency === 'USD' ? '$' : rate.currency === 'EUR' ? '€' : rate.currency === 'GBP' ? '£' : rate.currency === 'AED' ? 'د.إ' : '₹';
                  
                  return (
                    <div 
                      key={rate._id} 
                      className="bg-white border border-slate-100 hover:border-blue-500/20 hover:shadow-[0_20px_40px_rgba(11,30,67,0.06)] rounded-2xl p-6 transition-all duration-300 relative shadow-[0_8px_30px_rgba(11,30,67,0.015)] hover:-translate-y-0.5"
                    >
                      {/* Top Row: Route & Specs */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        {/* Left: Route info */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center shrink-0 shadow-sm">
                            {getFreightIcon(rate.type)}
                          </div>
                                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition-all duration-200">
                              <MapPin size={13} className="text-[#0066FF]" />
                              <span className="text-xs font-extrabold text-[#0B1E43]">{rate.fromLocation}</span>
                            </div>
                            <div className="flex flex-col items-center shrink-0">
                              <span className="text-[#0066FF] font-black text-lg leading-none tracking-widest">→</span>
                            </div>
                            <div className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition-all duration-200">
                              <MapPin size={13} className="text-[#0066FF]" />
                              <span className="text-xs font-extrabold text-[#0B1E43]">{rate.toLocation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Specs Badges */}
                        <div className="flex flex-wrap gap-2.5 items-center">
                          <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-center min-w-[90px] shadow-sm">
                            <div className="text-[9px] text-blue-705 font-black uppercase tracking-wider">Container / Size</div>
                            <div className="text-xs font-black text-slate-900 mt-0.5">{rate.vehicleType || rate.fclStandard || '40 FT'}</div>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-center min-w-[90px] shadow-sm">
                            <div className="text-[9px] text-indigo-700 font-black uppercase tracking-wider">Load Type</div>
                            <div className="text-xs font-black text-slate-900 mt-0.5">{rate.truckLoad || rate.seaLoadType || 'FCL'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section: Company & Details & Price */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
                        {/* Left & Middle: Company details & notes (9 cols) */}
                        <div className="lg:col-span-9 space-y-4">
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-sm font-black text-[#0B1E43] tracking-wide uppercase">
                              {rate.vendor?.company || rate.vendor?.name}
                            </h4>
                            {rate.vendor?.activePlan && typeof rate.vendor.activePlan === 'object' && rate.vendor.activePlan.price > 0 && rate.vendor?.planEndDate && new Date(rate.vendor.planEndDate) > new Date() && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-2.5 py-1 rounded-md border border-emerald-300 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                Verified Vendor
                              </span>
                            )}
                          </div>

                          {/* Technical details tags */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                              <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Transit Speed</span>
                              <span className="text-xs font-extrabold text-[#0066FF] mt-0.5">{rate.deliverySpeed} Days</span>
                            </div>
                            
                            {rate.type === 'sea' && (
                              <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Shipping Line</span>
                                <span className="text-xs font-extrabold text-slate-905 mt-0.5 truncate">{rate.airline || 'NVOCC'}</span>
                              </div>
                            )}

                            {rate.type === 'air' && (
                              <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Airline</span>
                                <span className="text-xs font-extrabold text-slate-905 mt-0.5 truncate">{rate.airline || 'Any'}</span>
                              </div>
                            )}

                            {rate.weightRange && (
                              <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Weight Range</span>
                                <span className="text-xs font-extrabold text-slate-905 mt-0.5">{rate.weightRange}</span>
                              </div>
                            )}

                            {rate.handlingType && (
                              <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                                <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Handling Type</span>
                                <span className="text-xs font-extrabold text-slate-905 mt-0.5 truncate">{rate.handlingType}</span>
                              </div>
                            )}

                            {/* {rate.additionalServices && (
                              <div className="bg-[#f4f7fc] border border-slate-200 rounded-xl p-3 flex flex-col justify-center col-span-2 sm:col-span-1">
                                <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider">Addl. Services</span>
                                <span className="text-xs font-extrabold text-slate-905 mt-0.5 truncate">{rate.additionalServices}</span>
                              </div>
                            )} */}
                          </div>

                          {/* Beautiful Note Panel */}
                          <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-[10px] text-slate-700 font-bold leading-relaxed flex items-start gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.005)]">
                            <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Note</span>
                            <span>Local and other charges (if applicable) will be at actual basis as per the shipping lines norms. {rate.message && <span className="font-bold text-slate-800">| {rate.message}</span>}</span>
                          </div>
                        </div>

                        {/* Right side: Price Box & Connect Button (3 cols) */}
                        <div className="lg:col-span-3 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 lg:pl-6 lg:border-l lg:border-slate-150 w-full lg:w-auto h-full min-h-[120px]">
                          {/* Price Box */}
                          <div className="text-left lg:text-center w-full">
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Freight Cost</div>
                            <div className="text-2xl font-black text-slate-800 mt-0.5 flex flex-wrap items-baseline justify-start lg:justify-center gap-1">
                              <span className="text-lg font-black text-[#0066FF]">{displayCurrency}</span>
                              <span>{rate.price.toLocaleString()}</span>
                              {searchPayload.fclStandard ? (
                                rate.ihcPrice && (
                                  <span className="text-xs font-bold text-slate-500 block lg:inline-block mt-0.5">
                                    + Approx. IHC ({rate.ihcContainerSize || '20ft'}): ₹{rate.ihcPrice.toLocaleString('en-IN')}
                                  </span>
                                )
                              ) : (
                                rate.ihcRates && rate.ihcRates.length > 0 ? (
                                  rate.ihcRates.map((ihc, idx) => (
                                    <span key={idx} className="text-[11px] font-bold text-slate-550 block mt-0.5">
                                      + Approx. IHC ({ihc.containerSize}): ₹{ihc.ihcPrice.toLocaleString('en-IN')}
                                    </span>
                                  ))
                                ) : (
                                  rate.ihcPrice && (
                                    <span className="text-xs font-bold text-slate-500 block lg:inline-block mt-0.5">
                                      + Approx. IHC ({rate.ihcContainerSize || '20ft'}): ₹{rate.ihcPrice.toLocaleString('en-IN')}
                                    </span>
                                  )
                                )
                              )}
                            </div>
                            <div className="text-[8.5px] text-slate-500 font-black mt-0.5">Excl. local port duties</div>
                          </div>

                          {/* Connect Button */}
                          <button
                            onClick={() => handleAction('book', rate)}
                            disabled={loading}
                            className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white text-xs font-black py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider disabled:opacity-55 disabled:cursor-not-allowed text-center"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            {/* Contact Support Info */}
            <div className="text-center pt-8 border-t border-slate-100 max-w-md mx-auto space-y-1">
              <p className="text-xs font-bold text-slate-400">
                For urgent shipments or any query, please contact:
              </p>
              <a 
                href="mailto:info@logisticsscanner.com" 
                className="inline-block text-xs font-black text-[#0066FF] hover:underline"
              >
                info@logisticsscanner.com
              </a>
            </div>
          </div>
        ) : (
          /* NO RATES MATCHED PLACEHOLDER */
          user?.role === 'vendor' ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.015)] space-y-4 max-w-lg mx-auto">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">No matching rates found</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                No matching rates were found for this route. Since you are logged in as a Vendor, you can manually broadcast this enquiry to other cargo carriers in our network.
              </p>
              <button
                type="button"
                onClick={handleAutoBroadcast}
                className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md mt-4 cursor-pointer"
              >
                Send Enquiry
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_12px_45px_rgba(11,30,67,0.015)] space-y-4 max-w-lg mx-auto">
              <Loader2 className="animate-spin text-[#0066FF] w-8 h-8 mx-auto" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">No matching rates found</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Auto-broadcasting your enquiry to all our verified cargo carriers. You will receive quotes on your email/phone shortly.
              </p>
            </div>
          )
        )}

      </div>

      {/* GUEST INFO MODAL */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-150 overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-[#0B1E43] tracking-tight">
                  {pendingAction?.rate ? `Confirm ${pendingAction.type === 'book' ? 'Booking' : 'Enquiry'}` : 'Request Freight Quote'}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {pendingAction?.rate ? `with ${pendingAction.rate.vendor?.company || pendingAction.rate.vendor?.name}` : 'Please provide your details to proceed'}
                </p>
              </div>
              <button
                onClick={() => { setIsGuestModalOpen(false); setPendingAction(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              if (user) {
                e.preventDefault();
                const dummyGuestInfo = {
                  guestName: user.name || '',
                  guestCompany: user.company || '',
                  guestEmail: user.email || '',
                  guestPhone: user.phone || '',
                  commodity: guestCommodity
                };
                if (pendingAction && pendingAction.rate) {
                  executeEnquiryFlow(pendingAction.type, pendingAction.rate, dummyGuestInfo);
                }
              } else {
                handleGuestSubmit(e);
              }
            }} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {pendingAction?.rate && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs font-black text-[#0B1E43]">Quoted Rate</span>
                    <span className="text-xs font-black text-[#0066FF]">{pendingAction.rate.currency === 'USD' ? '$' : pendingAction.rate.currency === 'EUR' ? '€' : pendingAction.rate.currency === 'GBP' ? '£' : pendingAction.rate.currency === 'AED' ? 'د.إ' : '₹'} {pendingAction.rate.price.toLocaleString()} {pendingAction.rate.type === 'sea' ? 'per container' : (pendingAction.rate.type === 'air' ? 'per kg' : '')}</span>
                  </div>
                  {pendingAction.rate.message && (
                    <p className="text-[10px] text-slate-600 font-medium pt-1 border-t border-blue-100/50">
                      <span className="font-bold">Vendor Note:</span> {pendingAction.rate.message}
                    </p>
                  )}
                </div>
              )}

              {/* Message Details */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <FileText size={11} className="text-slate-400" /> Message / Additional Details
                </label>
                <textarea
                  placeholder="Provide any specific requirements or details..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  rows={2}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all resize-none"
                />
              </div>

              {/* Commodity Details */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Package size={11} className="text-slate-400" /> Commodity Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machinery, Electronics"
                  value={guestCommodity}
                  onChange={(e) => setGuestCommodity(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                  required
                />
              </div>

              {user?.role === 'vendor' && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 mt-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Credit Required</h4>
                    <p className="text-[10px] font-medium text-slate-500">Do you require a credit line for this enquiry?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="creditRequiredCheckbox"
                      checked={clientCreditRequired}
                      onChange={handleCreditToggle}
                      className="w-4.5 h-4.5 text-[#0066FF] bg-slate-100 border-slate-350 rounded focus:ring-[#0066FF] cursor-pointer"
                    />
                    <label htmlFor="creditRequiredCheckbox" className="text-xs font-black text-slate-800 cursor-pointer">
                      {clientCreditRequired ? 'Yes' : 'No'}
                    </label>
                  </div>
                </div>
              )}

              {!user && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black text-[#0066FF] uppercase tracking-wider">Contact Information</span>
                  </div>
                  {/* Organization Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Building size={11} className="text-slate-400" /> Organization / Client Name
                </label>
                <input
                  type="text"
                  placeholder="Enter organization or client name"
                  value={guestCompany}
                  onChange={(e) => setGuestCompany(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                  required
                />
              </div>

              {/* Commodity Details */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <FileText size={11} className="text-slate-400" /> Commodity Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machinery, Electronics"
                  value={guestCommodity}
                  onChange={(e) => setGuestCommodity(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                  required
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={11} className="text-slate-400" /> Mobile Number
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={guestPhoneCode === 'Others' || !COUNTRIES.some(c => c.code === guestPhoneCode) ? 'Others' : guestPhoneCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Others') {
                          setGuestPhoneCode('');
                        } else {
                          setGuestPhoneCode(val);
                        }
                      }}
                      className="bg-[#f4f7fc] border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] cursor-pointer max-w-[150px]"
                    >
                      {COUNTRIES.map((item, idx) => (
                        <option key={idx} value={item.code || 'Others'}>
                          {item.name} {item.code ? `(${item.code})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="Mobile phone number"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="flex-1 bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                      required
                    />
                  </div>
                  {(guestPhoneCode === 'Others' || !COUNTRIES.some(c => c.code === guestPhoneCode && c.name !== 'Others')) && (
                    <input
                      type="text"
                      placeholder="Enter custom country code (e.g. +506)"
                      value={guestPhoneCode}
                      onChange={(e) => setGuestPhoneCode(e.target.value)}
                      className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={11} className="text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full bg-[#f4f7fc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#0066FF] transition-all"
                  required
                />
              </div>

                </>
              )}

              <p className="text-[10px] text-slate-450 font-bold leading-normal pt-2">
                By submitting this request, you agree to let logistics scanner partners contact you with pricing quotes.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-extrabold py-3.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-[#0066FF]/10 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Submit Details & Raise Enquiry</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {showWalletAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-150 p-6 space-y-6 text-center animate-scaleUp">
            {walletAlertStep === 1 ? (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="text-red-600 w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-wider">Wallet Not Approved</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    Your wallet is not approved. Please contact your finance manager.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWalletAlertStep(2)}
                  className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Coins className="text-[#0066FF] w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[#0B1E43] uppercase tracking-wider">Request Wallet Limit</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                    Do you want to request a wallet limit, or do you want to proceed without checking it?
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWalletAlertModal(false);
                      setClientCreditRequired(false);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Proceed Without Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWalletAlertModal(false);
                      navigate('/vendor/finance');
                    }}
                    className="flex-1 bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Submit Your Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
