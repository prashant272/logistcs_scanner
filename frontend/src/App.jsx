import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Core layout/context components (static import for fast first paint)
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ScrollRestoration from './components/common/ScrollRestoration';
import ScrollToTopButton from './components/common/ScrollToTopButton';
import WhatsAppButton from './components/common/WhatsAppButton';
import CartDrawer from './components/public/CartDrawer';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './services/LocationService';
import { PricingProvider } from './services/PricingService';
import { EnquiryProvider } from './services/EnquiryService';

// Core pages (static import for fast initial load)
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import SearchPrice from './components/public/SearchPrice';
import SearchResults from './pages/public/SearchResults';

// Lazy loaded public pages
const Menu = lazy(() => import('./pages/public/Menu'));
const VendorNetwork = lazy(() => import('./pages/public/VendorNetwork'));
const VendorPublicProfile = lazy(() => import('./pages/public/VendorPublicProfile'));
const TrackShipment = lazy(() => import('./pages/public/TrackShipment'));
const Terms = lazy(() => import('./pages/public/Terms'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const Refund = lazy(() => import('./pages/public/Refund'));
const Support = lazy(() => import('./pages/public/Support'));
const PlanRates = lazy(() => import('./pages/public/PlanRates'));

// Lazy loaded customer pages
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const OrderSuccess = lazy(() => import('./pages/customer/OrderSuccess'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const CustomerEnquiriesTab = lazy(() => import('./components/customer/CustomerEnquiriesTab'));
const CustomerComplaintsTab = lazy(() => import('./components/customer/CustomerComplaintsTab'));
const CustomerProfileTab = lazy(() => import('./components/customer/CustomerProfileTab'));

// Lazy loaded vendor pages
const VendorAuth = lazy(() => import('./pages/vendor/VendorAuth'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorDashboardMain = lazy(() => import('./components/vendor/VendorDashboardMain'));
const VendorEnquiriesTab = lazy(() => import('./components/vendor/VendorEnquiriesTab'));
const VendorBookingsTab = lazy(() => import('./components/vendor/VendorBookingsTab'));
const VendorPricingTab = lazy(() => import('./components/vendor/VendorPricingTab'));
const VendorBulkImportTab = lazy(() => import('./components/vendor/VendorBulkImportTab'));
const VendorProfileTab = lazy(() => import('./components/vendor/VendorProfileTab'));
const FinanceSection = lazy(() => import('./components/vendor/FinanceSection'));
const PricingPlans = lazy(() => import('./pages/vendor/PricingPlans'));
const VendorComplaintsTab = lazy(() => import('./components/vendor/VendorComplaintsTab'));
const VendorFinanceForm = lazy(() => import('./pages/vendor/VendorFinanceForm'));
const VendorFinanceDashboard = lazy(() => import('./pages/vendor/VendorFinanceDashboard'));
const UploadInvoiceTab = lazy(() => import('./components/vendor/UploadInvoiceTab'));
const WalletLedgerTab = lazy(() => import('./components/vendor/WalletLedgerTab'));
const VendorContactListTab = lazy(() => import('./components/vendor/VendorContactListTab'));

// Lazy loaded admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminDashboardMain = lazy(() => import('./components/admin/AdminDashboardMain'));
const MenuManagement = lazy(() => import('./pages/admin/MenuManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const VendorPricingManagement = lazy(() => import('./pages/admin/VendorPricingManagement'));
const ViaPricingManagement = lazy(() => import('./pages/admin/ViaPricingManagement'));
const PlanManagement = lazy(() => import('./pages/admin/PlanManagement'));
const CouponManagement = lazy(() => import('./pages/admin/CouponManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const VendorManagement = lazy(() => import('./pages/admin/VendorManagement'));
const LocationMaster = lazy(() => import('./pages/admin/LocationMaster'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminInquiryListing = lazy(() => import('./pages/admin/AdminInquiryListing'));
const AddRM = lazy(() => import('./pages/admin/AddRM'));
const AdminFinanceListing = lazy(() => import('./pages/admin/AdminFinanceListing'));
const AdminEnquiriesTab = lazy(() => import('./pages/admin/AdminEnquiriesTab'));
const AdminUpgradationRequests = lazy(() => import('./pages/admin/AdminUpgradationRequests'));
const AdminInvoiceRequests = lazy(() => import('./pages/admin/AdminInvoiceRequests'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white flex-col">
    <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-[#0066FF] font-bold animate-pulse">Loading...</p>
  </div>
);

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
                <ScrollRestoration />
                <ScrollToTopButton />
                <WhatsAppButton />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin Routes (No Navbar/Footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>}>
              <Route path="dashboard" element={<AdminDashboardMain />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="vendors" element={<VendorManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="enquiries" element={<AdminEnquiriesTab />} />
              
              {/* Reports routes */}
              <Route path="reports/vendor-pricing" element={<VendorPricingManagement />} />
              <Route path="reports/add-pricing" element={<VendorPricingManagement />} />
              <Route path="reports/add-via-pricing" element={<ViaPricingManagement />} />
              <Route path="reports/add-plan" element={<PlanManagement />} />
              <Route path="reports/add-coupon" element={<CouponManagement />} />
              <Route path="reports/inquiry-listing" element={<AdminInquiryListing />} />
              <Route path="reports/add-rm" element={<AddRM />} />
              <Route path="reports/assign-rm" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Assign Relationship Manager</h2><p className="text-slate-500">Assign relationship managers to customers.</p></div>} />
              <Route path="reports/bulk-import" element={<div className="p-6 bg-white rounded-2xl shadow-sm text-slate-800"><h2 className="text-xl font-bold mb-4">Bulk Import</h2><p className="text-slate-500">Bulk data import tool.</p></div>} />
              
              {/* Location Master */}
              <Route path="location-master" element={<LocationMaster />} />
              <Route path="finance-enquiry-list" element={<AdminFinanceListing />} />
              
              {/* Request Management */}
              <Route path="invoice-request" element={<AdminInvoiceRequests />} />
              <Route path="upgrade-requests" element={<AdminUpgradationRequests />} />
              
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
              <Route path="profile" element={<CustomerProfileTab />} />
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
              <Route path="finance" element={<VendorFinanceForm />} />
              <Route path="finance-list" element={<VendorFinanceDashboard />} />
              <Route path="upload-invoice" element={<UploadInvoiceTab />} />
              <Route path="wallet" element={<WalletLedgerTab />} />
              <Route path="bulk-import" element={<VendorBulkImportTab />} />
              <Route path="view-profile" element={<VendorProfileTab />} />
              <Route path="upgrade" element={<PricingPlans />} />
              <Route path="contact-vendor-list" element={<VendorContactListTab />} />
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
                    <Route path="/vendor-network" element={<VendorNetwork />} />
                    <Route path="/vendor-network/profile/:id" element={<VendorPublicProfile />} />
                    <Route path="/track" element={<TrackShipment />} />
                    <Route path="/search-results" element={<SearchResults />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/refund" element={<Refund />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/plan-rates" element={<PlanRates />} />
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
          </Suspense>
        </Router>
            </CartProvider>
          </EnquiryProvider>
        </PricingProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
