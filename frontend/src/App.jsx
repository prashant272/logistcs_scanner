import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/public/Home';
import Menu from './pages/public/Menu';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import MenuManagement from './pages/admin/MenuManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import VendorPricingManagement from './pages/admin/VendorPricingManagement';
import ViaPricingManagement from './pages/admin/ViaPricingManagement';
import PlanManagement from './pages/admin/PlanManagement';
import CouponManagement from './pages/admin/CouponManagement';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import OrderManagement from './pages/admin/OrderManagement';
import MyOrders from './pages/customer/MyOrders';
import ServicesPage from './pages/public/ServicesPage';
import TrackShipment from './pages/public/TrackShipment';
import SearchResults from './pages/public/SearchResults';

import { CartProvider } from './context/CartContext';
import CartDrawer from './components/public/CartDrawer';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import VendorAuth from './pages/vendor/VendorAuth';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorManagement from './pages/admin/VendorManagement';
import LocationMaster from './pages/admin/LocationMaster';

import { LocationProvider } from './services/LocationService';
import { PricingProvider } from './services/PricingService';
import { EnquiryProvider } from './services/EnquiryService';

import VendorDashboardMain from './components/vendor/VendorDashboardMain';
import VendorEnquiriesTab from './components/vendor/VendorEnquiriesTab';
import VendorBookingsTab from './components/vendor/VendorBookingsTab';
import VendorPricingTab from './components/vendor/VendorPricingTab';
import VendorInvoiceUploadTab from './components/vendor/VendorInvoiceUploadTab';
import VendorBulkImportTab from './components/vendor/VendorBulkImportTab';
import VendorProfileTab from './components/vendor/VendorProfileTab';
import FinanceSection from './components/vendor/FinanceSection';
import PricingPlans from './pages/vendor/PricingPlans';

import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerEnquiriesTab from './components/customer/CustomerEnquiriesTab';
import CustomerComplaintsTab from './components/customer/CustomerComplaintsTab';
import VendorComplaintsTab from './components/vendor/VendorComplaintsTab';
import AdminComplaints from './pages/admin/AdminComplaints';
import SearchPrice from './components/public/SearchPrice';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" />;
};

const VendorPrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white text-center py-20 font-bold">Loading...</div>;
  }

  if (!user || user.role !== 'vendor') {
    return <Navigate to="/vendor-auth" replace state={{ error: 'If you are not a registered user, please register' }} />;
  }

  return children;
};

const CustomerPrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white text-center py-20 font-bold">Loading...</div>;
  }

  if (!user || user.role !== 'customer') {
    return <Navigate to="/login" replace state={{ error: 'If you are not a registered user, please register' }} />;
  }

  return children;
};

