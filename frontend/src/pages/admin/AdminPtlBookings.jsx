import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PackageSearch, Search, Filter } from 'lucide-react';
import DeliveryTrackingModal from '../../components/common/DeliveryTrackingModal';

const AdminPtlBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Tracking Modal
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

    // Pickup Modal
    const [pickupModalOpen, setPickupModalOpen] = useState(false);
    const [selectedBookingForPickup, setSelectedBookingForPickup] = useState(null);
    const [pickupData, setPickupData] = useState({
        pickup_date: '',
        start_time: '10:00:00',
        expected_package_count: 1
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleTrack = async (lrn) => {
        if (!lrn) return;
        try {
            const token = sessionStorage.getItem('adminToken');
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

    const fetchBookings = async () => {
        try {
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data.data || res.data);
        } catch (error) {
            console.error("Failed to load PTL bookings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSchedulePickupSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('adminToken');
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/pickup/${selectedBookingForPickup.delhivery_lr_number}`, {
                pickup_date: pickupData.pickup_date,
                start_time: pickupData.start_time,
                expected_package_count: pickupData.expected_package_count
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Pickup Scheduled successfully! Pickup ID: ${res.data?.data?.data?.pickup_id || 'N/A'}`);
            setPickupModalOpen(false);
            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to schedule pickup');
        }
    };

    const openPickupModal = (booking) => {
        setSelectedBookingForPickup(booking);
        const d = new Date();
        d.setDate(d.getDate() + 1); // default to tomorrow
        const defaultDate = d.toISOString().split('T')[0];
        setPickupData({
            pickup_date: defaultDate,
            start_time: '10:00:00',
            expected_package_count: 1
        });
        setPickupModalOpen(true);
    };

    if (isLoading) return <div className="p-8">Loading bookings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">PTL Bookings (Delhivery)</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track all Part Truck Load shipments.</p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            id="admin-global-lr-input"
                            placeholder="Enter LR Number to track..." 
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    handleTrack(e.target.value.trim());
                                }
                            }}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            const val = document.getElementById('admin-global-lr-input')?.value.trim();
                            if (val) handleTrack(val);
                        }}
                        className="bg-[#0066FF] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#0052cc] transition-colors whitespace-nowrap flex items-center gap-2"
                    >
                        Track LR
                    </button>
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors ml-2">
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">LR Number</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
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
                                        <div className="text-sm font-bold text-slate-800">{booking.user_id?.name || 'Unknown User'}</div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{booking.user_role || booking.user_model || 'VENDOR'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-slate-800">
                                            {booking.origin_pin} <span className="text-slate-400 mx-1">→</span> {booking.dest_pin}
                                        </div>
                                        <div className="text-xs text-slate-500">{booking.weight_g >= 1000 ? `${(booking.weight_g / 1000).toFixed(1)} KG` : `${booking.weight_g} gm`}</div>
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
                                        <div className="font-bold text-slate-800 text-sm">Total: ₹{booking.total_amount || booking.charged_price || 0}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">Del. Base: ₹{booking.base_price || 0}</div>
                                        <div className="text-[10px] text-blue-600 font-bold">Platform Fee: ₹{((booking.charged_price || 0) - (booking.base_price || 0)).toFixed(2)}</div>
                                        {(booking.vendor_markup_fee > 0) && (
                                            <div className="text-[10px] font-bold text-green-600 mt-0.5">Vendor Markup: ₹{booking.vendor_markup_fee}</div>
                                        )}
                                        {(booking.gst_amount > 0) && (
                                            <div className="text-[10px] text-slate-500">GST: ₹{booking.gst_amount.toFixed(2)}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            booking.delhivery_status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            booking.delhivery_status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            booking.delhivery_status === 'BOOKED' ? 'bg-blue-100 text-blue-700' :
                                            booking.delhivery_status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {booking.delhivery_status}
                                        </span>
                                        {booking.delhivery_status === 'FAILED' && booking.failure_reason && (
                                            <div className="text-[10px] text-red-600 mt-2 max-w-[150px] mx-auto leading-tight">
                                                {booking.failure_reason}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {booking.delhivery_lr_number ? (
                                            <div className="flex flex-col gap-2 w-28 mx-auto">
                                                <button 
                                                    onClick={() => handleTrack(booking.delhivery_lr_number)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full"
                                                >
                                                    Track
                                                </button>
                                                
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            const token = sessionStorage.getItem('adminToken');
                                                            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/label/${booking.delhivery_lr_number}`, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            if (res.data?.images && res.data.images.length > 0) {
                                                                const printWindow = window.open('', '_blank');
                                                                printWindow.document.write('<html><head><title>Print Shipping Label</title></head><body style="margin:0;padding:0;text-align:center;">');
                                                                res.data.images.forEach(imgData => {
                                                                    printWindow.document.write(`<img src="${imgData}" style="max-width:100%; height:auto; page-break-after: always; margin-bottom: 20px;" />`);
                                                                });
                                                                printWindow.document.write('</body></html>');
                                                                printWindow.document.close();
                                                                setTimeout(() => { printWindow.print(); }, 500);
                                                            } else if (res.data?.packages?.[0]?.packing_slip) {
                                                                window.open(res.data.packages[0].packing_slip, '_blank');
                                                            } else {
                                                                alert('Sticker URL not found in response');
                                                            }
                                                        } catch (e) {
                                                            alert("Failed to fetch sticker");
                                                            console.error(e);
                                                        }
                                                    }}
                                                    className="bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full whitespace-nowrap"
                                                >
                                                    Print Sticker
                                                </button>
                                                
                                                {['PENDING', 'PROCESSING', 'BOOKED'].includes(booking.delhivery_status?.toUpperCase()) && (
                                                    <button 
                                                        onClick={async () => {
                                                            if(window.confirm('Are you sure you want to cancel this order?')) {
                                                                try {
                                                                    const token = sessionStorage.getItem('adminToken');
                                                                    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delhivery/cancel/${booking.delhivery_lr_number}`, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    alert('Order Cancelled Successfully');
                                                                    fetchBookings();
                                                                } catch (e) {
                                                                    alert(e.response?.data?.message || 'Failed to cancel order');
                                                                }
                                                            }
                                                        }}
                                                        className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full whitespace-nowrap"
                                                    >
                                                        Cancel Order
                                                    </button>
                                                )}

                                                {['BOOKED', 'PROCESSING'].includes(booking.delhivery_status?.toUpperCase()) && !booking.delhivery_pickup_id && (
                                                    <button 
                                                        onClick={() => openPickupModal(booking)}
                                                        className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full whitespace-nowrap"
                                                    >
                                                        Schedule Pickup
                                                    </button>
                                                )}
                                                {booking.delhivery_pickup_id && (
                                                    <span className="text-[10px] text-slate-500 text-center font-medium bg-slate-50 py-1 rounded">
                                                        Pickup: {booking.delhivery_pickup_id}
                                                    </span>
                                                )}
                                            </div>
                                        ) : ((booking.delhivery_status === 'PROCESSING' || booking.delhivery_status === 'PENDING') && booking.delhivery_job_id) ? (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const token = sessionStorage.getItem('adminToken');
                                                        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/manifest/status/${booking.delhivery_job_id}`, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        alert('Status updated successfully! Please reload.');
                                                        fetchBookings();
                                                    } catch (e) {
                                                        alert(e.response?.data?.message || "Failed to update status");
                                                    }
                                                }}
                                                className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full whitespace-nowrap mx-auto block"
                                            >
                                                Refresh Status
                                            </button>
                                        ) : null}
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

            {/* Pickup Modal */}
            {pickupModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800">Schedule Pickup</h3>
                            <button onClick={() => setPickupModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSchedulePickupSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pickup Date (YYYY-MM-DD)</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={pickupData.pickup_date}
                                        onChange={(e) => setPickupData({...pickupData, pickup_date: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        step="1"
                                        value={pickupData.start_time}
                                        onChange={(e) => setPickupData({...pickupData, start_time: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition-all text-sm"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Recommended format: HH:MM:SS</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Total Number of Boxes</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        required
                                        value={pickupData.expected_package_count}
                                        onChange={(e) => setPickupData({...pickupData, expected_package_count: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition-all text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setPickupModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#0066FF] text-white rounded-xl font-bold hover:bg-[#0052cc] transition-colors shadow-sm"
                                >
                                    Confirm Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPtlBookings;
