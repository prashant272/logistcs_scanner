import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Globe, TrendingUp, ShieldCheck } from 'lucide-react';

const GetInTouch = () => {
    return (
        <div className="w-full bg-white py-6">
            <div 
                className="max-w-[95%] w-full mx-auto border border-white/5 rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl font-sans"
                style={{ 
                    backgroundImage: "linear-gradient(to right, rgba(3, 21, 48, 0.95) 40%, rgba(3, 21, 48, 0.3) 100%), url('/cta_background.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Content Layout */}
                <div className="relative z-10 space-y-6">
                    {/* Top Row: Info and Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                        {/* Text Content */}
                        <div className="space-y-2 max-w-2xl">
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                                Ready to Grow Your Global Logistics Business?
                            </h2>
                            <p className="text-slate-300 text-sm md:text-base font-semibold leading-relaxed">
                                Join Logistics Scanner today and connect with thousands of logistics professionals worldwide.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4">
                            <Link 
                                to="/vendor-auth" 
                                className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-150 text-sm shadow-lg hover:shadow-xl active:scale-98"
                            >
                                Join Vendor Network
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Row: Features list */}
                    <div className="flex flex-wrap items-center gap-y-4 gap-x-8 md:gap-x-10 text-xs font-bold text-slate-350">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#0091d5]" />
                            <span>Get More Inquiries</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-[#0091d5]" />
                            <span>Expand Global Network</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-[#0091d5]" />
                            <span>Grow Your Business</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#0091d5]" />
                            <span>Trusted by Professionals</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetInTouch;
