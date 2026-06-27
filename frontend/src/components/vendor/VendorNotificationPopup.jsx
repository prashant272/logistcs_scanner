import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorNotificationPopup = () => {
    const socket = useSocket();
    const navigate = useNavigate();
    const [popupNotif, setPopupNotif] = useState(null);

    const playBeep = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            // Play a pleasant double-beep sequence
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            setTimeout(() => {
                oscillator.frequency.setValueAtTime(1108.73, audioCtx.currentTime); // C#6
            }, 150);
            setTimeout(() => {
                oscillator.stop();
            }, 350);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        // Fetch unread notifications on mount to ensure popup persists until ignored
        const fetchUnread = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) return;
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const unreadEnquiry = data.find(n => !n.isRead && n.link && (n.link.includes('enquiries') || n.link.includes('booking')));
                if (unreadEnquiry) {
                    setPopupNotif(unreadEnquiry);
                }
            } catch (err) {
                console.error("Failed to fetch unread notifications for popup:", err);
            }
        };
        fetchUnread();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNotif = (notif) => {
            // Filter to only show popup for enquiries/bookings
            const isEnquiryOrBooking = notif.link && (notif.link.includes('enquiries') || notif.link.includes('booking'));
            if (isEnquiryOrBooking) {
                setPopupNotif(notif);
                playBeep();
            }
        };
        socket.on('newNotification', handleNotif);
        return () => socket.off('newNotification', handleNotif);
    }, [socket]);

    const handleDismiss = async (shouldNavigate = false) => {
        const notif = popupNotif;
        setPopupNotif(null); // Hide immediately for better UX
        
        // Mark as read in backend if it has an ID
        if (notif && notif._id) {
            try {
                const token = localStorage.getItem('userToken');
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/notifications/${notif._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Failed to mark popup notification as read:", err);
            }
        }

        if (shouldNavigate && notif && notif.link) {
            let finalLink = notif.link;
            if (finalLink.includes('/vendor/enquiries?type=direct')) finalLink = '/vendor/direct-enquiries';
            else if (finalLink.includes('/vendor/enquiries?type=my')) finalLink = '/vendor/my-enquiries';
            else if (finalLink.includes('/vendor/bookings?type=direct')) finalLink = '/vendor/direct-booking';
            else if (finalLink.includes('/vendor/bookings?type=my')) finalLink = '/vendor/my-bookings';
            
            navigate(finalLink);
        }
    };

    if (!popupNotif) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform scale-105 transition-all text-center border-4 border-[#0066FF]/20">
                <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="text-4xl animate-bounce">📦</span>
                </div>
                <h2 className="text-2xl font-black text-[#0B1E43] mb-2 uppercase tracking-tight">New Enquiry Alert</h2>
                <p className="text-slate-600 font-bold mb-8 text-sm leading-relaxed px-4">
                    {popupNotif.message}
                </p>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleDismiss(false)}
                        className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer"
                    >
                        Ignore
                    </button>
                    <button 
                        onClick={() => handleDismiss(true)}
                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#0066FF] to-[#00b2fe] hover:opacity-90 text-white font-black rounded-xl shadow-lg shadow-[#0066FF]/30 uppercase tracking-wider text-xs transition-all cursor-pointer"
                    >
                        See Enquiry
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendorNotificationPopup;
