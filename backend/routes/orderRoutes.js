const express = require('express');
const router = express.Router();
const { createOrder, getAllOrders, getOrderById, updateOrderStatus, getOrdersByPhone, getOrdersByUser } = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware'); // Admin/User protection

// Public route to create order (updated controller handles optional user)
router.post('/', createOrder);

// Authenticated route to get logged-in user's orders
router.get('/my-orders-auth', protect, getOrdersByUser);

// Public route to get user orders (by phone)
router.get('/my-orders', getOrdersByPhone);

// Admin routes
router.get('/', protect, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);

module.exports = router;
