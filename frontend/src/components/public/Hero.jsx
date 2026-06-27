import React from 'react';
import { Users, ArrowLeftRight, Handshake, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlobeBackground from './GlobeBackground';

const Hero = () => {
    const navigate = useNavigate();

    const features = [
        { icon: <Users size={18} />, title: "Connect", desc: "Build global partnerships" },
        { icon: <ArrowLeftRight size={18} />, title: "Compare", desc: "Compare rates and services" },
        { icon: <Handshake size={18} />, title: "Collaborate", desc: "Work together seamlessly" },
        { icon: <TrendingUp size={18} />, title: "Grow", desc: "Expand your business globally" }
    ];

    return (
        <section className="relative w-full min-h-[500px] lg:min-h-[580px] bg-gradient-to-r from-white via-[#f5f9ff] to-[#e0f0ff] pt-28 pb-28 lg:pb-36 font-sans border-b border-slate-100/50 flex items-center overflow-hidden">
            {/* Background Animation & Overlays */}
            <div className="absolute inset-0 z-0 select-none">
                <GlobeBackground />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-10 md:mt-0">
                    
                    {/* Left Column: Brand text & features (6/12) */}
                    <div className="lg:col-span-6 space-y-6 text-left animate-fade-in-up">
                        <span className="text-xs font-black text-[#0066FF] uppercase tracking-[0.25em] block">
                            Global Logistics Network
                        </span>
                        
                        <h1 className="text-5xl lg:text-[2.75rem] font-black !text-black leading-[1.15] tracking-tight">
                            The Global Network <br />
                            for Logistics <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00b2fe]">Professionals</span>
                        </h1>

                        <p className="!text-slate-900 text-sm font-bold leading-relaxed max-w-lg">
                            Join Freight Forwarders, NVOCCs, Shipping Lines, Warehouses and Customs Brokers from around the world to accelerate your operations.
                        </p>

                        {/* 4 Feature Items */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
                            {features.map((f, i) => (
                                <div key={i} className="space-y-2 bg-transparent p-0">
                                    <div className="text-[#0066FF] flex items-center justify-start">
                                        {f.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black !text-black tracking-wide">{f.title}</h4>
                                        <p className="text-[10px] !text-slate-700 font-bold leading-normal mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4 pt-2 relative z-20">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('search-price-section');
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                        navigate('/vendor-network');
                                    }
                                }}
                                className="px-7 py-3.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-black rounded-lg uppercase tracking-wider transition-all shadow-md shadow-[#0066FF]/10 flex items-center gap-2 cursor-pointer"
                            >
                                Find Freight Rates <span className="font-extrabold">&gt;</span>
                            </button>
                            <button
                                onClick={() => navigate('/vendor-auth')}
                                className="px-7 py-3.5 border-2 border-[#0066FF] hover:bg-[#0066FF]/5 text-[#0066FF] text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                            >
                                Join Vendor Network
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Empty spacer to let the background graphic show (6/12) */}
                    <div className="lg:col-span-6 hidden lg:block h-full min-h-[300px] pointer-events-none" />

                </div>
            </div>
        </section>
    );
};

export default Hero;
