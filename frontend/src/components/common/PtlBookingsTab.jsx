import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageSearch, Search, Filter, Box, MapPin, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DeliveryTrackingModal from './DeliveryTrackingModal';

const PtlBookingsTab = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/my-bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (error) {
            console.error("Failed to load PTL bookings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrack = async (lrn) => {
        if (!lrn) return;
        try {
            const token = localStorage.getItem('userToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/track/${lrn}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrackingInfo(res.data);
            setIsTrackingModalOpen(true);
        } catch (error) {
            console.error("Failed to track", error);
            alert("Tracking information unavailable currently.");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold text-sm">Loading PTL Bookings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My PTL Bookings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track your Part Truck Load shipments.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            id="global-lr-input"
                            placeholder="Enter LR Number to track..." 
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    handleTrack(e.target.value.trim());
                                }
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            const val = document.getElementById('global-lr-input')?.value.trim();
                            if (val) handleTrack(val);
                        }}
                        className="bg-[#0066FF] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#0052cc] transition-colors whitespace-nowrap"
                    >
                        Track
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">LR Number</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <PackageSearch className="w-12 h-12 text-slate-200 mb-3" />
                                            <p className="text-sm font-medium">No PTL bookings found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {new Date(booking.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                            <span>{booking.origin_pin}</span>
                                            <span className="text-[#0066FF] font-bold">→</span>
                                            <span>{booking.dest_pin}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">{booking.weight_g / 1000} KG</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.delhivery_lr_number ? (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold font-mono">
                                                {booking.delhivery_lr_number}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-800">₹{booking.charged_price || 0}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            booking.delhivery_status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            booking.delhivery_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {booking.delhivery_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {booking.delhivery_lr_number && (
                                            <button 
                                                onClick={() => handleTrack(booking.delhivery_lr_number)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Track
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tracking Modal */}
            {isTrackingModalOpen && (
                <DeliveryTrackingModal 
                    trackingInfo={trackingInfo} 
                    onClose={() => setIsTrackingModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default PtlBookingsTab;