// ... existing imports ...

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <PricingProvider>
          <EnquiryProvider>
            <CartProvider>
              <Router>
          <Routes>
            {/* Admin Routes (No Navbar/Footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>}>
              <Route path="dashboard" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-2">Welcome to Admin Dashboard</h2><p className="text-slate-500 text-sm">System administration control panel.</p></div>} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="vendors" element={<VendorManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              
              {/* Reports routes */}
              <Route path="reports/vendor-pricing" element={<VendorPricingManagement />} />
              <Route path="reports/add-pricing" element={<VendorPricingManagement />} />
              <Route path="reports/add-via-pricing" element={<ViaPricingManagement />} />
              <Route path="reports/add-plan" element={<PlanManagement />} />
              <Route path="reports/add-coupon" element={<CouponManagement />} />
              <Route path="reports/inquiry-listing" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Inquiry Listing</h2><p className="text-slate-500">List of all system inquiries.</p></div>} />
              <Route path="reports/add-rm" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Add Relationship Manager</h2><p className="text-slate-500">Add a new Relationship Manager (RM).</p></div>} />
              <Route path="reports/assign-rm" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Assign Relationship Manager</h2><p className="text-slate-500">Assign relationship managers to customers.</p></div>} />
              <Route path="reports/bulk-import" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Bulk Import</h2><p className="text-slate-500">Bulk data import tool.</p></div>} />
              
              {/* Location Master */}
              <Route path="location-master" element={<LocationMaster />} />
              <Route path="finance-enquiry-list" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Finance Enquiry List</h2><p className="text-slate-500">List of all financial enquiries.</p></div>} />
              
              {/* Request Management */}
              <Route path="invoice-request" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Invoice Request</h2><p className="text-slate-500">Review and manage invoice requests.</p></div>} />
              <Route path="upgrade-requests" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Upgrade Requests</h2><p className="text-slate-500">Review and manage account upgrades.</p></div>} />
              
              {/* Other sections */}
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="cms-settings" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">CMS Settings</h2><p className="text-slate-500">Content Management System settings.</p></div>} />
            </Route>

            {/* Customer Dashboard Routes (No Navbar/Footer) */}
            <Route path="/customer" element={<CustomerPrivateRoute><CustomerDashboard /></CustomerPrivateRoute>}>
              <Route index element={<Navigate to="/customer/direct-enquiry" replace />} />
              <Route path="search-price" element={<SearchPrice isDashboard={true} />} />
              <Route path="search-results" element={<SearchResults />} />
              <Route path="direct-enquiry" element={<CustomerEnquiriesTab title="Direct Enquiry" type="direct" />} />
              <Route path="my-enquiry" element={<CustomerEnquiriesTab title="My Enquiry" type="my" />} />
              <Route path="complaint" element={<CustomerComplaintsTab />} />
            </Route>

            {/* Vendor Routes (No Navbar/Footer) */}
            <Route path="/vendor" element={<VendorPrivateRoute><VendorDashboard /></VendorPrivateRoute>}>
              <Route index element={<Navigate to="/vendor/dashboard" replace />} />
              <Route path="dashboard" element={<VendorDashboardMain />} />
              <Route path="search-price" element={<SearchPrice isDashboard={true} />} />
              <Route path="search-results" element={<SearchResults />} />
              <Route path="my-enquiries" element={<VendorEnquiriesTab title="My Enquiries" type="my" />} />
              <Route path="direct-enquiries" element={<VendorEnquiriesTab title="Direct Enquiries" type="direct" />} />
              <Route path="direct-booking" element={<VendorBookingsTab title="Direct Bookings" type="direct" />} />
              <Route path="my-bookings" element={<VendorBookingsTab title="My Bookings" type="my" />} />
              <Route path="my-pricing" element={<VendorPricingTab />} />
              <Route path="finance" element={<FinanceSection />} />
              <Route path="finance-list" element={<FinanceSection />} />
              <Route path="upload-invoice" element={<VendorInvoiceUploadTab />} />
              <Route path="bulk-import" element={<VendorBulkImportTab />} />
              <Route path="view-profile" element={<VendorProfileTab />} />
              <Route path="upgrade" element={<PricingPlans />} />
              <Route path="complaint" element={<VendorComplaintsTab />} />
            </Route>

            {/* Public Routes */}
            <Route path="*" element={
              <div className="flex flex-col min-h-screen bg-dark-900 text-white font-sans">
                <Navbar />
                <CartDrawer />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/track" element={<TrackShipment />} />
                    <Route path="/search-results" element={<SearchResults />} />
                    <Route path="/my-orders" element={<CustomerPrivateRoute><MyOrders /></CustomerPrivateRoute>} />
                    <Route path="/checkout" element={<CustomerPrivateRoute><Checkout /></CustomerPrivateRoute>} />
                    <Route path="/upgrade" element={<CustomerPrivateRoute><PricingPlans /></CustomerPrivateRoute>} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/vendor-auth" element={<VendorAuth />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </Router>
            </CartProvider>
          </EnquiryProvider>
        </PricingProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
