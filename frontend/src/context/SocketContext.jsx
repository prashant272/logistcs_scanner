import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Request browser notification permissions
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const newSocket = io(import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, ''), {
            path: '/api/socket.io',
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket) {
            const adminToken = sessionStorage.getItem('adminToken');
            
            if (user) {
                socket.emit('register', user.id || user._id);
                if (user.role === 'admin') {
                    socket.emit('joinAdminRoom');
                }
            } else if (adminToken) {
                socket.emit('register', 'ad0000000000000000000000');
                socket.emit('joinAdminRoom');
            } else {
                return; // Not logged in
            }

            const handleNewNotification = (notification) => {
                // Show in-app toast
                toast(notification.message, {
                    icon: notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : '🔔',
                    duration: 5000,
                });

                // Show native browser notification if granted
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("Logistics Scanner", {
                        body: notification.message,
                        icon: "/vite.svg" // Replace with actual logo path
                    });
                }
            };

            socket.on('newNotification', handleNewNotification);

            return () => {
                socket.off('newNotification', handleNewNotification);
            };
        }
    }, [socket, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
