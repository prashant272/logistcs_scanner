import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Info, ArrowRight, Loader2, Box, Truck, Search, CheckCircle, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoiceDocument from '../../components/common/InvoiceDocument';

const DelhiveryCalculator = ({ isDashboard = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Form States
    const [originPin, setOriginPin] = useState('');
    const [destPin, setDestPin] = useState('');
    const [boxes, setBoxes] = useState([{ id: 1, count: 1, l: 35, b: 35, h: 35 }]);
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

    const invoiceRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadInvoice = async () => {
        if (!invoiceRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Freight-Quotation-${Date.now()}.pdf`);
        } catch (error) {
            console.error("Error generating PDF", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

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
        setBoxes([...boxes, { id: Date.now(), count: 1, l: 35, b: 35, h: 35 }]);
    };

    const updateBox = (id, field, value) => {
        setBoxes(boxes.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleRemoveBox = (id) => {
        if (boxes.length > 1) {
            setBoxes(boxes.filter(b => b.id !== id));
        }
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
                cod_amount: paymentMode === 'COD' ? shipmentAmount : 0,
                freight_mode: freightMode,
                rov_insurance: insurance === 'delhivery'
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
        <div className={`min-h-screen bg-white font-sans text-gray-800 ${!isDashboard ? 'pt-24 pb-12' : ''}`}>
            {!isDashboard && <Navbar />}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Rate Calculator</h1>
                        <p className="text-gray-500 mt-2 font-medium">Estimate your shipping costs instantly</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm w-fit">
                        <Truck size={18} className="text-blue-600" /> Delhivery PTL
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Pincode Card */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-200 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                <MapPin className="text-blue-600" size={24} /> Location Details
                            </h2>
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="flex-1 w-full">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            placeholder="Origin Pincode"
                                            value={originPin}
                                            onChange={(e) => setOriginPin(e.target.value.replace(/\D/g, ''))}
                                            className={`w-full pl-11 pr-16 py-4 bg-gray-50/50 border ${originData ? (originData.valid ? 'border-green-400 focus:ring-green-500/20' : 'border-red-400 focus:ring-red-500/20') : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl focus:outline-none focus:ring-4 font-semibold text-gray-800 tracking-wide transition-all`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">Origin</span>
                                    </div>
                                    <div className="mt-3 text-xs min-h-[40px] px-1">
                                        {originLoading && <span className="text-blue-500 flex items-center gap-1.5 font-medium"><Loader2 size={14} className="animate-spin" /> Verifying...</span>}
                                        {!originLoading && originData?.valid === true && (
                                            <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                                                <span className="text-gray-600 font-semibold block mb-1">
                                                    {originData.data?.pincode_serviceability_data?.[0]?.city || 'Delhi'}, {originData.data?.pincode_serviceability_data?.[0]?.state || 'Delhi'}
                                                </span>
                                                <div className="text-green-700 flex items-center gap-1.5 font-bold">
                                                    <CheckCircle size={14} /> Serviceable
                                                </div>
                                            </div>
                                        )}
                                        {!originLoading && originData?.valid === false && (
                                            <span className="text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-2 rounded-lg"><Info size={14} /> {originData.error || 'Pincode not serviceable'}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="hidden md:flex flex-col items-center justify-center mt-6">
                                    <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                </div>
                                
                                <div className="flex-1 w-full">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            placeholder="Destination Pincode"
                                            value={destPin}
                                            onChange={(e) => setDestPin(e.target.value.replace(/\D/g, ''))}
                                            className={`w-full pl-11 pr-16 py-4 bg-gray-50/50 border ${destData ? (destData.valid ? 'border-green-400 focus:ring-green-500/20' : 'border-red-400 focus:ring-red-500/20') : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'} rounded-xl focus:outline-none focus:ring-4 font-semibold text-gray-800 tracking-wide transition-all`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">Dest</span>
                                    </div>
                                    <div className="mt-3 text-xs min-h-[40px] px-1">
                                        {destLoading && <span className="text-blue-500 flex items-center gap-1.5 font-medium"><Loader2 size={14} className="animate-spin" /> Verifying...</span>}
                                        {!destLoading && destData?.valid === true && (
                                            <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                                                <span className="text-gray-600 font-semibold block mb-1">
                                                    {destData.data?.pincode_serviceability_data?.[0]?.city || 'Delhi'}, {destData.data?.pincode_serviceability_data?.[0]?.state || 'Delhi'}
                                                </span>
                                                <div className="text-green-700 flex items-center gap-1.5 font-bold">
                                                    <CheckCircle size={14} /> Serviceable
                                                </div>
                                            </div>
                                        )}
                                        {!destLoading && destData?.valid === false && (
                                            <span className="text-red-600 font-semibold flex items-center gap-1.5 bg-red-50 p-2 rounded-lg"><Info size={14} /> {destData.error || 'Pincode not serviceable'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box Details Card */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-200 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                                <Box className="text-blue-600" size={24} /> Shipment Details
                            </h2>
                            <div className="space-y-4">
                                {boxes.map((box, index) => (
                                    <div key={box.id} className="relative flex flex-col sm:flex-row sm:items-end gap-4 bg-white p-4 sm:p-5 sm:pr-20 rounded-xl border-2 border-gray-100 transition-all hover:border-blue-200 hover:shadow-md">
                                        {/* Box Number Indicator */}
                                        <div className="absolute -top-3 -left-3 bg-blue-100 text-blue-700 font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 text-xs">
                                            #{index + 1}
                                        </div>
                                        <div className="w-full sm:w-28 mt-2 sm:mt-0">
                                            <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Count</label>
                                            <input type="number" min="1" value={box.count} onChange={e => updateBox(box.id, 'count', e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 rounded-lg px-3 sm:px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Dimensions (L × B × H)</label>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <input type="number" value={box.l} onChange={e => updateBox(box.id, 'l', e.target.value)} placeholder="L" className="w-full min-w-0 bg-gray-50 border-2 border-gray-100 rounded-lg px-1 sm:px-2 py-3 text-sm sm:text-base font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center transition-all" />
                                                <span className="text-gray-300 font-bold text-sm sm:text-base">×</span>
                                                <input type="number" value={box.b} onChange={e => updateBox(box.id, 'b', e.target.value)} placeholder="B" className="w-full min-w-0 bg-gray-50 border-2 border-gray-100 rounded-lg px-1 sm:px-2 py-3 text-sm sm:text-base font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center transition-all" />
                                                <span className="text-gray-300 font-bold text-sm sm:text-base">×</span>
                                                <input type="number" value={box.h} onChange={e => updateBox(box.id, 'h', e.target.value)} placeholder="H" className="w-full min-w-0 bg-gray-50 border-2 border-gray-100 rounded-lg px-1 sm:px-2 py-3 text-sm sm:text-base font-bold text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-center transition-all" />
                                                <div className="bg-gray-100 text-gray-500 font-bold px-2 sm:px-3 py-3 rounded-lg text-xs sm:text-sm border-2 border-gray-200">cm</div>
                                            </div>
                                        </div>
                                        {boxes.length > 1 && (
                                            <button 
                                                onClick={() => handleRemoveBox(box.id)}
                                                className="absolute top-4 right-4 sm:top-auto sm:bottom-4 p-2.5 text-red-500 bg-red-50 border-2 border-red-100 hover:text-white hover:bg-red-500 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 rounded-xl transition-all"
                                                title="Remove Box"
                                            >
                                                <X size={20} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={handleAddBox} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-300 transition-all text-sm flex items-center justify-center gap-2">
                                    <Box size={16} /> Add Another Box Type
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t-2 border-gray-100">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Total Actual Weight</label>
                                    <div className="relative">
                                        <input type="number" value={totalWeight} onChange={e => setTotalWeight(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-900 text-lg transition-all" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">kg</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Shipment Value</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">₹</span>
                                        <input type="number" value={shipmentAmount} onChange={e => setShipmentAmount(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl pl-10 pr-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-900 text-lg transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Options Card */}
                        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-200 space-y-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Payment Mode</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === 'Prepaid' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMode === 'Prepaid' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                            {paymentMode === 'Prepaid' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                        </div>
                                        <input type="radio" name="pay_mode" checked={paymentMode === 'Prepaid'} onChange={() => setPaymentMode('Prepaid')} className="hidden" />
                                        <span className={`text-sm font-bold ${paymentMode === 'Prepaid' ? 'text-blue-900' : 'text-gray-700'}`}>Prepaid</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMode === 'COD' ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMode === 'COD' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                            {paymentMode === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                        </div>
                                        <input type="radio" name="pay_mode" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} className="hidden" />
                                        <span className={`text-sm font-bold ${paymentMode === 'COD' ? 'text-blue-900' : 'text-gray-700'}`}>Collect on Delivery (COD)</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t-2 border-gray-100">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Freight</h3>
                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${freightMode === 'fop' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${freightMode === 'fop' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {freightMode === 'fop' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="freight" checked={freightMode === 'fop'} onChange={() => setFreightMode('fop')} className="hidden" />
                                            <span className={`text-sm font-bold ${freightMode === 'fop' ? 'text-blue-900' : 'text-gray-700'}`}>Freight on Pickup</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${freightMode === 'fod' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${freightMode === 'fod' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {freightMode === 'fod' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="freight" checked={freightMode === 'fod'} onChange={() => setFreightMode('fod')} className="hidden" />
                                            <span className={`text-sm font-bold ${freightMode === 'fod' ? 'text-blue-900' : 'text-gray-700'}`}>Freight on Delivery</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Insurance</h3>
                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${insurance === 'owner' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${insurance === 'owner' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {insurance === 'owner' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="ins" checked={insurance === 'owner'} onChange={() => setInsurance('owner')} className="hidden" />
                                            <span className={`text-sm font-bold ${insurance === 'owner' ? 'text-blue-900' : 'text-gray-700'}`}>Owner's Risk</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${insurance === 'delhivery' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${insurance === 'delhivery' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {insurance === 'delhivery' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="ins" checked={insurance === 'delhivery'} onChange={() => setInsurance('delhivery')} className="hidden" />
                                            <span className={`text-sm font-bold ${insurance === 'delhivery' ? 'text-blue-900' : 'text-gray-700'}`}>Carrier Insurance</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Handover</h3>
                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${dropOff === 'no' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${dropOff === 'no' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {dropOff === 'no' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="drop" checked={dropOff === 'no'} onChange={() => setDropOff('no')} className="hidden" />
                                            <span className={`text-sm font-bold ${dropOff === 'no' ? 'text-blue-900' : 'text-gray-700'}`}>Doorstep Pickup</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${dropOff === 'yes' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${dropOff === 'yes' ? 'border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                {dropOff === 'yes' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                            </div>
                                            <input type="radio" name="drop" checked={dropOff === 'yes'} onChange={() => setDropOff('yes')} className="hidden" />
                                            <span className={`text-sm font-bold ${dropOff === 'yes' ? 'text-blue-900' : 'text-gray-700'}`}>Self Drop</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-start gap-3 shadow-sm">
                                <Info className="shrink-0 text-red-500 mt-0.5" size={18} />
                                <div>{error}</div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button 
                                onClick={handleCalculate}
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                            >
                                {isLoading ? <><Loader2 className="animate-spin" size={20} /> Calculating...</> : 'Calculate Rates'}
                            </button>
                            <button 
                                onClick={() => window.location.reload()}
                                className="sm:w-32 bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-lg"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-28">
                            {rateResult ? (
                                <div className="bg-[#0B1E43] rounded-3xl p-1 overflow-hidden shadow-[0_10px_40px_-10px_rgba(11,30,67,0.4)] transition-all">
                                    <div className="bg-white rounded-[22px] p-6 md:p-8 h-full flex flex-col">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-black px-2.5 py-1 rounded mb-3 uppercase tracking-widest border border-blue-100">Surface Express</span>
                                                <div className="text-4xl font-black text-gray-900 tracking-tight">₹{rateResult.finalPrice?.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1.5">
                                                    <Truck size={16} /> Delivery in ~4 days
                                                </p>
                                            </div>
                                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                                <Truck size={26} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                                            <div className="flex-1 text-center"><span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Actual Wt</span> {totalWeight} kg</div>
                                            <div className="w-px h-8 bg-gray-200"></div>
                                            <div className="flex-1 text-center"><span className="text-gray-400 block text-xs uppercase tracking-wider mb-1">Charged Wt</span> {rateResult.breakup?.charged_wt || totalWeight} kg</div>
                                        </div>

                                        <div className="space-y-4 mb-8 border-t border-gray-100 pt-6 flex-1">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Price Breakdown</h4>
                                            
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 font-semibold">Base Freight</span>
                                                <span className="font-bold text-gray-900">
                                                    ₹{(rateResult.finalPrice - (rateResult.breakup?.price_breakup?.insurance_rov || 0) - (rateResult.breakup?.price_breakup?.gst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            
                                            {(rateResult.breakup?.price_breakup?.insurance_rov > 0) && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-semibold">Insurance</span>
                                                    <span className="font-bold text-gray-900">
                                                        ₹{rateResult.breakup.price_breakup.insurance_rov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 font-semibold">GST ({rateResult.breakup?.price_breakup?.gst_percent || 18}%)</span>
                                                <span className="font-bold text-gray-900">
                                                    ₹{(rateResult.breakup?.price_breakup?.gst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-lg font-black text-gray-900 border-t border-dashed border-gray-200 pt-4 mt-2">
                                                <span>Total Price</span>
                                                <span className="text-blue-600">₹{rateResult.finalPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 mt-auto">
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
                                                        dropOff,
                                                        freightMode
                                                    } 
                                                })}
                                                className="w-full bg-[#0B1E43] hover:bg-[#152a55] text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-[#0B1E43]/20 flex items-center justify-center gap-2"
                                            >
                                                Book Shipment <ArrowRight size={20} />
                                            </button>

                                            <button
                                                onClick={handleDownloadInvoice}
                                                disabled={isDownloading}
                                                className="w-full bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 py-3 rounded-xl font-bold text-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isDownloading ? <><Loader2 className="animate-spin" size={18} /> Generating...</> : <><Download size={18} /> Download Invoice</>}
                                            </button>
                                        </div>
                                        
                                        <p className="text-[11px] text-gray-400 text-center mt-4 font-medium">
                                            Final charges may vary based on physical measurement at hub.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6 border-4 border-white shadow-md">
                                        <Truck size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Ship?</h3>
                                    <p className="text-sm text-gray-500 max-w-[250px] mx-auto leading-relaxed">
                                        Enter your pickup and delivery pincodes along with package details to get instant shipping rates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Hidden Invoice Component for PDF Generation */}
            {rateResult && (
                <InvoiceDocument
                    ref={invoiceRef}
                    rateResult={rateResult}
                    boxes={boxes}
                    totalWeight={totalWeight}
                    originPin={originPin}
                    destPin={destPin}
                    originData={originData?.data?.pincode_serviceability_data?.[0]}
                    destData={destData?.data?.pincode_serviceability_data?.[0]}
                    shipmentAmount={shipmentAmount}
                    user={user}
                />
            )}
        </div>
    );
};

export default DelhiveryCalculator;
