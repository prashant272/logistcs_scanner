import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Address, 2: Payment
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        pincode: '',
        landmark: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('COD');

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: location } });
        } else {
            // Pre-fill form if user has data
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || ''
            }));
        }
    }, [user, navigate, location]);

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
                <button
                    onClick={() => navigate('/menu')}
                    className="bg-gold text-black px-6 py-2 rounded font-bold hover:bg-white transition-colors"
                >
                    Browse Menu
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        // Basic validation
        if (!formData.name || !formData.phone || !formData.address || !formData.pincode) {
            alert("Please fill in all required fields.");
            return;
        }
        setStep(2);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('userToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const orderPayload = {
                customer: {
                    name: formData.name,
                    phone: formData.phone,
                    address: `${formData.address}, ${formData.landmark ? formData.landmark + ', ' : ''}${formData.pincode}`,
                    location: 'N/A'
                },
                items: cart.map(item => ({
                    menuId: item._id,
                    name: item.name,
                    variant: item.variant || '',
                    price: item.price,
                    quantity: item.quantity
                })),
                totalAmount: cartTotal,
                finalAmount: cartTotal,
                paymentMethod: paymentMethod,
                user: user._id // Link to user
            };

            const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/orders`, orderPayload, config);

            clearCart();
            navigate('/order-success', { state: { orderId: data._id } });

        } catch (error) {
            console.error("Order placement failed:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="text-gray-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-display text-white">Checkout</h1>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10"></div>
                    <div className={`flex items-center gap-2 bg-dark-900 pr-4 ${step >= 1 ? 'text-gold' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-gold text-black' : 'bg-gray-800'}`}>1</div>
                        <span className="font-bold hidden md:inline">Address</span>
                    </div>
                    <div className="flex-1"></div>
                    <div className={`flex items-center gap-2 bg-dark-900 pl-4 ${step >= 2 ? 'text-gold' : 'text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-gold text-black' : 'bg-gray-800'}`}>2</div>
                        <span className="font-bold hidden md:inline">Payment</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {step === 1 ? (
                            <div className="bg-dark-800 p-6 rounded-lg border border-white/10">
                                <h2 className="text-xl text-white font-bold mb-4 flex items-center gap-2">
                                    <MapPin className="text-gold" /> Delivery Address
                                </h2>
                                <form onSubmit={handleAddressSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                                            <input
                                                type="text" name="name" required
                                                value={formData.name} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-gold outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                                            <input
                                                type="tel" name="phone" required
                                                value={formData.phone} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Address (House No, Building, Street)</label>
                                        <textarea
                                            name="address" required rows="3"
                                            value={formData.address} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-gold outline-none"
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Pincode</label>
                                            <input
                                                type="text" name="pincode" required
                                                value={formData.pincode} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-gold outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Landmark (Optional)</label>
                                            <input
                                                type="text" name="landmark"
                                                value={formData.landmark} onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:border-gold outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-white transition-colors mt-4">
                                        Proceed to Payment
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-dark-800 p-6 rounded-lg border border-white/10">
                                <h2 className="text-xl text-white font-bold mb-4 flex items-center gap-2">
                                    <CreditCard className="text-gold" /> Payment Method
                                </h2>

                                <div className="space-y-4">
                                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}>
                                        <input
                                            type="radio" name="payment" value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={() => setPaymentMethod('COD')}
                                            className="form-radio text-gold"
                                        />
                                        <div className="ml-4">
                                            <span className="block text-white font-bold">Cash on Delivery</span>
                                            <span className="block text-sm text-gray-400">Pay cash upon receiving your order</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-all ${paymentMethod === 'UPI' ? 'border-gold bg-gold/10' : 'border-white/10 hover:border-white/30'}`}>
                                        <input
                                            type="radio" name="payment" value="UPI"
                                            checked={paymentMethod === 'UPI'}
                                            onChange={() => setPaymentMethod('UPI')}
                                            className="form-radio text-gold"
                                        />
                                        <div className="ml-4">
                                            <span className="block text-white font-bold">UPI (Google Pay / PhonePe / Paytm)</span>
                                            <span className="block text-sm text-gray-400">Scan QR Code or Enter UPI ID</span>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-white transition-colors mt-6 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : `Place Order • ₹${cartTotal}`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-dark-800 p-6 rounded-lg border border-white/10 sticky top-28">
                            <h3 className="text-lg text-white font-bold mb-4 border-b border-white/10 pb-2">Order Summary</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="flex justify-between text-sm">
                                        <div>
                                            <span className="text-gray-300">{item.name} {item.variant ? `(${item.variant})` : ''}</span>
                                            <span className="text-gray-500 text-xs block">x{item.quantity}</span>
                                        </div>
                                        <span className="text-white">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/10 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Delivery Fee</span>
                                    <span>₹0</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gold pt-2 border-t border-white/10 mt-2">
                                    <span>Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
