import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import DeliveryTrackingModal from '../../components/common/DeliveryTrackingModal';

const TrackPtl = () => {
    const [lrn, setLrn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [trackingInfo, setTrackingInfo] = useState(null);

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!lrn.trim()) {
            setError('Please enter a valid LR Number');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/track/${lrn.trim()}`);
            setTrackingInfo(res.data);
        } catch (err) {
            setError('Failed to fetch tracking details. Please ensure the LR number is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f7fc] font-sans flex flex-col items-center justify-center p-6 relative z-10">
            {/* Background Decor */}
            <div className="absolute top-0 w-full h-72 bg-gradient-to-b from-[#0B1E43] to-[#f4f7fc] -z-10" />

            <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Track PTL Booking</h1>
                <p className="text-sm font-semibold text-slate-500 mb-8">Enter your Delhivery LR (Waybill) Number to track your shipment.</p>

                <form onSubmit={handleTrack} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Enter LR Number / AWB"
                            value={lrn}
                            onChange={(e) => setLrn(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0066FF] transition-all"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold text-left pl-2">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0066FF] hover:bg-[#0052cc] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Tracking...
                            </>
                        ) : 'Track Shipment'}
                    </button>
                </form>
            </div>

            {trackingInfo && (
                <DeliveryTrackingModal 
                    trackingInfo={trackingInfo} 
                    onClose={() => setTrackingInfo(null)} 
                />
            )}
        </div>
    );
};

export default TrackPtl;
