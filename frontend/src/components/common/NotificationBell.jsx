import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const socket = useSocket();
    
    useEffect(() => {
        // Fetch existing notifications
        const fetchNotifications = async () => {
            try {
                // Determine which token to use (vendor/customer vs admin)
                const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
                if (token) {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setNotifications(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('newNotification', (notif) => {
                setNotifications(prev => [notif, ...prev]);
            });

            return () => {
                socket.off('newNotification');
            };
        }
    }, [socket]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead && notif._id) {
            try {
                const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
                await axios.put(`${import.meta.env.VITE_API_BASE_URL}/notifications/${notif._id}/read`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Failed to mark read:", error);
            }
        }
        
        // Mark as read locally
        setNotifications(prev => prev.map(n => n === notif ? { ...n, isRead: true } : n));
        setIsOpen(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm flex flex-col items-center">
                                <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
                                You're all caught up!
                            </div>
                        ) : (
                            notifications.map((notif, index) => (
                                <div 
                                    key={notif._id || index}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                >
                                    <p className={`text-sm ${!notif.isRead ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {new Date(notif.createdAt || Date.now()).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
