import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CustomerSidebar from '../../components/customer/CustomerSidebar';
import CustomerHeader from '../../components/customer/CustomerHeader';

const CustomerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        navigate('/', { replace: true });
        setTimeout(() => {
            logout();
        }, 0);
    };

    return (
        <div className="w-full h-screen bg-[#f4f7fc] text-slate-800 font-sans flex overflow-hidden">
            
            {/* Customer Sidebar Component */}
            <CustomerSidebar 
                isSidebarOpen={isSidebarOpen} 
                logout={handleLogout} 
            />

            {/* Main Content Wrap */}
            <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
                
                {/* Customer Header Component */}
                <CustomerHeader 
                    isSidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    user={user} 
                    logout={handleLogout} 
                />

                {/* Scrollable Dashboard Body */}
                <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default CustomerDashboard;
