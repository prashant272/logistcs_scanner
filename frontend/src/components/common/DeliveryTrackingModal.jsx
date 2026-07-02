import React from 'react';
import { Box, MapPin, Truck } from 'lucide-react';

const DeliveryTrackingModal = ({ trackingInfo, onClose }) => {
    if (!trackingInfo) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_24px_60px_rgba(11,30,67,0.15)] border border-slate-100 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-base font-black text-[#0B1E43] tracking-tight">Shipment Tracking</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">AWB: {trackingInfo.ShipmentData?.[0]?.Shipment?.AWB || 'N/A'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                        <span className="text-xl">&times;</span>
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {trackingInfo.ShipmentData?.[0]?.Shipment?.Scans?.map((scan, idx) => (
                        <div key={idx} className="flex gap-4 relative">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0 border border-blue-100 z-10">
                                    {idx === 0 ? <Box size={14} /> : <Truck size={14} />}
                                </div>
                                {idx !== trackingInfo.ShipmentData[0].Shipment.Scans.length - 1 && (
                                    <div className="w-0.5 h-full bg-slate-100 absolute top-8 bottom-[-16px]"></div>
                                )}
                            </div>
                            <div className="pb-4">
                                <h4 className="text-sm font-bold text-slate-800">{scan.ScanDetail.ScanType}</h4>
                                <p className="text-xs text-slate-500 mt-1">{scan.ScanDetail.Instructions || scan.ScanDetail.Scan}</p>
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                    <MapPin size={10} />
                                    <span>{scan.ScanDetail.ScannedLocation}</span>
                                    <span className="ml-2">{new Date(scan.ScanDetail.ScanDateTime).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )) || (
                        <div className="text-center text-slate-500 text-sm py-4">No tracking data available yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryTrackingModal;
