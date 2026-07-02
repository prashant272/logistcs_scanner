import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle } from 'lucide-react';

const DelhiverySettings = () => {
    const [config, setConfig] = useState({
        username: '',
        password: '',
        vendor_margin_percent: 10,
        customer_margin_percent: 20,
        is_production: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setConfig({
                    username: res.data.username || '',
                    password: res.data.password || '',
                    vendor_margin_percent: res.data.vendor_margin_percent || 10,
                    customer_margin_percent: res.data.customer_margin_percent || 20,
                    is_production: res.data.is_production || false
                });
            }
        } catch (error) {
            console.error("Failed to load config", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/delhivery/admin/config`, config, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Settings saved successfully. Token will be regenerated on next request if credentials changed.');
            setTimeout(() => setMessage(''), 5000);
        } catch (error) {
            setMessage('Failed to save settings: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Delhivery API Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Configure credentials and pricing margins for PTL bookings.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{message}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                
                {/* Credentials Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">API Credentials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Username</label>
                            <input 
                                type="text" 
                                value={config.username}
                                onChange={(e) => setConfig({...config, username: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                                placeholder="Delhivery API Username"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                            <input 
                                type="password" 
                                value={config.password}
                                onChange={(e) => setConfig({...config, password: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20"
                                placeholder="Delhivery API Password"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <input 
                            type="checkbox" 
                            id="is_prod"
                            checked={config.is_production}
                            onChange={(e) => setConfig({...config, is_production: e.target.checked})}
                            className="w-4 h-4 text-[#0066FF] rounded focus:ring-[#0066FF]"
                        />
                        <label htmlFor="is_prod" className="text-sm font-medium text-slate-700">
                            Use Production Environment (Uncheck for Staging/Test)
                        </label>
                    </div>
                </div>

                {/* Margins Section */}
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Pricing Margins</h2>
                    <p className="text-xs text-slate-500">Set the percentage to add to the base Delhivery freight cost before displaying it to the user.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Margin (%)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={config.vendor_margin_percent}
                                    onChange={(e) => setConfig({...config, vendor_margin_percent: Number(e.target.value)})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Margin (%)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={config.customer_margin_percent}
                                    onChange={(e) => setConfig({...config, customer_margin_percent: Number(e.target.value)})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-95 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-[#0066FF]/10 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DelhiverySettings;
