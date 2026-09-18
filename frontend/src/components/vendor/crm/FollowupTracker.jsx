import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { Clock, PhoneCall, X } from 'lucide-react';

const FollowupTracker = () => {
    const [todaysFollowUps, setTodaysFollowUps] = useState([]);
    
    useEffect(() => {
        const fetchFollowups = async () => {
            try {
                const res = await api.get('/crm/vendor/followups');
                if (res.data.success) {
                    setTodaysFollowUps(res.data.todaysFollowUps);
                }
            } catch (error) {
                console.error("Failed to fetch followups for tracker", error);
            }
        };

        fetchFollowups();
        // Check for updates every 5 minutes
        const fetchInterval = setInterval(fetchFollowups, 5 * 60 * 1000);
        return () => clearInterval(fetchInterval);
    }, []);

    useEffect(() => {
        if (todaysFollowUps.length === 0) return;

        const checkFollowups = () => {
            const now = new Date();
            
            todaysFollowUps.forEach(lead => {
                const fDate = new Date(lead.followUpDate);
                
                // If it's time (within this exact minute)
                if (
                    fDate.getHours() === now.getHours() && 
                    fDate.getMinutes() === now.getMinutes() &&
                    fDate.getDate() === now.getDate() &&
                    fDate.getMonth() === now.getMonth()
                ) {
                    // Prevent showing multiple times if interval hits twice in a minute
                    const toastId = `followup-${lead._id}-${fDate.getTime()}`;
                    
                    toast.custom((t) => (
                        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <PhoneCall className="text-amber-600" size={20} />
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-black text-slate-900">
                                            Follow-up Reminder!
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 font-medium">
                                            It's time to contact <span className="font-bold text-amber-600">{lead.clientInfo?.company || lead.clientInfo?.name}</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-slate-200">
                                <button
                                    onClick={() => toast.dismiss(t.id)}
                                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ), {
                        id: toastId,
                        duration: 30000, // Show for 30 seconds
                        position: 'top-right'
                    });
                }
            });
        };

        // Check every 30 seconds
        const checkInterval = setInterval(checkFollowups, 30000);
        return () => clearInterval(checkInterval);
    }, [todaysFollowUps]);

    return null; // This component doesn't render any visible DOM directly
};

export default FollowupTracker;
