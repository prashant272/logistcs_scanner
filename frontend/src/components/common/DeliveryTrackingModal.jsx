import React, { useState } from 'react';
import { Copy, Check, CheckCircle2, X } from 'lucide-react';

const DeliveryTrackingModal = ({ trackingInfo, onClose }) => {
    const [copiedAWB, setCopiedAWB] = useState(false);
    const [copiedLR, setCopiedLR] = useState(false);

    if (!trackingInfo) return null;

    const lrNumber = trackingInfo?.data?.lrnum || trackingInfo?.ShipmentData?.[0]?.Shipment?.AWB || 'N/A';
    const awbNumber = trackingInfo?.data?.wbns?.[0]?.wbn || trackingInfo?.ShipmentData?.[0]?.Shipment?.AWB || lrNumber;
    // Extract dates and timeline
    let expectedDateStr = 'Pending';
    let expectedDateObj = null;

    const STATUS_DESCRIPTIONS = {
        'MANIFESTED': 'Shipment created in Delhivery system',
        'PICKED_UP': 'Shipment has been picked from client location',
        'LEFT_ORIGIN': 'Left origin city for the destination',
        'REACH_DESTINATION': 'Reached the destination city for delivery',
        'UNDEL_REATTEMPT': 'Attempted for delivery',
        'PART_DEL': 'Partially Delivered',
        'OFD': 'Out for Dispatch',
        'DELIVERED': 'Delivered to consignee',
        'RETURNED_INTRANSIT': 'Shipment is returned and is In transit to the return center',
        'RECEIVED_AT_RETURN_CENTER': 'Shipment received at return center',
        'RETURN_OFD': 'Return Shipment is out for delivery',
        'RETURN_DELIVERED': 'Return shipment is Delivered',
        'NOT_PICKED': 'Shipment is marked as not picked after multiple failed pickup attempts',
        'LOST': 'Shipment is lost'
    };

    let orderPlaced = null;
    let pickedUp = null;
    let inTransitScans = [];
    let outForDelivery = null;
    let delivered = null;

    const categorizeScan = (status, location, date, desc) => {
        const s = (status || '').toLowerCase();
        const d = (desc || '').toLowerCase();
        const scanObj = { status, location, date, desc };

        if (s.includes('manifest') || d.includes('manifest') || s === 'order placed') {
            if (!orderPlaced || date < orderPlaced.date) orderPlaced = scanObj;
        } else if (s.includes('pick') || d.includes('pick')) {
            if (!pickedUp || date < pickedUp.date) pickedUp = scanObj;
        } else if (s.includes('out for delivery') || d.includes('out for delivery') || s === 'ofd') {
            if (!outForDelivery || date > outForDelivery.date) outForDelivery = scanObj;
        } else if (s.includes('deliver') || d.includes('deliver') || s.includes('reach_destination')) {
            if (!delivered || date > delivered.date) delivered = scanObj;
        } else {
            inTransitScans.push(scanObj);
        }
    };

    if (trackingInfo?.data?.wbns) {
        trackingInfo.data.wbns.forEach(wbn => {
            if (wbn.estimated_date) expectedDateObj = new Date(wbn.estimated_date);
            
            if (wbn.manifested_date) categorizeScan("Order Placed", wbn.location || "", new Date(wbn.manifested_date), "Shipment manifested");
            if (wbn.pickup_date) categorizeScan("Picked Up", wbn.location || "", new Date(wbn.pickup_date), "Shipment picked up");
            
            if (wbn.status) {
                categorizeScan(wbn.status, wbn.location || "", new Date(wbn.scan_timestamp || new Date()), wbn.scan_remark || wbn.status);
            }
            if (wbn.delivered_date) {
                 categorizeScan("Delivered", wbn.location || "", new Date(wbn.delivered_date), "Shipment delivered");
            }
        });
    } else if (trackingInfo?.ShipmentData?.[0]?.Shipment?.Scans) {
        const shipment = trackingInfo.ShipmentData[0].Shipment;
        if (shipment.ExpectedDeliveryDate) expectedDateObj = new Date(shipment.ExpectedDeliveryDate);
        
        shipment.Scans.forEach(scan => {
            categorizeScan(
                scan.ScanDetail?.ScanType || scan.ScanDetail?.Scan || 'Unknown',
                scan.ScanDetail?.ScannedLocation || '',
                scan.ScanDetail?.ScanDateTime ? new Date(scan.ScanDetail.ScanDateTime) : new Date(),
                scan.ScanDetail?.Instructions || scan.ScanDetail?.Scan || ''
            );
        });
    }

    // Sort transit scans
    inTransitScans.sort((a, b) => a.date - b.date);
    const latestTransit = inTransitScans.length > 0 ? inTransitScans[inTransitScans.length - 1] : null;

    if (expectedDateObj) {
        expectedDateStr = expectedDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Fallbacks if some events are missing but later ones exist
    if (!orderPlaced && (pickedUp || latestTransit || outForDelivery || delivered)) {
        orderPlaced = { date: pickedUp?.date || new Date() }; // Approximation to ensure the UI flows nicely
    }

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'awb') {
            setCopiedAWB(true);
            setTimeout(() => setCopiedAWB(false), 2000);
        } else {
            setCopiedLR(true);
            setTimeout(() => setCopiedLR(false), 2000);
        }
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        return dateObj.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    let pickedDateStr = 'Pending';
    if (pickedUp && pickedUp.date) {
        pickedDateStr = pickedUp.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Current State Flags
    const isDelivered = !!delivered;
    const isOFD = !!outForDelivery || isDelivered;
    const isTransit = !!latestTransit || isOFD;
    const isPicked = !!pickedUp || isTransit;
    const isPlaced = !!orderPlaced || isPicked;

    // Determine the "active/pulsing" step
    let activeStep = 'placed';
    if (isDelivered) activeStep = 'delivered';
    else if (isOFD) activeStep = 'ofd';
    else if (isTransit) activeStep = 'transit';
    else if (isPicked) activeStep = 'picked';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 font-sans pt-20">
            <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white/20">
                
                <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
                    
                    {/* Header Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border-t-4 border-t-[#d32f2f] relative">
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="mb-8 mt-2 grid grid-cols-2 gap-4">
                            <div>
                                <span className="bg-[#4a72d4] text-white text-[11px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider">
                                    Expected Delivery Date
                                </span>
                                <div className="mt-3 text-2xl md:text-3xl font-extrabold text-[#3d5ed1]">
                                    {expectedDateStr}
                                </div>
                            </div>
                            <div>
                                <span className="bg-[#1b8c66] text-white text-[11px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider">
                                    Picked Date
                                </span>
                                <div className="mt-3 text-2xl md:text-3xl font-extrabold text-[#1b8c66]">
                                    {pickedDateStr}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider w-24">AWB</span>
                                <span className="text-sm font-bold text-slate-700">#{awbNumber}</span>
                                <button onClick={() => copyToClipboard(awbNumber, 'awb')} className="text-slate-400 hover:text-[#3d5ed1] transition-colors">
                                    {copiedAWB ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider w-24">LR NUMBER</span>
                                <span className="text-sm font-bold text-[#e6a840]">#{lrNumber}</span>
                                <button onClick={() => copyToClipboard(lrNumber, 'lr')} className="text-slate-400 hover:text-[#e6a840] transition-colors">
                                    {copiedLR ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>



                    {/* Timeline */}
                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                        
                        {!isPlaced ? (
                            <div className="text-center text-slate-500 py-8 font-bold text-sm">No tracking data available yet.</div>
                        ) : (
                            <div className="pl-2">
                                {/* Step 1: Order Placed */}
                                <div className="flex gap-5 relative mb-8">
                                    <div className="flex flex-col items-center">
                                        <div className="relative mt-1 z-10 flex items-center justify-center">
                                            {activeStep === 'placed' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-[#e8f5f0] absolute"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1b8c66] relative"></div>
                                                </>
                                            ) : (
                                                <div className={`w-3.5 h-3.5 rounded-full ${isPlaced ? 'bg-[#1b8c66]' : 'bg-slate-300'}`}></div>
                                            )}
                                        </div>
                                        <div className={`w-0.5 h-full absolute top-5 bottom-[-32px] ${isPicked ? 'bg-[#1b8c66]' : 'bg-slate-200'}`}></div>
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isPlaced ? 'text-gray-900' : 'text-gray-400'}`}>
                                            Order Placed {orderPlaced?.date && <span className="text-xs font-normal text-gray-500 ml-1">| {formatDate(orderPlaced.date)}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Picked Up */}
                                <div className="flex gap-5 relative mb-8">
                                    <div className="flex flex-col items-center">
                                        <div className="relative mt-1 z-10 flex items-center justify-center">
                                            {activeStep === 'picked' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-[#e8f5f0] absolute"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1b8c66] relative"></div>
                                                </>
                                            ) : (
                                                <div className={`w-3.5 h-3.5 rounded-full ${isPicked ? 'bg-[#1b8c66]' : 'bg-slate-300'}`}></div>
                                            )}
                                        </div>
                                        <div className={`w-0.5 h-full absolute top-5 bottom-[-32px] ${isTransit ? 'bg-[#1b8c66]' : 'bg-slate-200'}`}></div>
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isPicked ? 'text-gray-900' : 'text-gray-400'}`}>
                                            Picked Up {pickedUp?.date && <span className="text-xs font-normal text-gray-500 ml-1">| {formatDate(pickedUp.date)}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: On the Way */}
                                <div className="flex gap-5 relative mb-8">
                                    <div className="flex flex-col items-center">
                                        <div className="relative mt-1 z-10 flex items-center justify-center">
                                            {activeStep === 'transit' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-[#e8f5f0] absolute"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1b8c66] relative"></div>
                                                </>
                                            ) : (
                                                <div className={`w-3.5 h-3.5 rounded-full ${isTransit ? 'bg-[#1b8c66]' : 'bg-slate-300'}`}></div>
                                            )}
                                        </div>
                                        <div className={`w-0.5 h-full absolute top-5 bottom-[-32px] ${isOFD ? 'bg-[#1b8c66]' : isTransit ? 'bg-gradient-to-b from-[#1b8c66] to-slate-200' : 'bg-slate-200'}`}></div>
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isTransit ? 'text-gray-900' : 'text-gray-400'}`}>On the Way</div>
                                        {latestTransit && (
                                            <div className="mt-1">
                                                <p className={`text-sm ${isTransit ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {STATUS_DESCRIPTIONS[latestTransit.status] || latestTransit.status} {latestTransit.location && `| ${latestTransit.location}`}
                                                </p>
                                                <p className="text-[11px] text-gray-500 italic mt-0.5 mb-2">
                                                    {formatDate(latestTransit.date)}
                                                </p>
                                                {trackingInfo?.manual_location && (
                                                    <div className="mt-2 bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
                                                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Current Location</span>
                                                        <span className="text-[14px] font-bold text-gray-800">{trackingInfo.manual_location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 4: Out for Delivery */}
                                <div className="flex gap-5 relative mb-8">
                                    <div className="flex flex-col items-center">
                                        <div className="relative mt-1 z-10 flex items-center justify-center">
                                            {activeStep === 'ofd' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-[#e8f5f0] absolute"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1b8c66] relative"></div>
                                                </>
                                            ) : (
                                                <div className={`w-3.5 h-3.5 rounded-full ${isOFD ? 'bg-[#1b8c66]' : 'bg-slate-300'}`}></div>
                                            )}
                                        </div>
                                        <div className={`w-0.5 h-full absolute top-5 bottom-[-32px] ${isDelivered ? 'bg-[#1b8c66]' : 'bg-slate-200'}`}></div>
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isOFD ? 'text-gray-900' : 'text-gray-400'}`}>
                                            Out for Delivery {outForDelivery?.date && <span className="text-xs font-normal text-gray-500 ml-1">| {formatDate(outForDelivery.date)}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 5: Delivered */}
                                <div className="flex gap-5 relative">
                                    <div className="flex flex-col items-center">
                                        <div className="relative mt-1 z-10 flex items-center justify-center">
                                            {activeStep === 'delivered' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-[#e8f5f0] absolute"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1b8c66] relative"></div>
                                                </>
                                            ) : (
                                                <div className={`w-3.5 h-3.5 rounded-full ${isDelivered ? 'bg-[#1b8c66]' : 'bg-slate-300'}`}></div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`text-[15px] font-bold ${isDelivered ? 'text-gray-900' : 'text-gray-400'}`}>
                                            Delivered {delivered?.date && <span className="text-xs font-normal text-gray-500 ml-1">| {formatDate(delivered.date)}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTrackingModal;
