import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    return (
        <div className="w-full h-screen bg-[#f4f7fc] text-slate-800 font-sans flex overflow-hidden">
            
            {/* Sidebar Component */}
            <AdminSidebar 
                isSidebarOpen={isSidebarOpen} 
                logout={handleLogout} 
            />

            {/* Main Content Wrap */}
            <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
                
                {/* Header Component */}
                <AdminHeader 
                    isSidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                    logout={handleLogout} 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                />

                {/* Scrollable Dashboard Body */}
                <main className="flex-grow p-6 md:p-8 space-y-6 overflow-y-auto">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default AdminDashboard;
