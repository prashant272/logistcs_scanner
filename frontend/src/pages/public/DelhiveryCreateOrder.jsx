import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, UploadCloud, Shield, FileText, CheckCircle, Package, ChevronDown, Plus } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import AddressModal from '../../components/common/AddressModal';

const DelhiveryCreateOrder = ({ isDashboard = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Safely extract state from previous calculator page
    const state = location.state || {};
    const { 
        rateResult, boxes, totalWeight, originPin, destPin, 
        paymentMode: initialPaymentMode, shipmentAmount, 
        insurance: initialInsurance, dropOff: initialDropOff, freightMode: initialFreightMode 
    } = state;

    // Local saved addresses list (MVP mock)
    const [savedAddresses, setSavedAddresses] = useState([
        { id: 1, type: 'pickup', facilityName: 'vikrant sharma', addressLine: 'F-87 DEEP VIHAR NEW DELHI', city: 'Delhi', state: 'IN', pincode: '110042' }
    ]);
    const [selectedPickup, setSelectedPickup] = useState('');
    const [selectedDrop, setSelectedDrop] = useState('');
    const [selectedBilling, setSelectedBilling] = useState('');
    const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
    const [isDropDropdownOpen, setIsDropDropdownOpen] = useState(false);
    const [isBillingDropdownOpen, setIsBillingDropdownOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'pickup', pincode: '' });
    const [freightCollection, setFreightCollection] = useState(initialFreightMode === 'fod' ? 'Freight on Delivery' : 'Freight on Pickup');
    const [insuranceState, setInsuranceState] = useState(initialInsurance || 'owner');
    const [dropOffState, setDropOffState] = useState(initialDropOff || 'no');

    // Form States
    const [lrCreation, setLrCreation] = useState('Manual');
    const [lrNumber, setLrNumber] = useState('');
    const [orderDesc, setOrderDesc] = useState('');
    const [poNumber, setPoNumber] = useState('');
    const [poExpiry, setPoExpiry] = useState('');
    const [refId, setRefId] = useState('');
    const [boxCount, setBoxCount] = useState(boxes ? boxes.reduce((acc, curr) => acc + (parseInt(curr.count) || 1), 0) : 0);
    const [paymentMode, setPaymentMode] = useState(initialPaymentMode || 'Prepaid');
    const [ewayBill, setEwayBill] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [gstin, setGstin] = useState('');
    const [amount, setAmount] = useState(shipmentAmount || '');
    const [ewayLater, setEwayLater] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState(null);

    // Box editing states
    const [localBoxes, setLocalBoxes] = useState(boxes || [{ id: 1, count: 1, l: 35, b: 35, h: 35 }]);
    const [localWeight, setLocalWeight] = useState(totalWeight || 1);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [currentRate, setCurrentRate] = useState(rateResult);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState('');

    const [isMarkupAdded, setIsMarkupAdded] = useState(false);
    const [markupValue, setMarkupValue] = useState('');

    const handleAddBox = () => setLocalBoxes([...localBoxes, { id: Date.now(), count: 1, l: 35, b: 35, h: 35 }]);
    const updateBox = (id, field, value) => setLocalBoxes(localBoxes.map(b => b.id === id ? { ...b, [field]: value } : b));

    const handleRecalculate = async () => {
        setIsRecalculating(true);
        setError('');
        try {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            const dimensionsPayload = localBoxes.map(b => ({
                length_cm: parseFloat(b.l) || 10,
                width_cm: parseFloat(b.b) || 10,
                height_cm: parseFloat(b.h) || 10,
                box_count: parseInt(b.count) || 1
            }));

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/estimate`, {
                source_pin: originPin,
                consignee_pin: destPin,
                weight_g: localWeight * 1000,
                dimensions: dimensionsPayload,
                payment_mode: paymentMode,
                cod_amount: paymentMode === 'COD' ? amount : 0,
                freight_mode: freightCollection === 'Freight on Delivery' ? 'fod' : 'fop',
                rov_insurance: insuranceState === 'delhivery'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setCurrentRate(res.data);
                alert('Price recalculated successfully!');
            } else {
                setError("Failed to fetch updated rates.");
            }
        } catch (err) {
            console.error("Recalculation error:", err);
            setError("Something went wrong fetching the new rate.");
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleSaveAddress = (address) => {
        const newAddress = { ...address, id: Date.now() };
        setSavedAddresses(prev => [...prev, newAddress]);
        if (newAddress.type === 'pickup') {
            setSelectedPickup(newAddress.facilityName);
            setIsPickupDropdownOpen(false);
        } else if (newAddress.type === 'billing') {
            setSelectedBilling(newAddress.facilityName);
            setIsBillingDropdownOpen(false);
        } else {
            setSelectedDrop(newAddress.facilityName);
            setIsDropDropdownOpen(false);
        }
    };

    useEffect(() => {
        if (!rateResult) {
            // If someone lands here directly without calculating rates
            navigate('/ptl-calculator');
        }
    }, [rateResult, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Frontend Validation ---
        if (!selectedPickup) return setError("Please select a valid Pickup Address.");
        if (!selectedDrop) return setError("Please select a valid Drop Address.");
        if (!selectedBilling) return setError("Please select a valid Billing Address.");
        
        // Box Validation
        for (let i = 0; i < localBoxes.length; i++) {
            const b = localBoxes[i];
            if (!b.l) return setError(`Box ${i+1}: Length is a required field`);
            if (!b.b) return setError(`Box ${i+1}: Width is a required field`);
            if (!b.h) return setError(`Box ${i+1}: Height is a required field`);
        }

        if (!invoiceNumber) return setError("Invoice Number is mandatory.");
        if (!amount || amount <= 0) return setError("Invoice Amount is mandatory and must be greater than 0.");
        if (!invoiceFile) return setError("Please upload the mandatory Invoice Document.");
        
        const pickupObj = savedAddresses.find(a => a.facilityName === selectedPickup);
        const dropObj = savedAddresses.find(a => a.facilityName === selectedDrop);
        const billingObj = savedAddresses.find(a => a.facilityName === selectedBilling);
        
        if (!pickupObj) return setError("Pickup address details not found. Please add a valid address.");
        if (!dropObj) return setError("Drop address details not found. Please add a valid address.");
        if (!billingObj) return setError("Billing address details not found. Please add a valid billing address.");

        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            
            // Map payload as expected by backend MVP
            const dimensionsPayload = localBoxes.map(b => ({
                length_cm: parseFloat(b.l) || 10,
                width_cm: parseFloat(b.b) || 10,
                height_cm: parseFloat(b.h) || 10,
                box_count: parseInt(b.count) || 1
            }));

            const parsedMarkup = isMarkupAdded ? (parseFloat(markupValue) || 0) : 0;
            const originalGst = currentRate?.data?.price_breakup?.gst || 0;
            const markupGst = parsedMarkup * 0.18;
            const totalGst = originalGst + markupGst;
            const baseFreight = currentRate?.finalPrice || 0;
            const finalTotalAmount = baseFreight + parsedMarkup + markupGst;

            const payload = {
                origin_pin: originPin,
                dest_pin: destPin,
                weight_g: localWeight * 1000,
                dimensions: dimensionsPayload,
                pickup_address: selectedPickup || `Pickup Point - ${originPin}`,
                drop_address: selectedDrop || `Drop Point - ${destPin}`,
                pickup_details: pickupObj, // pass full object for backend to use
                drop_details: dropObj, // pass full object for backend to use
                billing_details: billingObj, // pass billing object for backend to use
                payment_mode: paymentMode?.toLowerCase() || 'prepaid',
                freight_mode: freightCollection === 'Freight on Delivery' ? 'fod' : 'fop',
                rov_insurance: insuranceState === 'delhivery',
                fm_pickup: dropOffState === 'no',
                cod_amount: paymentMode === 'COD' ? amount : 0,
                basePrice: currentRate?.basePrice || 0,
                finalPrice: currentRate?.finalPrice || 0,
                vendor_markup_fee: parsedMarkup,
                gst_amount: totalGst,
                total_amount: finalTotalAmount,
                gstin: gstin,
                order_details: {
                    lr_creation: lrCreation,
                    lr_number: lrNumber,
                    description: orderDesc,
                    po_number: poNumber,
                    po_expiry: poExpiry,
                    reference_id: refId,
                    invoice_number: invoiceNumber,
                    invoice_amount: amount,
                    eway_later: ewayLater
                }
            };

            const formData = new FormData();
            formData.append('payload', JSON.stringify(payload));
            if (invoiceFile) {
                formData.append('invoice_file', invoiceFile);
            }

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/book`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setSubmitSuccess(true);
                setTimeout(() => {
                    navigate(`/${user?.role || 'customer'}/ptl-bookings`); 
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className={`min-h-screen bg-slate-50 flex flex-col ${!isDashboard ? 'pt-20' : ''}`}>
                {!isDashboard && <Navbar />}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-[#0B1E43] mb-4">Order Created Successfully!</h2>
                        <p className="text-slate-600 mb-8">Your shipment has been booked and is being processed by Delhivery.</p>
                        <button onClick={() => navigate(`/${user?.role || 'customer'}/ptl-bookings`)} className="w-full bg-[#0066FF] hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">
                            Go to My Bookings
                        </button>
                    </div>
                </div>
                {!isDashboard && <Footer />}
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col ${!isDashboard ? 'pt-20' : ''}`} style={{ color: '#334155' }}>
            {!isDashboard && <Navbar />}
            
            <style>{`
                /* Explicitly override dark mode white text defaults */
                .delhivery-order-container h1 { color: #0B1E43 !important; }
                .delhivery-order-container h2 { color: #1e293b !important; }
                .delhivery-order-container label { color: #475569 !important; }
                .delhivery-order-container p, .delhivery-order-container span { color: #64748b; }
                .delhivery-order-container .text-dark { color: #1e293b !important; }
                .delhivery-order-container .text-blue { color: #2563eb !important; }
                .delhivery-order-container .bg-white { background-color: #ffffff !important; }
            `}</style>

            <div className="delhivery-order-container flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex items-center mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 mr-4 hover:bg-slate-200 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-black text-[#0B1E43]">Upload your invoice</h1>
                    <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-400">new</span>
                </div>
                <p className="text-slate-500 mb-8 ml-14">Autofill order details from your invoice in seconds.</p>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium ml-14 max-w-2xl">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ml-14">
                    {/* Left Column (Main Form) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. LR Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                <FileText className="text-blue-500" size={20} /> LR Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-3">LR creation</label>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="lr" checked={lrCreation === 'Manual'} onChange={() => setLrCreation('Manual')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Manual</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="lr" checked={lrCreation === 'Automatic'} onChange={() => setLrCreation('Automatic')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium">Automatic</span>
                                        </label>
                                    </div>
                                </div>
                                {lrCreation === 'Manual' && (
                                    <input type="text" placeholder="Enter LR number" value={lrNumber} onChange={e => setLrNumber(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                )}
                            </div>
                        </div>

                        {/* 2. Order Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                <Package className="text-blue-500" size={20} /> Order Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
                                    <input type="text" placeholder="Enter order description" value={orderDesc} onChange={e => setOrderDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">PO Number</label>
                                        <input type="text" placeholder="Enter Your PO number" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">PO Expiry Date</label>
                                        <input type="date" value={poExpiry} onChange={e => setPoExpiry(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">Your reference ID / order ID</label>
                                        <input type="text" placeholder="Enter your reference ID / order ID" value={refId} onChange={e => setRefId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 block mb-1">No. of boxes</label>
                                        <input type="number" placeholder="Enter no. of boxes" value={boxCount} onChange={e => setBoxCount(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Invoice Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                <FileText className="text-blue-500" size={20} /> Invoice Details
                            </h2>
                            
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Payment Mode</label>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={paymentMode === 'Prepaid'} onChange={() => setPaymentMode('Prepaid')} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium capitalize">Prepaid</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium capitalize">Collect on Delivery (COD)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">E-Way Bill Number</label>
                                    <input type="text" placeholder="Enter E-Way Bill number" value={ewayBill} onChange={e => setEwayBill(e.target.value)} disabled={ewayLater} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">GSTIN / PAN (Mandatory) *</label>
                                    <input type="text" placeholder="Enter GSTIN or PAN" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Invoice Number *</label>
                                    <input type="text" placeholder="Enter Invoice number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-1">Amount *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                        <input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer mb-6">
                                <input type="checkbox" checked={ewayLater} onChange={e => setEwayLater(e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                                <span className="text-sm text-slate-600 font-medium">I will add E-Way bill later/ E-Way bill not required for this shipment</span>
                            </label>

                            <div className="border-t border-slate-100 pt-4 flex justify-between text-sm items-center">
                                <div>
                                    <span className="text-slate-500 block mb-1">Total Amount</span>
                                    <span className="text-slate-500 block">Delhivery Transporter ID</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-slate-800 block mb-1">₹{Number(amount || 0).toFixed(2)}</span>
                                    <span className="font-medium text-slate-600 block">06AAPCS9075E1ZR</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Insure your shipment */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                                <Shield className="text-blue-500" size={20} /> Insure your shipment
                            </h2>
                            <p className="text-sm text-slate-600 mb-4 font-medium">Are you sure you want to ship the item at your own risk?</p>
                            
                            <div className="flex items-center gap-6 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={insuranceState === 'owner'} onChange={() => setInsuranceState('owner')} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">Yes, Ship with Owners Risk</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={insuranceState === 'delhivery'} onChange={() => setInsuranceState('delhivery')} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">Get Delhivery's Insurance (Carrier's Risk)</span>
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 italic">Getting insurance may include additional costs, please read the pricing file for insurance pricing details</p>
                        </div>
                    </div>

                    {/* Right Column (Sidebar form items) */}
                    <div className="space-y-6">
                        
                        {/* 5. Delivery Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4 rotate-[135deg] text-green-500" /> Delivery Details
                            </h2>
                            <div className="space-y-4">
                                {/* Pickup Dropdown */}
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 z-10"></div>
                                    <div 
                                        className="w-full border border-slate-300 rounded-lg p-3 pl-8 text-sm outline-none cursor-pointer flex justify-between items-center bg-white"
                                        onClick={() => setIsPickupDropdownOpen(!isPickupDropdownOpen)}
                                    >
                                        <span className={selectedPickup ? 'text-slate-800' : 'text-slate-400'}>
                                            {selectedPickup || `Select Pickup Location (${originPin})`}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>
                                    
                                    {isPickupDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-slate-100">
                                                <input type="text" placeholder="Search Pickup Locations" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                            </div>
                                            {savedAddresses.filter(a => a.type === 'pickup').map(addr => (
                                                <div key={addr.id} onClick={() => { setSelectedPickup(addr.facilityName); setIsPickupDropdownOpen(false); }} className="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                                                    <p className="text-sm font-bold text-slate-800">{addr.facilityName}</p>
                                                    <p className="text-xs text-slate-500 uppercase mt-1">{addr.addressLine}, {addr.city}, {addr.state}, IN, {addr.pincode}</p>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => { setIsPickupDropdownOpen(false); setModalConfig({ isOpen: true, type: 'pickup', pincode: originPin }); }}
                                                className="w-full p-3 text-sm text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                                            >
                                                <Plus size={16} /> Add Pickup Location
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative border-l border-dashed border-slate-300 ml-4 pl-4 py-2"></div>
                                
                                {/* Drop Dropdown */}
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-green-500 z-10"></div>
                                    <div 
                                        className="w-full border border-slate-300 rounded-lg p-3 pl-8 text-sm outline-none cursor-pointer flex justify-between items-center bg-white"
                                        onClick={() => setIsDropDropdownOpen(!isDropDropdownOpen)}
                                    >
                                        <span className={selectedDrop ? 'text-slate-800' : 'text-slate-400'}>
                                            {selectedDrop || `Select Drop Location (${destPin})`}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </div>

                                    {isDropDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-slate-100">
                                                <input type="text" placeholder="Search Drop Locations" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                            </div>
                                            {savedAddresses.filter(a => a.type === 'drop').map(addr => (
                                                <div key={addr.id} onClick={() => { setSelectedDrop(addr.facilityName); setIsDropDropdownOpen(false); }} className="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                                                    <p className="text-sm font-bold text-slate-800">{addr.facilityName}</p>
                                                    <p className="text-xs text-slate-500 uppercase mt-1">{addr.addressLine}, {addr.city}, {addr.state}, IN, {addr.pincode}</p>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => { setIsDropDropdownOpen(false); setModalConfig({ isOpen: true, type: 'drop', pincode: destPin }); }}
                                                className="w-full p-3 text-sm text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                                            >
                                                <Plus size={16} /> Add Drop Location
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5.5 Billing Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" /> Billing Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Freight collection</label>
                                    <div className="flex items-center gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightCollection === 'Freight on Delivery'} onChange={() => setFreightCollection('Freight on Delivery')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-slate-700">Freight on Delivery</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="freight" checked={freightCollection === 'Freight on Pickup'} onChange={() => setFreightCollection('Freight on Pickup')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-slate-700">Freight on Pickup</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div 
                                        className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none cursor-pointer flex justify-between items-center bg-white"
                                        onClick={() => setIsBillingDropdownOpen(!isBillingDropdownOpen)}
                                    >
                                        <span className={selectedBilling ? 'text-slate-800 font-medium' : 'text-slate-400 font-bold flex items-center gap-2 justify-center w-full'}>
                                            {selectedBilling ? `Billing Address: ${selectedBilling}` : <><Plus size={16} /> Add Billing Address</>}
                                        </span>
                                        {selectedBilling && <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>

                                    {isBillingDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                            <div className="p-2 border-b border-slate-100">
                                                <input type="text" placeholder="Search Billing Address" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
                                            </div>
                                            {savedAddresses.filter(a => a.type === 'billing').map(addr => (
                                                <div key={addr.id} onClick={() => { setSelectedBilling(addr.facilityName); setIsBillingDropdownOpen(false); }} className="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                                                    <p className="text-sm font-bold text-slate-800">{addr.facilityName} {addr.gstin ? `(GST: ${addr.gstin})` : ''}</p>
                                                    <p className="text-xs text-slate-500 uppercase mt-1">{addr.addressLine}, {addr.city}, {addr.state}, IN, {addr.pincode}</p>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => { setIsBillingDropdownOpen(false); setModalConfig({ isOpen: true, type: 'billing', pincode: '' }); }}
                                                className="w-full p-3 text-sm text-blue-600 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                                            >
                                                <Plus size={16} /> Create New Address
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 6. Weights & Dimensions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-400" /> Weights & Dimensions
                            </h2>
                            <div className="space-y-4">
                                {localBoxes.map((box) => (
                                    <div key={box.id} className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-20">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Boxes</label>
                                            <input type="number" min="1" value={box.count} onChange={e => updateBox(box.id, 'count', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Box Size (L x B x H) in cm</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={box.l} onChange={e => updateBox(box.id, 'l', e.target.value)} placeholder="L" className={`w-full bg-white border ${!box.l && error.includes('Length') ? 'border-red-500' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-blue-500`} />
                                                <input type="number" value={box.b} onChange={e => updateBox(box.id, 'b', e.target.value)} placeholder="B" className={`w-full bg-white border ${!box.b && error.includes('Width') ? 'border-red-500' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-blue-500`} />
                                                <input type="number" value={box.h} onChange={e => updateBox(box.id, 'h', e.target.value)} placeholder="H" className={`w-full bg-white border ${!box.h && error.includes('Height') ? 'border-red-500' : 'border-slate-200'} rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-blue-500`} />
                                            </div>
                                            {(!box.l || !box.b || !box.h) && error.includes('required field') && (
                                                <p className="text-red-500 text-[10px] mt-1">Length, Width, and Height are required.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <button onClick={handleAddBox} type="button" className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-blue-600 font-bold hover:border-blue-500 hover:bg-blue-50 transition-colors text-xs flex items-center justify-center gap-2">
                                    <Plus size={14} /> Add Another Box Size
                                </button>
                                
                                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500">Total weight</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="number" value={localWeight} onChange={e => setLocalWeight(e.target.value)} className="w-20 border border-slate-300 rounded p-1 text-sm outline-none" />
                                            <span className="text-sm font-bold text-slate-800">Kgs</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Total boxes</p>
                                        <p className="text-sm font-bold text-slate-800 mt-1">{localBoxes.reduce((acc, curr) => acc + parseInt(curr.count || 0), 0)}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleRecalculate}
                                    type="button" 
                                    disabled={isRecalculating}
                                    className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition flex justify-center items-center gap-2 mt-2"
                                >
                                    {isRecalculating ? 'Recalculating...' : 'Recalculate Price'}
                                </button>
                                
                                {/* New Detailed Pricing Summary with Markup */}
                                {currentRate && (
                                    <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <h3 className="text-sm font-bold text-[#0B1E43] mb-3 pb-2 border-b border-slate-200">Pricing Summary</h3>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">Charged Weight</span>
                                                <span className="text-slate-800 font-bold">{currentRate.data?.charged_wt || localWeight} kg</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">Base Freight Charges</span>
                                                <span className="text-slate-800 font-bold">₹{(currentRate.finalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>

                                            <div className="mt-2 mb-2 p-3 bg-white border border-slate-200 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-2">
                                                        <input 
                                                            type="checkbox" 
                                                            id="addMarkup" 
                                                            checked={isMarkupAdded} 
                                                            onChange={(e) => setIsMarkupAdded(e.target.checked)} 
                                                            className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <label htmlFor="addMarkup" className="text-xs font-bold text-[#0B1E43] cursor-pointer">Add Markup</label>
                                                            <p className="text-[10px] text-slate-500">This will be added to the freight charges</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-slate-500 text-sm font-bold mr-1">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={markupValue} 
                                                            onChange={(e) => setMarkupValue(e.target.value)} 
                                                            disabled={!isMarkupAdded}
                                                            className="w-20 border border-slate-200 rounded p-1 text-xs outline-none focus:border-blue-500 text-right disabled:bg-slate-50 disabled:text-slate-400"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-600 font-medium">GST at 18%</span>
                                                <span className="text-slate-800 font-bold">₹{(((currentRate.data?.price_breakup?.gst || 0) + (isMarkupAdded ? (parseFloat(markupValue) || 0) * 0.18 : 0))).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200 text-sm">
                                                <span className="font-black text-[#0B1E43]">Total Amount</span>
                                                <span className="font-black text-[#0B1E43]">
                                                    ₹{((currentRate.finalPrice || 0) + (isMarkupAdded ? (parseFloat(markupValue) || 0) : 0) + (isMarkupAdded ? (parseFloat(markupValue) || 0) * 0.18 : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 7. Upload Documents */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                    <UploadCloud size={16} className="text-slate-400" /> Upload Documents
                                </h2>
                                <span className="text-[10px] font-medium text-slate-400">Max size<br/>20MB</span>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-semibold text-slate-600 block mb-2">
                                    Invoice Document (Mandatory) <span className="text-slate-400 cursor-pointer">ⓘ</span>
                                </label>
                                <label className="block border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors">
                                    <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf,.bmp" onChange={(e) => setInvoiceFile(e.target.files[0])} />
                                    <FileText className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                                    <p className="text-xs font-medium text-blue-600">{invoiceFile ? invoiceFile.name : 'Click to Upload Document (PNG, JPG, PDF)'}</p>
                                    {!invoiceFile && <p className="text-[11px] text-slate-400 mt-1">or drag and drop here</p>}
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-2">Secondary Document (Optional)</label>
                                <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option>Select Document Type</option>
                                    <option>E-way Bill</option>
                                    <option>Others</option>
                                </select>
                                <label className="block border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="file" className="hidden" onChange={(e) => alert(`Selected: ${e.target.files[0].name}. (Secondary files integration later)`)} />
                                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-xs font-medium text-slate-500">Click to Upload Document (PNG, JPG, PDF)</p>
                                    <p className="text-[11px] text-slate-400 mt-1">or drag and drop here</p>
                                </label>
                            </div>
                        </div>

                        {/* Final Review & Action */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-800 mb-6 bg-slate-50 p-4 rounded-xl">
                                <span className="text-slate-500 font-medium">Shipping Mode</span>
                                <span className="uppercase tracking-wider flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4 rotate-180" /> SURFACE
                                </span>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-[#0B1E43] hover:bg-[#1a2d55] text-white py-4 rounded-xl font-bold text-base transition-all disabled:opacity-70 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AddressModal 
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                prefillPincode={modalConfig.pincode}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onSave={handleSaveAddress}
            />
        </div>
    );
};

export default DelhiveryCreateOrder;
