const Order = require('../models/Order');

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { customer, items, totalAmount, discount, finalAmount, paymentMethod, user } = req.body;

        const order = await Order.create({
            customer,
            items,
            totalAmount,
            discount,
            finalAmount,
            paymentMethod,
            user // Optional: if user is logged in
        });

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get single order
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get orders by phone number (User)
exports.getOrdersByPhone = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        const orders = await Order.find({ "customer.phone": phone }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get orders by authenticated user
exports.getOrdersByUser = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
