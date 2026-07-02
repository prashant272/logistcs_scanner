import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Info, ArrowRight, Loader2, Box, Truck, Search, CheckCircle } from 'lucide-react';

const DelhiveryCalculator = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Form States
    const [originPin, setOriginPin] = useState('');
    const [destPin, setDestPin] = useState('');
    const [boxes, setBoxes] = useState([{ id: 1, count: 1, l: 10, b: 10, h: 10 }]);
    const [totalWeight, setTotalWeight] = useState(1);
    const [shipmentAmount, setShipmentAmount] = useState(1000);
    const [paymentMode, setPaymentMode] = useState('Prepaid');
    const [freightMode, setFreightMode] = useState('fop');
    const [insurance, setInsurance] = useState('owner');
    const [dropOff, setDropOff] = useState('no');
    
    // Result States
    const [isLoading, setIsLoading] = useState(false);
    const [rateResult, setRateResult] = useState(null);
    const [error, setError] = useState('');

    // Serviceability States
    const [originData, setOriginData] = useState(null);
    const [destData, setDestData] = useState(null);
    const [originLoading, setOriginLoading] = useState(false);
    const [destLoading, setDestLoading] = useState(false);

    const checkPin = async (pin, setStatus, setLoading) => {
        if (pin.length === 6) {
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/check-serviceability/${pin}`);
                setStatus({ valid: res.data.success || !!res.data.data, data: res.data.data });
            } catch (err) {
                setStatus({ valid: false, error: "Invalid or Unserviceable Pincode" });
            } finally {
                setLoading(false);
            }
        } else {
            setStatus(null);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => checkPin(originPin, setOriginData, setOriginLoading), 600);
        return () => clearTimeout(timeoutId);
    }, [originPin]);

    useEffect(() => {
        const timeoutId = setTimeout(() => checkPin(destPin, setDestData, setDestLoading), 600);
        return () => clearTimeout(timeoutId);
    }, [destPin]);

    const handleAddBox = () => {
        setBoxes([...boxes, { id: Date.now(), count: 1, l: 10, b: 10, h: 10 }]);
    };

    const updateBox = (id, field, value) => {
        setBoxes(boxes.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleCalculate = async () => {
        if (!originPin || !destPin || !totalWeight) {
            setError("Please fill required fields: Origin, Destination, Weight.");
            return;
        }

        setIsLoading(true);
        setError('');
        setRateResult(null);

        try {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            
            // Format dimensions payload
            const dimensionsPayload = boxes.map(b => ({
                length_cm: parseFloat(b.l) || 10,
                width_cm: parseFloat(b.b) || 10,
                height_cm: parseFloat(b.h) || 10,
                box_count: parseInt(b.count) || 1
            }));

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/estimate`, {
                source_pin: originPin,
                consignee_pin: destPin,
                weight_g: totalWeight * 1000, // API expects grams
                dimensions: dimensionsPayload,
                payment_mode: paymentMode,
                cod_amount: paymentMode === 'COD' ? shipmentAmount : 0
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setRateResult(res.data);
            } else {
                setError("Failed to fetch rates. Please check pincodes and try again.");
            }
        } catch (err) {
            console.error("Calculation error:", err);
            setError(err.response?.data?.message || "Something went wrong fetching the rate.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        try {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            const dimensionsString = boxes.map(b => `${b.l}x${b.b}x${b.h}`).join(',');
            
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/book`, {
                origin_pin: originPin,
                dest_pin: destPin,
                weight_g: totalWeight * 1000,
                dimensions: dimensionsString,
                payment_mode: paymentMode,
                cod_amount: paymentMode === 'COD' ? shipmentAmount : 0,
                basePrice: rateResult.basePrice,
                finalPrice: rateResult.finalPrice,
                pickup_address: 'System Generated Pickup',
                drop_address: 'System Generated Drop'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert("Order Created Successfully! Redirecting to dashboard...");
                navigate(user.role === 'vendor' ? '/vendor/ptl-bookings' : '/customer/ptl-bookings');
            }
        } catch (error) {
            console.error("Booking error", error);
            alert("Failed to create order. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-20">
                <div className="flex items-center gap-3 mb-8">
                    <h1 className="text-3xl font-black text-[#0B1E43]">Serviceability & Rate Calculator</h1>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                        <Info size={14} /> Delhivery PTL
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pincode Card */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                Pickup & Delivery Pincode
                            </h2>
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="flex-1 w-full">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></div>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            placeholder="Enter Origin Pincode"
                                            value={originPin}
                                            onChange={(e) => setOriginPin(e.target.value.replace(/\D/g, ''))}
                                            className={`w-full pl-10 pr-4 py-4 bg-slate-50 border ${originData ? (originData.valid ? 'border-green-300 focus:ring-green-500/30' : 'border-red-300 focus:ring-red-500/30') : 'border-slate-200 focus:ring-[#0066FF]/30'} rounded-2xl focus:outline-none focus:ring-2 font-bold tracking-wide transition-colors`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ORIGIN</span>
                                    </div>
                                    <div className="mt-2 text-[11px] h-10 px-2">
                                        {originLoading && <span className="text-slate-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Verifying...</span>}
                                        {!originLoading && originData?.valid === true && (
                                            <div>
                                                <span className="text-slate-400 font-medium">
                                                    {originData.data?.pincode_serviceability_data?.[0]?.city || 'Delhi'}, {originData.data?.pincode_serviceability_data?.[0]?.state || 'Delhi'}
                                                </span>
                                                <div className="text-teal-600 flex items-center gap-1 mt-1 font-medium">
                                                    <CheckCircle size={12} /> Green Tax Applicable
                                                </div>
                                            </div>
                                        )}
                                        {!originLoading && originData?.valid === false && (
                                            <span className="text-red-500 font-medium">{originData.error || 'Pincode not serviceable'}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="hidden md:flex flex-col items-center justify-center text-slate-300 mt-4">
                                    <div className="w-8 h-0.5 bg-slate-200"></div>
                                </div>
                                
                                <div className="flex-1 w-full">
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            placeholder="Enter Delivery Pincode"
                                            value={destPin}
                                            onChange={(e) => setDestPin(e.target.value.replace(/\D/g, ''))}
                                            className={`w-full pl-10 pr-4 py-4 bg-slate-50 border ${destData ? (destData.valid ? 'border-green-300 focus:ring-green-500/30' : 'border-red-300 focus:ring-red-500/30') : 'border-slate-200 focus:ring-[#0066FF]/30'} rounded-2xl focus:outline-none focus:ring-2 font-bold tracking-wide transition-colors`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">DEST</span>
                                    </div>
                                    <div className="mt-2 text-[11px] h-10 px-2">
                                        {destLoading && <span className="text-slate-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Verifying...</span>}
                                        {!destLoading && destData?.valid === true && (
                                            <div>
                                                <span className="text-slate-400 font-medium">
                                                    {destData.data?.pincode_serviceability_data?.[0]?.city || 'Delhi'}, {destData.data?.pincode_serviceability_data?.[0]?.state || 'Delhi'}
                                                </span>
                                                <div className="text-teal-600 flex items-center gap-1 mt-1 font-medium">
                                                    <CheckCircle size={12} /> Valid Drop Point
                                                </div>
                                            </div>
                                        )}
                                        {!destLoading && destData?.valid === false && (
                                            <span className="text-red-500 font-medium">{destData.error || 'Pincode not serviceable'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box Details Card */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Box size={20} className="text-[#0066FF]" /> Package Details
                            </h2>
                            <div className="space-y-4">
                                {boxes.map((box, index) => (
                                    <div key={box.id} className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="w-24">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Boxes</label>
                                            <input type="number" min="1" value={box.count} onChange={e => updateBox(box.id, 'count', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20" />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Box Size (L x B x H)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={box.l} onChange={e => updateBox(box.id, 'l', e.target.value)} placeholder="L" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 text-center" />
                                                <input type="number" value={box.b} onChange={e => updateBox(box.id, 'b', e.target.value)} placeholder="B" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 text-center" />
                                                <input type="number" value={box.h} onChange={e => updateBox(box.id, 'h', e.target.value)} placeholder="H" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 text-center" />
                                                <span className="text-sm font-bold text-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2">Cm</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddBox} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-[#0066FF] hover:text-[#0066FF] transition-colors text-sm">
                                    + Add Another Box Size
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Total shipment weight</label>
                                    <div className="relative">
                                        <input type="number" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 font-bold" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Kg</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Shipment Amount (Value)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                                        <input type="number" value={shipmentAmount} onChange={e => setShipmentAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 font-bold" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Options Card */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-3">Payment Mode</h3>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="pay_mode" checked={paymentMode === 'Prepaid'} onChange={() => setPaymentMode('Prepaid')} className="w-4 h-4 text-[#0066FF]" />
                                        <span className="text-sm font-medium">Prepaid</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="pay_mode" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} className="w-4 h-4 text-[#0066FF]" />
                                        <span className="text-sm font-medium">Collect on Delivery (COD)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-3">Freight</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightMode === 'fop'} onChange={() => setFreightMode('fop')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Freight on Pickup</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightMode === 'fod'} onChange={() => setFreightMode('fod')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Freight on Delivery</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-3">Insurance</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="ins" checked={insurance === 'owner'} onChange={() => setInsurance('owner')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Owner's Risk</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="ins" checked={insurance === 'delhivery'} onChange={() => setInsurance('delhivery')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Carrier Insurance</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-3">Drop-off</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="drop" checked={dropOff === 'no'} onChange={() => setDropOff('no')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">No, Pickup from me</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="drop" checked={dropOff === 'yes'} onChange={() => setDropOff('yes')} className="w-4 h-4" />
                                            <span className="text-sm font-medium">Yes, I'll self-drop</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button 
                                onClick={handleCalculate}
                                disabled={isLoading}
                                className="bg-[#0066FF] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#0052cc] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Calculate Rates'}
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-1">
                        {rateResult ? (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sticky top-24">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Surface</h3>
                                        <div className="text-3xl font-black text-[#0B1E43]">₹{rateResult.finalPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        <p className="text-sm font-medium text-green-600 mt-2 flex items-center gap-1">
                                            <Truck size={14} /> Delivery in 4 days
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0066FF]">
                                        <Truck size={24} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl mb-6">
                                    <div><span className="text-slate-400">Total:</span> {totalWeight} kg</div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    <div><span className="text-slate-400">Charged:</span> {totalWeight} kg</div>
                                </div>

                                <div className="space-y-3 mb-6 border-t border-slate-100 pt-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price Breakdown</h4>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-semibold">Base Freight</span>
                                        <span className="font-bold text-slate-900">₹{rateResult.breakup?.price_breakup?.base_freight_charge || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-semibold">Fuel Surcharge</span>
                                        <span className="font-bold text-slate-900">₹{rateResult.breakup?.price_breakup?.fuel_surcharge || 0}</span>
                                    </div>
                                    {rateResult.breakup?.price_breakup?.insurance_rov > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-semibold">Insurance (ROV)</span>
                                        <span className="font-bold text-slate-900">₹{rateResult.breakup.price_breakup.insurance_rov}</span>
                                    </div>
                                    )}
                                    {rateResult.breakup?.price_breakup?.other_handling_charges > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-semibold">Handling Charges</span>
                                        <span className="font-bold text-slate-900">₹{rateResult.breakup.price_breakup.other_handling_charges}</span>
                                    </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-semibold">GST ({rateResult.breakup?.price_breakup?.gst_percent || 18}%)</span>
                                        <span className="font-bold text-slate-900">₹{rateResult.breakup?.price_breakup?.gst || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#0066FF] font-bold">Convenience Fee</span>
                                        <span className="font-bold text-[#0066FF]">₹{(rateResult.finalPrice - rateResult.basePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-[#0B1E43] border-t-2 border-slate-200 pt-3 mt-3">
                                        <span>Total</span>
                                        <span>₹{rateResult.finalPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/ptl-calculator/order', { 
                                        state: { 
                                            rateResult, 
                                            boxes, 
                                            totalWeight, 
                                            originPin, 
                                            destPin, 
                                            paymentMode, 
                                            shipmentAmount, 
                                            insurance, 
                                            dropOff 
                                        } 
                                    })}
                                    className="w-full bg-[#0B1E43] hover:bg-[#1a2d55] text-white py-4 rounded-xl font-bold text-base transition-colors"
                                >
                                    Create Order
                                </button>
                                
                                <p className="text-xs text-slate-400 text-center mt-4 px-2 leading-relaxed">
                                    This freight charge is subject to a change based on revisions in weight & dimension measurements.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center h-[400px]">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">No Rates Calculated</h3>
                                <p className="text-sm text-slate-500 px-4">
                                    Enter origin, destination, and package details to see the estimated shipping rates.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DelhiveryCalculator;
