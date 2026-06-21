import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, variant = null, quantity = 1) => {
        setCart(prevCart => {
            // Create a unique ID for the item based on ID + variant
            const cartItemId = variant ? `${item._id}-${variant.name}` : item._id;

            const existingItem = prevCart.find(cartItem => cartItem.cartItemId === cartItemId);

            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.cartItemId === cartItemId
                        ? { ...cartItem, quantity: cartItem.quantity + quantity }
                        : cartItem
                );
            } else {
                return [...prevCart, {
                    ...item,
                    cartItemId,
                    variant: variant ? variant.name : null,
                    price: variant ? variant.price : item.price,
                    quantity
                }];
            }
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (cartItemId) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(cartItemId);
            return;
        }
        setCart(prevCart => prevCart.map(item =>
            item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('cart');
    };

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            isCartOpen,
            setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
};
