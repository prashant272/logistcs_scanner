import React, { useState } from 'react';
import { Clock, Send, X } from 'lucide-react';

const RMEnquiryModal = ({ isOpen, onClose, onSubmit }) => {
    const [action, setAction] = useState('broadcast'); // 'broadcast' or 'schedule'
    const [scheduledTime, setScheduledTime] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (action === 'schedule' && !scheduledTime) {
            alert('Please select a scheduled time');
            return;
        }
        
        let isoTime = null;
        if (action === 'schedule') {
            isoTime = new Date(scheduledTime).toISOString();
        }
        
        onSubmit({
            broadcastNow: action === 'broadcast',
            scheduledTime: isoTime
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                    <X size={16} />
                </button>
                
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-800 mb-1">Enquiry Action (RM)</h2>
                    <p className="text-sm font-bold text-slate-500 mb-6">How do you want to handle this enquiry?</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => setAction('broadcast')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                action === 'broadcast' 
                                ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Send size={24} className={action === 'broadcast' ? 'text-blue-600' : 'text-slate-400'} />
                            <span className="text-sm font-bold">Broadcast Now</span>
                        </button>
                        
                        <button
                            onClick={() => setAction('schedule')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                action === 'schedule' 
                                ? 'border-purple-600 bg-purple-50 text-purple-700' 
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Clock size={24} className={action === 'schedule' ? 'text-purple-600' : 'text-slate-400'} />
                            <span className="text-sm font-bold">Schedule</span>
                        </button>
                    </div>

                    {action === 'schedule' && (
                        <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Select Date & Time</label>
                            <input
                                type="datetime-local"
                                value={scheduledTime}
                                onClick={(e) => {
                                    try {
                                        e.target.showPicker();
                                    } catch (err) {
                                        // Ignore if browser doesn't support showPicker()
                                    }
                                }}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all cursor-pointer"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        className={`w-full py-3.5 rounded-xl text-white text-sm font-black tracking-wide uppercase transition-all shadow-lg ${
                            action === 'broadcast' 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' 
                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                        }`}
                    >
                        {action === 'broadcast' ? 'Broadcast to Vendors' : 'Schedule Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RMEnquiryModal;
