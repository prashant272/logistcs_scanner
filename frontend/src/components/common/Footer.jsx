import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white pt-16 pb-12 border-t border-slate-200 relative overflow-hidden font-sans">
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    
                    {/* Column 1: Brand & Logo */}
                    <div className="space-y-5">
                        <div className="flex items-center">
                            <img src="/logo.png" alt="Logistics Scanner Logo" className="h-12 w-auto object-contain" />
                        </div>
                        <p className="!text-slate-900 text-sm font-bold leading-relaxed max-w-sm">
                            Logistics Scanner is a platform that connects customers with top freight forwarders and vendors, offering competitive shipping rates to any country. Find cost-effective logistics solutions with trusted service providers worldwide.
                        </p>
                    </div>

                    {/* Column 2: Useful Links */}
                    <div>
                        <h4 className="text-[#0066FF] !text-[#0066FF] font-black text-sm uppercase tracking-wider mb-6">
                            USEFUL LINKS
                        </h4>
                        <ul className="space-y-4">
                            <li><Link to="/" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Home</Link></li>
                            <li><Link to="/about" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">About Us</Link></li>
                            <li><Link to="/my-orders" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Customer</Link></li>
                            <li><Link to="/vendor-auth" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Vendor</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div>
                        <h4 className="text-[#0066FF] !text-[#0066FF] font-black text-sm uppercase tracking-wider mb-6">
                            LEGAL
                        </h4>
                        <ul className="space-y-3">
                            <li><Link to="/terms" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Terms & Conditions</Link></li>
                            <li><Link to="/privacy" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Privacy Policy</Link></li>
                            <li><Link to="/refund" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Refund Policy</Link></li>
                            <li><Link to="/services" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Plan Rates</Link></li>
                            <li><Link to="/support" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Support</Link></li>
                            <li><Link to="/contact" className="!text-slate-900 hover:!text-[#0066FF] font-bold text-sm">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Newsletter & Badges */}
                    <div className="space-y-6">
                        <h4 className="text-[#0066FF] !text-[#0066FF] font-black text-sm uppercase tracking-wider mb-2">
                            JOIN OUR NEWSLETTER
                        </h4>
                        
                        {/* Newsletter Input */}
                        <div className="flex border border-slate-350 rounded-xl overflow-hidden shadow-sm max-w-xs bg-white">
                            <input 
                                type="email" 
                                placeholder="Email" 
                                className="flex-1 px-3 py-2.5 !text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:outline-none bg-white"
                            />
                            <button className="bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black px-4 py-2.5 transition-colors cursor-pointer">
                                Subscribe
                            </button>
                        </div>

                        {/* Social Media Links with Original Brand Colors */}
                        <div className="flex gap-2.5">
                            <a href="#" className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Facebook">
                                <Facebook size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-[#000000] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Twitter / X">
                                <span className="font-sans font-black text-xs">X</span>
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-[#E4405F] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="Instagram">
                                <Instagram size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-[#0077B5] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="LinkedIn">
                                <Linkedin size={16} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-sm" title="YouTube">
                                <Youtube size={16} />
                            </a>
                        </div>

                        {/* Available on Section */}
                        <div className="space-y-3">
                            <span className="block text-xs font-black !text-slate-950 uppercase tracking-wider">
                                We are available on
                            </span>
                            <div className="flex gap-3 items-center">
                                {/* App Store Badge */}
                                <a 
                                    href="#" 
                                    className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-800 hover:bg-slate-900 transition-all shadow-sm w-32 justify-center"
                                >
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 170 170">
                                        <path fill="currentColor" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.38-6.13-3.42-2.69-7.31-7.39-11.69-14.07-8.99-13.88-16.22-30.88-21.68-51-5.46-20.12-4.74-37.12 2.18-51 6.93-13.88 16.59-21.75 29-23.63 5.46-.75 11.69.87 18.69 4.88 7 4 12.06 6 15.19 6 3 0 7.82-1.88 14.44-5.63 6.63-3.75 12.38-5.38 17.25-4.88 12.75 1.5 22.88 7.38 30.38 17.63-12.87 7.88-19.12 18.62-18.75 32.25.38 10.75 4.38 19.38 12 25.88 7.63 6.5 16.75 9.75 27.38 9.75 2.25 0 4.63-.25 7.13-.75-2.25 6.75-5.38 13.38-9.38 19.88zM119.22 30.12c0-7.63 2.75-14.75 8.25-21.38 5.5-6.63 12.25-10.25 20.25-10.87.13 1 .19 1.88.19 2.62 0 7.25-2.88 14.38-8.62 21.38-5.75 7-12.75 10.75-21 11.25-.62-2-1.07-3-1.07-3z"/>
                                    </svg>
                                    <div className="text-left leading-none">
                                        <span className="block text-[6px] text-slate-400 font-bold uppercase">Download on the</span>
                                        <span className="text-[10px] font-bold">App Store</span>
                                    </div>
                                </a>

                                {/* Google Play Badge */}
                                <a 
                                    href="#" 
                                    className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-800 hover:bg-slate-900 transition-all shadow-sm w-32 justify-center"
                                >
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 170 170">
                                        <path fill="currentColor" d="M12.9 2.1c-.2.2-.4.5-.4.9v164c0 .4.2.7.4.9l85.6-85.6L12.9 2.1zM111.4 78.4L98.6 91.2l12.8 12.8 32-18.4c9.1-5.2 9.1-13.8 0-19l-32-18.2zM104.9 97.5L18.3 171.1c3.5 1.2 7.7.7 11.3-1.4l100.8-57.8L104.9 97.5zM18.3 1.9L104.9 88.5l25.5-25.5L29.6 5.3c-3.6-2.1-7.8-2.6-11.3-1.4z"/>
                                    </svg>
                                    <div className="text-left leading-none">
                                        <span className="block text-[6px] text-slate-400 font-bold uppercase">GET IT ON</span>
                                        <span className="text-[10px] font-bold">Google Play</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Bottom line */}
                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="!text-slate-500 text-[11px] font-bold text-center md:text-left">
                        © {new Date().getFullYear()} Logistics Scanner. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link to="/privacy" className="!text-slate-500 hover:!text-[#0066FF] text-[10px] uppercase tracking-widest font-black">Privacy Policy</Link>
                        <Link to="/terms" className="!text-slate-500 hover:!text-[#0066FF] text-[10px] uppercase tracking-widest font-black">Terms & Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
