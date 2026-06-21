import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId } = location.state || { orderId: '#UNKNOWN' };

    return (
        <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-dark-800 p-8 md:p-12 rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl transform transition-all hover:scale-105 duration-500">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500 w-10 h-10" />
                </div>

                <h1 className="text-3xl md:text-4xl font-display text-white mb-2">Order Confirmed!</h1>
                <p className="text-gray-400 mb-6">Your order has been placed successfully.</p>

                <div className="bg-white/5 rounded-lg p-4 mb-8">
                    <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-gold font-mono text-xl">{orderId}</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/menu')}
                        className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-white transition-colors"
                    >
                        Order More Food
                    </button>

                    <Link to="/" className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors">
                        <Home size={18} /> Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
