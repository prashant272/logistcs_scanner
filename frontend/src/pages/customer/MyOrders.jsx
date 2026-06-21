import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, XCircle, CheckCircle, Truck, ShoppingBag, MapPin, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [user, navigate]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/orders/my-orders-auth`, config);
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // Removed handleSearch as we now fetch by authenticated user

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock className="text-yellow-500" />;
            case 'Confirmed': return <CheckCircle className="text-blue-500" />;
            case 'Preparing': return <Package className="text-orange-500" />;
            case 'Out for Delivery': return <Truck className="text-indigo-500" />;
            case 'Delivered': return <CheckCircle className="text-green-500" />;
            case 'Cancelled': return <XCircle className="text-red-500" />;
            default: return <Clock className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'text-yellow-500 border-yellow-500';
            case 'Confirmed': return 'text-blue-500 border-blue-500';
            case 'Preparing': return 'text-orange-500 border-orange-500';
            case 'Out for Delivery': return 'text-indigo-500 border-indigo-500';
            case 'Delivered': return 'text-green-500 border-green-500';
            case 'Cancelled': return 'text-red-500 border-red-500';
            default: return 'text-gray-500 border-gray-500';
        }
    };


    return (
        <div className="min-h-screen bg-dark-900 pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-display text-white mb-8 text-center flex justify-center items-center gap-3">
                    <ShoppingBag className="text-gold" /> My Orders
                </h1>

                {/* Phone Search Removed - Using Auth */}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="animate-spin text-gold mr-2" />
                        <span className="text-white">Loading your orders...</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-dark-800 rounded-lg border border-white/10">
                        <ShoppingBag size={48} className="mx-auto mb-4 text-gray-700" />
                        <p className="text-xl">You haven't placed any orders yet.</p>
                        <p className="text-sm mt-2">Hungry? Check out our menu!</p>
                        <Link to="/menu" className="bg-gold text-black font-bold px-6 py-2 rounded mt-6 inline-block hover:bg-white transition-colors">
                            Order Now
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order._id} className="bg-dark-800 border border-white/10 rounded-lg p-6 hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-white/10 pb-4">
                                    <div className="mb-2 md:mb-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)} bg-opacity-10 bg-white`}>
                                                {order.status}
                                            </span>
                                            <span className="text-gray-400 text-sm">{new Date(order.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 font-mono">ID: {order._id}</div>
                                    </div>
                                    <div className="text-2xl font-bold text-gold">₹{order.finalAmount}</div>
                                </div>

                                <div className="mb-4">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-gray-300 py-1 border-b border-white/5 last:border-0">
                                            <span>
                                                {item.quantity}x {item.name}
                                                {item.variant && <span className="text-gold text-xs ml-1">({item.variant})</span>}
                                            </span>
                                            <span>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-end mt-4 pt-2 border-t border-white/5">
                                    <div className="text-sm text-gray-400">
                                        <p className="flex items-center gap-1"><MapPin size={14} /> {order.customer.address}</p>
                                    </div>
                                    {order.status === 'Pending' && (
                                        <span className="text-xs text-yellow-500">Waiting for confirmation...</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
