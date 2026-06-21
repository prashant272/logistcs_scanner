import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useLocation } from 'react-router-dom';

const Menu = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const [selectedItem, setSelectedItem] = useState(null);
    const location = useLocation();

    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/menu`);
                setMenuItems(data);

                // Extract unique categories from data
                const uniqueCategories = ['All', ...new Set(data.map(item => item.category))];
                setCategories(uniqueCategories);

                // Check for category query param
                const params = new URLSearchParams(location.search);
                const categoryParam = params.get('category');

                if (categoryParam) {
                    // Try exact match
                    if (uniqueCategories.includes(categoryParam)) {
                        setActiveCategory(categoryParam);
                    } else {
                        // Try partial case-insensitive match
                        const match = uniqueCategories.find(c =>
                            c.toLowerCase().includes(categoryParam.toLowerCase()) ||
                            categoryParam.toLowerCase().includes(c.toLowerCase())
                        );
                        if (match) {
                            setActiveCategory(match);
                        }
                    }
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching menu:', error);
                setLoading(false);
            }
        };
        fetchMenu();
    }, [location.search]);

    const filteredItems = activeCategory === 'All'
        ? menuItems
        : menuItems.filter(item => item.category === activeCategory);

    const handleAddToCartClick = (item) => {
        if (item.variants && item.variants.length > 0) {
            setSelectedItem(item);
        } else {
            addToCart(item);
        }
    };

    const handleVariantSelect = (variant) => {
        if (selectedItem) {
            addToCart(selectedItem, variant);
            setSelectedItem(null);
        }
    };

    if (loading) return (
        <div className="bg-dark-900 min-h-screen pt-24 pb-20 flex items-center justify-center text-white">
            Loading Menu...
        </div>
    );

    return (
        <div className="bg-dark-900 min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-display text-white mb-6">
                        Our <span className="text-gold-gradient italic">Menu</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Explore our diverse collection of cloud kitchen specials, from aromatic biryanis to succulent kebabs.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2 border rounded-full text-sm font-bold uppercase tracking-wider transition-all ${activeCategory === category
                                ? 'bg-gold border-gold text-black'
                                : 'bg-transparent border-white/20 text-gray-400 hover:border-gold hover:text-gold'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item) => (
                        <div key={item._id} className="bg-dark-800 border border-white/5 rounded-lg overflow-hidden flex flex-col md:flex-row hover:border-gold/30 transition-all duration-300 group">
                            {/* Image - Left Side on Desktop */}
                            <div className="w-full md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                                <img
                                    src={item.image || 'https://placehold.co/600x400?text=Delicious+Food'}
                                    alt={item.name}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 md:hidden bg-black/70 backdrop-blur-md px-2 py-1 text-gold text-xs font-bold rounded">
                                    {item.variants && item.variants.length > 0
                                        ? `₹${item.variants[0].price}+`
                                        : `₹${item.price}`
                                    }
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-display text-white group-hover:text-gold transition-colors">
                                            {item.name}
                                        </h3>
                                        <span className="hidden md:block text-gold font-bold text-lg">
                                            {item.variants && item.variants.length > 0
                                                ? `₹${item.variants[0].price}+`
                                                : `₹${item.price}`
                                            }
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider border border-white/10 px-2 py-1 rounded">
                                        {item.category}
                                    </span>
                                    <button
                                        onClick={() => handleAddToCartClick(item)}
                                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Variant Selection Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-800 p-6 rounded-lg w-full max-w-sm border border-white/10 relative">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-display text-gold mb-2">{selectedItem.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">Select Portion Size</p>

                        <div className="space-y-3">
                            {selectedItem.variants.map((variant) => (
                                <button
                                    key={variant.name}
                                    onClick={() => handleVariantSelect(variant)}
                                    className="w-full flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded transition-colors"
                                >
                                    <span className="text-white font-bold">{variant.name}</span>
                                    <span className="text-gold">₹{variant.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;
