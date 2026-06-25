const express = require("express");
const router = express.Router();
const { 
    loginAdmin, 
    getVendors, 
    getCustomers, 
    getGuests, 
    getCustomerHistory, 
    getGuestHistory,
    impersonateVendor,
    toggleVendorVerification,
    adminGetVendorPricing,
    adminAddPricing,
    adminTogglePricingStatus,
    adminDeletePricing,
    adminUpdatePricing,
    getAdminDashboardStats,
    getEnquiries,
    updateEnquiry,
    deleteEnquiry,
    adminAddUser
} = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");

router.post("/login", loginAdmin);
router.post("/users", auth, adminAddUser);
router.get("/dashboard-stats", auth, getAdminDashboardStats);
router.get("/vendors", auth, getVendors);
router.get("/customers", auth, getCustomers);
router.get("/guests", auth, getGuests);
router.get("/customer-history/:id", auth, getCustomerHistory);
router.get("/guest-history", auth, getGuestHistory);
router.get("/impersonate/:vendorId", auth, impersonateVendor);
router.put("/vendors/:id/verify", auth, toggleVendorVerification);

// Admin pricing management routes
router.get("/pricing/:vendorId", auth, adminGetVendorPricing);
router.post("/pricing", auth, adminAddPricing);
router.put("/pricing/:id/toggle", auth, adminTogglePricingStatus);
router.delete("/pricing/:id", auth, adminDeletePricing);
router.put("/pricing/:id", auth, adminUpdatePricing);

// Enquiries Management
router.get("/enquiries", auth, getEnquiries);
router.put("/enquiries/:id", auth, updateEnquiry);
router.delete("/enquiries/:id", auth, deleteEnquiry);

module.exports = router;
