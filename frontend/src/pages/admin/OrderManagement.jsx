import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Eye, X } from 'lucide-react';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/orders/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state and selected order if open
            const updatedOrders = orders.map(order =>
                order._id === id ? { ...order, status } : order
            );
            setOrders(updatedOrders);
            if (selectedOrder && selectedOrder._id === id) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
            case 'Confirmed': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
            case 'Preparing': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
            case 'Out for Delivery': return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/50';
            case 'Delivered': return 'bg-green-500/20 text-green-500 border-green-500/50';
            case 'Cancelled': return 'bg-red-500/20 text-red-500 border-red-500/50';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
        }
    };

    if (loading) return <div className="text-white">Loading orders...</div>;

    return (
        <div className="bg-dark-900 p-6 rounded-lg min-h-screen">
            <h2 className="text-3xl font-display text-white mb-6 flex items-center gap-3">
                <Package className="text-gold" /> Order Management
            </h2>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-dark-800 rounded-lg border border-white/10">
                <table className="w-full text-left text-gray-400">
                    <thead className="bg-black/20 text-gold uppercase text-sm font-bold border-b border-white/10">
                        <tr>
                            <th className="p-4">Order ID</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {orders.map((order) => (
                            <tr key={order._id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-mono text-xs text-gray-500">{order._id.substring(order._id.length - 6)}...</td>
                                <td className="p-4 text-white font-bold">{order.customer.name}</td>
                                <td className="p-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-white">₹{order.finalAmount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="bg-gold/10 text-gold p-2 rounded hover:bg-gold hover:text-black transition-colors"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No orders found.</div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 rounded-lg w-full max-w-2xl border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl font-display text-white mb-1">Order Details</h3>
                            <p className="text-gold font-mono text-sm mb-6">ID: {selectedOrder._id}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <h4 className="text-gold text-sm font-bold uppercase mb-3">Customer Info</h4>
                                    <p className="text-white font-bold">{selectedOrder.customer.name}</p>
                                    <p className="text-gray-400 text-sm">{selectedOrder.customer.phone}</p>
                                    <p className="text-gray-400 text-sm mt-2">{selectedOrder.customer.address}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded border border-white/5">
                                    <h4 className="text-gold text-sm font-bold uppercase mb-3">Order Info</h4>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Payment:</span>
                                        <span className="text-white">{selectedOrder.paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Total:</span>
                                        <span className="text-white font-bold">₹{selectedOrder.finalAmount}</span>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-xs text-gray-500 uppercase mb-1">Update Status</label>
                                        <select
                                            value={selectedOrder.status}
                                            onChange={(e) => updateStatus(selectedOrder._id, e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm outline-none focus:border-gold"
                                        >
                                            {['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(st => (
                                                <option key={st} value={st} className="bg-dark-900">{st}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4">
                                <h4 className="text-white font-bold mb-4">Items Ordered</h4>
                                <ul className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded">
                                            <span className="text-gray-300">
                                                <span className="font-bold text-white mr-2">{item.quantity}x</span>
                                                {item.name}
                                                {item.variant && <span className="text-gold text-xs ml-1">({item.variant})</span>}
                                            </span>
                                            <span className="text-white">₹{item.price * item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
