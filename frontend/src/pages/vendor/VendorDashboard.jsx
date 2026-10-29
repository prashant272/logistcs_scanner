import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VendorSidebar from '../../components/vendor/VendorSidebar';
import VendorHeader from '../../components/vendor/VendorHeader';
import VendorNotificationPopup from '../../components/vendor/VendorNotificationPopup';
import PreApprovedPopup from '../../components/vendor/PreApprovedPopup';
import FreeVendorRMPopup from '../../components/vendor/FreeVendorRMPopup';
import FollowupTracker from '../../components/vendor/crm/FollowupTracker';
import AdBanner from '../../components/shared/AdBanner';

const VendorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [searchQuery, setSearchQuery] = useState('');

    const vendorTypes = user?.vendorTypes || ['Freight forwarder'];
    const isOnlyPtlFranchise = vendorTypes.length === 1 && vendorTypes.includes('PTL Franchise partner');

    const handleLogout = () => {
        navigate('/', { replace: true });
        setTimeout(() => {
            logout();
        }, 0);
    };

    const location = useLocation();
    const isEnquiriesTab = ['/vendor/my-enquiries', '/vendor/direct-enquiries', '/vendor/b2b-enquiries'].includes(location.pathname);

    return (
        <div className="w-full h-screen bg-[#f4f7fc] text-slate-800 font-sans flex overflow-hidden">
            
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* Sidebar Component */}
            <VendorSidebar 
                isSidebarOpen={isSidebarOpen} 
                logout={handleLogout} 
                user={user} 
            />

            {/* Main Content Wrap */}
            <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
                
                {/* Header Component */}
                <VendorHeader 
                    isSidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    user={user} 
                    logout={handleLogout} 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                />

                {/* Scrollable Dashboard Body */}
                <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto">
                    {/* Automatic Top Ad Banner for whatever vendor route is active */}
                    {!isEnquiriesTab && (
                        <AdBanner pageUrl={location.pathname} placement="top" />
                    )}
                    <Outlet />
                </main>

                {!isOnlyPtlFranchise && (
                    <>
                        <VendorNotificationPopup />
                        <PreApprovedPopup />
                        <FreeVendorRMPopup user={user} />
                        <FollowupTracker />
                    </>
                )}
            </div>
        </div>
    );
};

export default VendorDashboard;
