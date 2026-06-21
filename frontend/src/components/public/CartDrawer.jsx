import React from 'react';
import { useCart } from '../../context/CartContext';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsCartOpen(false)}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-dark-900 h-full shadow-2xl border-l border-white/10 flex flex-col transform transition-transform duration-300">
                <div className="p-4 flex justify-between items-center border-b border-white/10 bg-dark-800">
                    <h2 className="text-xl font-display text-gold flex items-center gap-2">
                        <ShoppingBag /> Your Cart
                    </h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <p>Your cart is empty.</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="mt-4 text-gold hover:underline"
                            >
                                Start Ordering
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartItemId} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                <img src={item.image || 'https://placehold.co/100x100?text=Food'} alt={item.name} className="w-16 h-16 rounded object-cover" />
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">{item.name}</h3>
                                    {item.variant && <p className="text-xs text-gold uppercase">{item.variant}</p>}
                                    <p className="text-gray-300">₹{item.price}</p>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <div className="flex items-center gap-2 bg-black/40 rounded px-2 py-1">
                                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="text-gray-400 hover:text-white">
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="text-gray-400 hover:text-white">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.cartItemId)}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-4 border-t border-white/10 bg-dark-800">
                        <div className="flex justify-between items-center mb-4 text-white">
                            <span>Total Amount</span>
                            <span className="text-xl font-bold text-gold">₹{cartTotal}</span>
                        </div>
                        <button
                            onClick={() => {
                                setIsCartOpen(false);
                                navigate('/checkout');
                            }}
                            className="w-full bg-gold text-black font-bold py-3 rounded hover:bg-white transition-colors uppercase tracking-widest"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
