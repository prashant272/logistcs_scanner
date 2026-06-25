import React from 'react';
import { Globe, Users, FileText, Handshake } from 'lucide-react';

const OurNetwork = () => {
    const networkStats = [
        {
            icon: <Globe size={40} className="text-[#0066FF]" />,
            value: "100+",
            label: "Countries Covered",
            desc: "Global presence across 6 continents"
        },
        {
            icon: <Users size={40} className="text-[#0066FF]" />,
            value: "2000+",
            label: "Active Users",
            desc: "Growing global logistics community"
        },
        {
            icon: <FileText size={40} className="text-[#0066FF]" />,
            value: "3000+",
            label: "Monthly Requests",
            desc: "Monthly requests from importers & exporters"
        },
        {
            icon: <Handshake size={40} className="text-[#0066FF]" />,
            value: "1000+",
            label: "Approved Vendors",
            desc: "Approved vendors worldwide"
        }
    ];

    return (
        <section className="py-10 bg-white  px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="w-full max-w-[1400px] mx-auto">
                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-center !text-slate-950 mb-14 tracking-tight uppercase">
                    Our Network in World
                </h2>

                {/* Stats Container (White background, light borders, clean shadow) */}
                <div className="bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.04)] border border-slate-200/80 p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
                    {networkStats.map((stat, idx) => (
                        <div 
                            key={idx} 
                            className={`flex items-start gap-5 transition-all duration-300 ${
                                idx !== networkStats.length - 1 ? 'lg:border-r lg:border-slate-200 lg:pr-8' : ''
                            }`}
                        >
                            {/* Icon Wrapper */}
                            <div className="shrink-0 pt-1">
                                {stat.icon}
                            </div>

                            {/* Text Wrapper */}
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black !text-[#0066FF] leading-none tracking-tight">
                                    {stat.value}
                                </h3>
                                <h4 className="text-xs font-black !text-slate-900 tracking-wide uppercase">
                                    {stat.label}
                                </h4>
                                <p className="text-[11px] !text-slate-600 font-bold leading-relaxed">
                                    {stat.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OurNetwork;


