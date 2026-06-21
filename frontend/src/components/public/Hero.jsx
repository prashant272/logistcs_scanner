import React from 'react';
import { Users, ArrowLeftRight, Handshake, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const navigate = useNavigate();

    const features = [
        { icon: <Users size={18} />, title: "Connect", desc: "Build global partnerships" },
        { icon: <ArrowLeftRight size={18} />, title: "Compare", desc: "Compare rates and services" },
        { icon: <Handshake size={18} />, title: "Collaborate", desc: "Work together seamlessly" },
        { icon: <TrendingUp size={18} />, title: "Grow", desc: "Expand your business globally" }
    ];

    return (
        <section className="relative w-full min-h-[500px] lg:min-h-[580px] bg-gradient-to-r from-white via-[#f5f9ff] to-[#e0f0ff] pt-28 pb-28 lg:pb-36 font-sans border-b border-slate-100/50 flex items-center">
            {/* Background Images & Overlays */}
            <div className="absolute inset-0 z-0 select-none overflow-hidden">
                {/* Desktop Image */}
                <img 
                    src="/logistics_network_hero.png" 
                    alt="Global Logistics Network Desktop" 
                    className="hidden md:block w-full h-full object-cover object-right"
                />
                {/* Mobile Image */}
                <img 
                    src="/mobile_hero_bg.png" 
                    alt="Global Logistics Network Mobile" 
                    className="block md:hidden w-full h-full object-cover object-center"
                />
                
                {/* Desktop Overlay: Light gradient */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent z-10" />
                
                {/* Mobile Overlay: Dark gradient for text visibility */}
                <div className="block md:hidden absolute inset-0 bg-gradient-to-b from-[#0B1E43]/90 via-[#0B1E43]/60 to-[#0B1E43]/90 z-10" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-10 md:mt-0">
                    
                    {/* Left Column: Brand text & features (6/12) */}
                    <div className="lg:col-span-6 space-y-6 text-left animate-fade-in-up">
                        <span className="text-xs font-black text-[#00b2fe] md:text-[#0066FF] uppercase tracking-[0.25em] block drop-shadow-md md:drop-shadow-none">
                            Global Logistics Network
                        </span>
                        
                        <h1 className="text-5xl md:text-5xl lg:text-[2.75rem] font-black text-white md:!text-slate-950 leading-[1.15] tracking-tight drop-shadow-lg md:drop-shadow-none">
                            The Global Network <br />
                            for Logistics <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b2fe] to-white md:from-[#0066FF] md:to-[#00b2fe]">Professionals</span>
                        </h1>

                        <p className="text-white/95 md:!text-slate-800 text-base md:text-sm font-black md:font-bold leading-relaxed max-w-lg drop-shadow-md md:drop-shadow-none">
                            Join Freight Forwarders, NVOCCs, Shipping Lines, Warehouses and Customs Brokers from around the world to accelerate your operations.
                        </p>

                        {/* 4 Feature Items */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
                            {features.map((f, i) => (
                                <div key={i} className="space-y-2 bg-white/10 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none backdrop-blur-sm md:backdrop-blur-none border border-white/20 md:border-transparent">
                                    <div className="text-[#00b2fe] md:text-[#0066FF] flex items-center justify-start drop-shadow-sm md:drop-shadow-none">
                                        {f.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white md:!text-slate-900 tracking-wide">{f.title}</h4>
                                        <p className="text-[10px] text-white/80 md:!text-slate-600 font-bold leading-normal mt-0.5">{f.desc}</p>
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
                                className="px-7 py-3.5 border-2 border-white md:border-[#0066FF] hover:bg-white/10 md:hover:bg-[#0066FF]/5 text-white md:text-[#0066FF] text-xs font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer bg-transparent drop-shadow-md md:drop-shadow-none"
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
