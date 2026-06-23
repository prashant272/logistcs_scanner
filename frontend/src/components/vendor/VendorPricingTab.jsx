import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Calendar, DollarSign, Clock, Tag, Edit } from 'lucide-react';
import { usePricing } from '../../services/PricingService';
import { useLocations } from '../../services/LocationService';

const AIRLINES_DOMESTIC = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Akasa Air'];
const AIRLINES_INTERNATIONAL = ['Emirates', 'Qatar Airways', 'Singapore Airlines', 'British Airways', 'Lufthansa', 'Delta Air Lines', 'Etihad Airways'];

const VendorPricingTab = () => {
  const {
    rates,
    loading,
    fetchRates,
    addRate,
    toggleRateStatus,
    deleteRate,
    updateRate
  } = usePricing();

  const { getSuggestions, fetchLocations } = useLocations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState(null);
  const [error, setError] = useState('');

  // Warehouse specific states
  const [warehouseCountry, setWarehouseCountry] = useState('');
  const [warehouseState, setWarehouseState] = useState('');
  const [warehouseCity, setWarehouseCity] = useState('');
  const [warehouseLocationsData, setWarehouseLocationsData] = useState([]);

  // Autocomplete Suggestion States
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'from', 'to'
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Form Fields
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [type, setType] = useState('air');
  const [category, setCategory] = useState('domestic');
  const [airline, setAirline] = useState('');
  const [weightRange, setWeightRange] = useState('');
  const [truckLoad, setTruckLoad] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [seaLoadType, setSeaLoadType] = useState('');
  const [fclStandard, setFclStandard] = useState('');
  const [warehouseRateType, setWarehouseRateType] = useState('');
  const [warehouseStorageType, setWarehouseStorageType] = useState('');
  const [chaServiceType, setChaServiceType] = useState('Air');
  const [chaCargoType, setChaCargoType] = useState('');
  const [handlingType, setHandlingType] = useState('');
  const [additionalServices, setAdditionalServices] = useState('');
  const [deliverySpeed, setDeliverySpeed] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [message, setMessage] = useState('');
  
  const [currentTab, setCurrentTab] = useState('active'); // 'active' or 'expired'

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (type === 'warehouse' && isModalOpen && warehouseLocationsData.length === 0) {
      fetchLocations(1, 1000, '', 'Warehouse').then(data => {
        if (data && data.locations) {
          setWarehouseLocationsData(data.locations);
        }
      }).catch(err => console.error('Error loading warehouse locations:', err));
    }
  }, [type, isModalOpen]);

  const fetchSuggestions = async (query, inputType) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      let typeParam = '';
      if (type === 'air') typeParam = 'Airport';
      else if (type === 'sea') typeParam = 'Seaport';
      else if (type === 'land') typeParam = 'Land Port';
      else if (type === 'warehouse') typeParam = 'Warehouse';
      else if (type === 'cha') typeParam = 'Seaport,Airport';

      const locations = await getSuggestions(query, typeParam);
      setSuggestions(locations || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    let activeQuery = '';
    if (activeInput === 'from') activeQuery = fromLocation;
    else if (activeInput === 'to') activeQuery = toLocation;

    if (!activeQuery || activeQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchSuggestions(activeQuery, activeInput);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fromLocation, toLocation, activeInput]);

  const handleSelectSuggestion = (loc, inputType) => {
    const value = loc.code ? `${loc.city} (${loc.code})` : loc.city;
    if (inputType === 'from') {
      setFromLocation(value);
    } else if (inputType === 'to') {
      setToLocation(value);
    }
    setSuggestions([]);
    setActiveInput(null);
  };

  const renderSuggestions = (inputType) => {
    if (activeInput !== inputType || suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto w-full suggestions-scrollbar">
        {suggestions.map((loc) => (
          <div
            key={loc._id}
            onMouseDown={() => handleSelectSuggestion(loc, inputType)}
            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-left transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-bold text-slate-800 truncate">
                {loc.city}, {loc.country}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {loc.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {loc.code && (
                <span className="bg-[#0066FF]/10 text-[#0066FF] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-[#0066FF]/20">
                  {loc.code}
                </span>
              )}
              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                {loc.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleRateStatus(id);
    } catch (err) {
      console.error('Error toggling pricing status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing rate?')) return;
    try {
      await deleteRate(id);
    } catch (err) {
      console.error('Error deleting pricing:', err);
    }
  };

  const handleEditClick = (rate) => {
    setFromLocation(rate.fromLocation);
    setToLocation(rate.toLocation);
    setType(rate.type);
    setCategory(rate.category || 'domestic');
    setAirline(rate.airline || '');
    setWeightRange(rate.weightRange || '');
    setTruckLoad(rate.truckLoad || '');
    setVehicleType(rate.vehicleType || '');
    setSeaLoadType(rate.seaLoadType || '');
    setFclStandard(rate.fclStandard || '');
    setWarehouseRateType(rate.warehouseRateType || '');
    setWarehouseStorageType(rate.warehouseStorageType || '');
    setChaServiceType(rate.chaServiceType || 'Air');
    setChaCargoType(rate.chaCargoType || '');
    setHandlingType(rate.handlingType || '');
    setAdditionalServices(rate.additionalServices || '');
    setDeliverySpeed(rate.deliverySpeed || '');
    
    // Format validUntil date correctly for HTML input type="date"
    const dateStr = new Date(rate.validUntil).toISOString().split('T')[0];
    setValidUntil(dateStr);
    
    setPrice(rate.price);
    setCurrency(rate.currency || 'INR');
    setMessage(rate.message || '');
    setEditingRateId(rate._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let finalFromLocation = fromLocation;
    let finalToLocation = toLocation;
    
    if (type === 'warehouse') {
      finalToLocation = 'Warehouse';
      finalFromLocation = warehouseCity;
      if (!warehouseCountry || !warehouseState || !warehouseCity) {
        setError('Please select Country, State, and City for Warehouse Location');
        return;
      }
    } else if (type === 'cha') {
      finalToLocation = 'Customs Port';
    }

    if (!finalFromLocation || !finalToLocation || !type || !deliverySpeed || !validUntil || !price) {
      setError('Please fill in all required fields');
      return;
    }

    const payload = {
      fromLocation: finalFromLocation,
      toLocation: finalToLocation,
      type,
      category,
      airline,
      weightRange,
      truckLoad,
      vehicleType,
      seaLoadType,
      fclStandard,
      warehouseRateType,
      warehouseStorageType,
      chaServiceType,
      chaCargoType,
      handlingType,
      additionalServices,
      deliverySpeed,
      validUntil,
      price: Number(price),
      currency,
      message
    };

    try {
      if (editingRateId) {
        await updateRate(editingRateId, payload);
      } else {
        await addRate(payload);
      }
      setIsModalOpen(false);
      setEditingRateId(null);
      resetForm();
      fetchRates();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving rate');
    }
  };

  const resetForm = () => {
    setFromLocation('');
    setToLocation('');
    setType('air');
    setCategory('domestic');
    setAirline('');
    setWeightRange('');
    setTruckLoad('');
    setVehicleType('');
    setSeaLoadType('');
    setFclStandard('');
    setWarehouseRateType('');
    setWarehouseStorageType('');
    setChaServiceType('Air');
    setChaCargoType('');
    setHandlingType('');
    setAdditionalServices('');
    setDeliverySpeed('');
    setValidUntil('');
    setPrice('');
    setCurrency('INR');
    setMessage('');
    setError('');
  };

  // Reset category-specific fields when transport type changes
  useEffect(() => {
    setAirline('');
    setWeightRange('');
    setTruckLoad('');
    setVehicleType('');
  }, [type]);

  // Reset airlines when category (domestic/international) changes
  useEffect(() => {
    setAirline('');
  }, [category]);

  const airlinesOptions = category === 'domestic' ? AIRLINES_DOMESTIC : AIRLINES_INTERNATIONAL;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_12px_40px_rgba(11,30,67,0.03)] space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-base font-black text-[#0B1E43] tracking-tight">My Pricing & Rates</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Configure shipment rates for modes, routes, and carriers</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-[#0066FF]/10 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.5} /> Add Pricing Rate
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-100">
        <button
          onClick={() => setCurrentTab('active')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            currentTab === 'active'
              ? 'border-[#0066FF] text-[#0066FF]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Active Rates
        </button>
        <button
          onClick={() => setCurrentTab('expired')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            currentTab === 'expired'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Expired Rates
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 font-bold text-xs uppercase tracking-wider">Loading Rates...</div>
      ) : (
        (() => {
          const today = new Date();
          today.setHours(0,0,0,0);
          
          const activeRates = rates.filter(r => new Date(r.validUntil) >= today);
          const expiredRates = rates.filter(r => new Date(r.validUntil) < today);
          
          const displayRates = currentTab === 'active' ? activeRates : expiredRates;

          if (displayRates.length === 0) {
            return (
              <div className="text-center py-10 text-slate-400 font-medium text-xs">
                {currentTab === 'active' ? 'No active rates.' : 'No expired rates.'}
              </div>
            );
          }

          return (
        <div className="overflow-x-auto rounded-2xl border border-slate-100/85">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#f4f7fc] text-[#0B1E43] text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Route</th>
                <th className="p-4">Type</th>
                <th className="p-4">Details</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4">Rate</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayRates.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-black text-slate-800 uppercase">
                    {r.fromLocation} ↔ {r.toLocation}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0066FF] border border-blue-100/50">
                      {r.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-500 max-w-[250px] truncate">
                    {r.type === 'air' && (
                      <span className="space-y-0.5 block">
                        <span className="block text-slate-800 font-bold">{r.airline || 'Any Airline'} ({r.category})</span>
                        <span className="block text-[10px]">Weight: {r.weightRange || 'N/A'} | Handling: {r.handlingType || 'N/A'}</span>
                      </span>
                    )}
                    {r.type === 'land' && (
                      <span className="space-y-0.5 block">
                        <span className="block text-slate-800 font-bold">{r.vehicleType || 'Any Truck'}</span>
                        <span className="block text-[10px]">Load: {r.truckLoad || 'N/A'} | Speed: {r.deliverySpeed} days</span>
                      </span>
                    )}
                    {r.type !== 'air' && r.type !== 'land' && (
                      <span>Speed: {r.deliverySpeed} days | Handling: {r.handlingType || 'N/A'}</span>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-400">
                    {new Date(r.validUntil).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-black text-[#0066FF] text-sm">
                    {r.currency === 'USD' ? '$' : r.currency === 'EUR' ? '€' : r.currency === 'GBP' ? '£' : r.currency === 'AED' ? 'د.إ' : '₹'} {r.price.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(r._id)}
                      className="focus:outline-none cursor-pointer"
                      title={r.status === 'active' ? 'Disable Rate' : 'Enable Rate'}
                    >
                      {r.status === 'active' ? (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">
                          <ToggleRight size={20} className="text-green-500" />
                          <span className="text-[9px] font-bold uppercase">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                          <ToggleLeft size={20} className="text-slate-400" />
                          <span className="text-[9px] font-bold uppercase">Disabled</span>
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(r)}
                      className="text-blue-500 hover:text-blue-700 font-bold transition-colors cursor-pointer"
                      title="Edit Rate"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-500 hover:text-red-700 font-bold transition-colors cursor-pointer"
                      title="Delete Rate"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          );
        })()
      )}

      {/* Add Rate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-[#0B1E43] tracking-tight">{editingRateId ? 'Edit Pricing Rate' : 'Add New Pricing Rate'}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{editingRateId ? 'Update details for this transport rate' : 'Enter route details and transport pricing'}</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setEditingRateId(null); }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3.5 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Freight Type and Handling Type (Moved to top) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Freight Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setFromLocation('');
                      setToLocation('');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="air">Air Freight</option>
                    <option value="sea">Ocean Freight</option>
                    <option value="land">Road Freight</option>
                    <option value="warehouse">Warehousing</option>
                    <option value="cha">Customs Clearance (CHA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Handling Type</label>
                  <select
                    value={handlingType}
                    onChange={(e) => setHandlingType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="">Select Handling Type</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Hazardous Goods">Hazardous Goods</option>
                    <option value="Perishable Goods">Perishable Goods</option>
                    <option value="Fragile Items">Fragile Items</option>
                    <option value="Valuables">Valuables</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Location Details */}
              <div className={`grid ${['warehouse', 'cha'].includes(type) ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                <div className="space-y-1 relative">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">
                    {type === 'air' && 'Origin Airport'}
                    {type === 'sea' && 'Origin Port'}
                    {type === 'land' && 'Origin City'}
                    {type === 'warehouse' && 'Warehouse Location'}
                    {type === 'cha' && 'Port / Airport Location'}
                  </label>
                  {type === 'warehouse' ? (
                    <div className="flex gap-2">
                      <select
                        value={warehouseCountry}
                        onChange={(e) => {
                          setWarehouseCountry(e.target.value);
                          setWarehouseState('');
                          setWarehouseCity('');
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        required
                      >
                        <option value="">Country</option>
                        {[...new Set(warehouseLocationsData.map(loc => loc.country))].filter(Boolean).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={warehouseState}
                        onChange={(e) => {
                          setWarehouseState(e.target.value);
                          setWarehouseCity('');
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        required
                        disabled={!warehouseCountry}
                      >
                        <option value="">State</option>
                        {[...new Set(warehouseLocationsData.filter(loc => loc.country === warehouseCountry).map(loc => loc.state))].filter(Boolean).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <select
                        value={warehouseCity}
                        onChange={(e) => setWarehouseCity(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-[11px] font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        required
                        disabled={!warehouseState}
                      >
                        <option value="">City</option>
                        {[...new Set(warehouseLocationsData.filter(loc => loc.state === warehouseState).map(loc => loc.city))].filter(Boolean).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={
                          type === 'air' ? 'e.g. DEL (Delhi Airport)' :
                          type === 'sea' ? 'e.g. INNSA (Nhava Sheva)' :
                          type === 'cha' ? 'Enter Port/Airport' :
                          'Origin City (e.g. Delhi)'
                        }
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        onFocus={() => setActiveInput('from')}
                        onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                        required
                      />
                      {renderSuggestions('from')}
                    </>
                  )}
                </div>
                
                {!['warehouse', 'cha'].includes(type) && (
                  <div className="space-y-1 relative">
                    <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">
                      {type === 'air' && 'Destination Airport'}
                      {type === 'sea' && 'Destination Port'}
                      {type === 'land' && 'Destination City'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        type === 'air' ? 'e.g. LHR (London Heathrow)' :
                        type === 'sea' ? 'e.g. USNYC (New York)' :
                        'Destination City (e.g. Mumbai)'
                      }
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      onFocus={() => setActiveInput('to')}
                      onBlur={() => setTimeout(() => setActiveInput(null), 200)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] transition-all"
                      required
                    />
                    {renderSuggestions('to')}
                  </div>
                )}
              </div>

              {/* Dynamic Option Fields for AIR */}
              {type === 'air' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] block border-b border-slate-200/60 pb-1">Air Freight Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">International / Domestic</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Airline</label>
                      <select
                        value={airline}
                        onChange={(e) => setAirline(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Airline</option>
                        {airlinesOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Weight Range</label>
                    <select
                      value={weightRange}
                      onChange={(e) => setWeightRange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    >
                      <option value="">Select Weight Range</option>
                      <option value="0-50">0 - 50 kg</option>
                      <option value="50-100">50 - 100 kg</option>
                      <option value="100-500">100 - 500 kg</option>
                      <option value="500+">500+ kg</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dynamic Option Fields for LAND */}
              {type === 'land' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] block border-b border-slate-200/60 pb-1">Road Freight Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Truck Load</label>
                      <select
                        value={truckLoad}
                        onChange={(e) => setTruckLoad(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Truck Load</option>
                        <option value="PTL">Part Truck Load (PTL)</option>
                        <option value="FTL">Full Truck Load (FTL)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Vehicle Type</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Vehicle Type</option>
                        <option value="Open Body Truck">Open Body Truck</option>
                        <option value="Closed Container">Closed Container</option>
                        <option value="Flatbed Trailer">Flatbed Trailer</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Option Fields for SEA */}
              {type === 'sea' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] block border-b border-slate-200/60 pb-1">Ocean Freight Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Load Type</label>
                      <select
                        value={seaLoadType}
                        onChange={(e) => setSeaLoadType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Load Type</option>
                        <option value="LCL">Less Container Load (LCL)</option>
                        <option value="FCL">Full Container Load (FCL)</option>
                      </select>
                    </div>

                    {seaLoadType === 'FCL' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Container Size</label>
                        <select
                          value={fclStandard}
                          onChange={(e) => setFclStandard(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        >
                          <option value="">Select Standard</option>
                          <option value="20ft">20ft Standard</option>
                          <option value="40ft">40ft Standard</option>
                          <option value="40ft HC">40ft High Cube</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Option Fields for WAREHOUSE */}
              {type === 'warehouse' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] block border-b border-slate-200/60 pb-1">Warehouse Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Rate Type</label>
                      <select
                        value={warehouseRateType}
                        onChange={(e) => setWarehouseRateType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Rate Type</option>
                        <option value="Per Month">Per Month</option>
                        <option value="Per Day">Per Day</option>
                        <option value="Per Week">Per Week</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Storage Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Storage Type</label>
                      <select
                        value={warehouseStorageType}
                        onChange={(e) => setWarehouseStorageType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Storage Type</option>
                        <option value="General">General Warehousing</option>
                        <option value="Cold">Cold Storage</option>
                        <option value="Bonded">Bonded Warehouse</option>
                        <option value="Private">Private Warehouse</option>
                        <option value="Custom">Custom Warehouse</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Option Fields for CHA */}
              {type === 'cha' && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] block border-b border-slate-200/60 pb-1">Customs Clearance Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Service Type</label>
                      <select
                        value={chaServiceType}
                        onChange={(e) => setChaServiceType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="Air">Air</option>
                        <option value="Sea">Sea</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Clearance Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="domestic">Domestic</option>
                        <option value="international">International</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Cargo Type</label>
                      <select
                        value={chaCargoType}
                        onChange={(e) => setChaCargoType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                      >
                        <option value="">Select Type</option>
                        <option value="Import">Import</option>
                        <option value="Export">Export</option>
                        <option value="Customs Clearing">Customs Clearing</option>
                        <option value="Import Duty Clearance">Import Duty Clearance</option>
                        <option value="Export Documentation">Export Documentation</option>
                      </select>
                    </div>

                    {chaServiceType === 'Air' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Weight Range</label>
                        <select
                          value={weightRange}
                          onChange={(e) => setWeightRange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        >
                          <option value="">Select Weight Range</option>
                          <option value="0-50">0 - 50 kg</option>
                          <option value="50-100">50 - 100 kg</option>
                          <option value="100-500">100 - 500 kg</option>
                          <option value="500+">500+ kg</option>
                        </select>
                      </div>
                    )}

                    {chaServiceType === 'Sea' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Load Type</label>
                        <select
                          value={seaLoadType}
                          onChange={(e) => setSeaLoadType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                        >
                          <option value="">Select Load Type</option>
                          <option value="LCL">Less Container Load (LCL)</option>
                          <option value="FCL">Full Container Load (FCL)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Properties */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Delivery Speed (e.g. 3-4)</label>
                  <input
                    type="text"
                    placeholder="Delivery Days (e.g. 3-4)"
                    value={deliverySpeed}
                    onChange={(e) => setDeliverySpeed(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Pricing Valid Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF] cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Additional Services */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Enter Additional Services (e.g. Packing, Insurance)</label>
                <input
                  type="text"
                  placeholder="Additional Services offered"
                  value={additionalServices}
                  onChange={(e) => setAdditionalServices(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0066FF]"
                />
              </div>

              {/* Price Details */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-[#0066FF] uppercase tracking-wider">Standard Price / Rate</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-1/4 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-[#0B1E43] focus:outline-none focus:border-[#0066FF]"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'AED' ? 'د.إ' : '₹'}
                    </span>
                    <input
                      type="number"
                      placeholder="Rate amount"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-black text-[#0066FF] focus:outline-none focus:border-[#0066FF]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Message and Credit Info */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-900 uppercase tracking-wider">Message / Product Details</label>
                  <textarea
                    placeholder="Brief details about the product..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0066FF] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRateId(null); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  {editingRateId ? 'Update Rate' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPricingTab;
