import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    // Check for admin/RM session
    const adminRole = sessionStorage.getItem('adminRole') || localStorage.getItem('adminRole');
    const adminName = sessionStorage.getItem('adminName') || 'Admin';

    const handleAdminLogout = () => {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminRole');
        sessionStorage.removeItem('adminName');
        sessionStorage.removeItem('adminPermissions');
        localStorage.removeItem('adminRole');
        window.location.href = '/';
    };

    // Check if the current page is the Home page
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Determine if the navbar should have a white background
    const showWhiteBg = !isHomePage || isScrolled;

    const linkClass = "transition-colors text-xs uppercase tracking-widest font-black !text-black hover:!text-[#0066FF]";

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-350 ${
                showWhiteBg 
                    ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3 shadow-sm' 
                    : 'bg-transparent border-transparent py-5'
            }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center">
                        <img src="/logo.png" alt="Logistics Scanner Logo" className="h-12 w-auto object-contain" />
                    </Link>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link to="/" className={linkClass}>
                        Home
                    </Link>
                    <Link to="/about" className={linkClass}>
                        About
                    </Link>
                    <Link to="/login" className={linkClass}>
                        Customer
                    </Link>
                    <Link to="/vendor-network" className={linkClass}>
                        Vendor Network Search
                    </Link>
                    <span className={`cursor-default text-xs uppercase tracking-widest font-black !text-black`}>
                        Track
                    </span>
                    <Link to="/contact" className={linkClass}>
                        Contact Us
                    </Link>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center space-x-4">
                    {user || adminRole ? (
                        <div className="flex items-center gap-4">
                            <Link 
                                to={user ? (user.role === 'customer' ? '/customer' : user.role === 'vendor' ? '/vendor' : '/admin') : '/admin/dashboard'}
                                className={`font-black text-xs uppercase tracking-widest transition-colors ${showWhiteBg ? 'text-gray-950 hover:text-[#0066FF]' : '!text-black hover:!text-[#0066FF]'}`}
                            >
                                {user ? user.name.split(' ')[0] : adminName.split(' ')[0]}
                            </Link>
                            <button 
                                onClick={user ? logout : handleAdminLogout} 
                                className={`text-xs uppercase tracking-widest cursor-pointer font-black transition-colors ${
                                    showWhiteBg 
                                        ? 'text-gray-500 hover:text-[#0091d5]' 
                                        : '!text-black hover:!text-[#0091d5]'
                                }`}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/vendor-auth" className="bg-[#0091d5] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md">
                                Vendor Login / Register
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`focus:outline-none ${showWhiteBg ? 'text-gray-800' : 'text-white'}`}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white/98 backdrop-blur-lg border-b border-gray-200 py-6 flex flex-col items-center space-y-4 shadow-xl">
                    <Link
                        to="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-black hover:text-[#0091d5] text-base uppercase tracking-widest font-black"
                    >
                        Home
                    </Link>
                    <Link
                        to="/about"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-black hover:text-[#0091d5] text-base uppercase tracking-widest font-black"
                    >
                        About
                    </Link>
                    <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-black hover:text-[#0091d5] text-base uppercase tracking-widest font-black"
                    >
                        Customer
                    </Link>
                    <Link
                        to="/vendor-network"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-black hover:text-[#0091d5] text-base uppercase tracking-widest font-black text-center"
                    >
                        Vendor Network Search
                    </Link>
                    <span
                        className="text-black text-base uppercase tracking-widest font-black cursor-default"
                    >
                        Track
                    </span>
                    <Link
                        to="/contact"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-800 hover:text-[#0091d5] text-base uppercase tracking-widest font-bold"
                    >
                        Contact Us
                    </Link>

                    {user || adminRole ? (
                        <div className="flex flex-col items-center gap-2 pt-2">
                            <span className="text-gray-950 font-bold text-base">{user ? user.name : adminName}</span>
                            <button onClick={() => { (user ? logout() : handleAdminLogout()); setIsMobileMenuOpen(false); }} className="text-gray-500 hover:text-[#0091d5] text-base uppercase tracking-widest font-bold">Logout</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 pt-4 w-full px-6">
                            <Link to="/vendor-auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full bg-[#0091d5] text-white text-center py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md">
                                Vendor Login / Register
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
