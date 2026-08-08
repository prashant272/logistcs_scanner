import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Trash2, Save, MapPin, Edit } from 'lucide-react';

const ManualTracking = () => {
    const [trackers, setTrackers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ lr_number: '', custom_location: '' });

    const fetchTrackers = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('adminToken');
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/manual-tracking`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrackers(response.data);
        } catch (error) {
            console.error('Error fetching trackers:', error);
            toast.error('Failed to load tracking overrides');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('adminToken');
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/manual-tracking`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Custom location saved successfully!');
            setFormData({ lr_number: '', custom_location: '' });
            fetchTrackers();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save custom location');
        }
    };

    const handleDelete = async (lrn) => {
        if (!window.confirm('Are you sure you want to remove this custom location?')) return;
        try {
            const token = sessionStorage.getItem('adminToken');
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/manual-tracking/${lrn}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Custom location removed');
            fetchTrackers();
        } catch (error) {
            console.error('Error removing:', error);
            toast.error('Failed to remove custom location');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="text-blue-500" size={24} />
                Manual Tracking Overrides
            </h2>

            <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">LR Number</label>
                    <input 
                        type="text" 
                        name="lr_number"
                        value={formData.lr_number}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 298650811"
                    />
                </div>
                <div className="flex-[2]">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Custom Location</label>
                    <input 
                        type="text" 
                        name="custom_location"
                        value={formData.custom_location}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Bilaspur-HR Hub"
                    />
                </div>
                <button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors h-[42px]"
                >
                    <Save size={18} />
                    Save Location
                </button>
            </form>

            <div>
                <h3 className="font-semibold text-slate-700 mb-4">Active Custom Locations</h3>
                {loading ? (
                    <div className="text-center text-slate-500 py-8">Loading...</div>
                ) : trackers.length === 0 ? (
                    <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        No manual tracking locations added yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-sm">
                                    <th className="py-3 px-4 font-semibold rounded-tl-lg">LR Number</th>
                                    <th className="py-3 px-4 font-semibold">Custom Location</th>
                                    <th className="py-3 px-4 font-semibold">Added At</th>
                                    <th className="py-3 px-4 font-semibold rounded-tr-lg w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trackers.map(tracker => (
                                    <tr key={tracker._id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 px-4 font-bold text-slate-700">{tracker.lr_number}</td>
                                        <td className="py-3 px-4 text-slate-600">{tracker.custom_location}</td>
                                        <td className="py-3 px-4 text-slate-500 text-sm">
                                            {new Date(tracker.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setFormData({
                                                        lr_number: tracker.lr_number,
                                                        custom_location: tracker.custom_location
                                                    });
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(tracker.lr_number)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualTracking;
