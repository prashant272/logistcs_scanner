import React from 'react';
import { User, Users, Ship, Warehouse, ClipboardList, Truck } from 'lucide-react';

const WhoWeConnect = () => {
    const connections = [
        {
            icon: <User size={30} className="text-[#0066FF]" />,
            title: "Importers & Exporters",
            desc: "Find the best logistics partners and compare competitive rates."
        },
        {
            icon: <Users size={30} className="text-[#0066FF]" />,
            title: "Freight Forwarders",
            desc: "Expand your network and grow your logistics business globally."
        },
        {
            icon: <Ship size={30} className="text-[#0066FF]" />,
            title: "NVOCCs & Shipping Lines",
            desc: "Connect with global partners and increase your market reach."
        },
        {
            icon: <Warehouse size={30} className="text-[#0066FF]" />,
            title: "Warehouses & 3PLs",
            desc: "Showcase your services and get more business opportunities."
        },
        {
            icon: <ClipboardList size={30} className="text-[#0066FF]" />,
            title: "Customs Brokers (CHA)",
            desc: "Collaborate and simplify customs clearance worldwide."
        },
        {
            icon: <Truck size={30} className="text-[#0066FF]" />,
            title: "Transport Providers",
            desc: "Connect with forwarders and grow your transport business."
        }
    ];

    return (
        <section className="py-10 bg-white  px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="w-full max-w-[1400px] mx-auto text-center">
                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black !text-slate-950 mb-14 tracking-tight">
                    Who We Connect With
                </h2>

                {/* Connections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                    {connections.map((c, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col items-center text-center space-y-4 hover:-translate-y-1 hover:shadow-md hover:border-[#0066FF]/35 transition-all duration-300"
                        >
                            {/* Icon Container */}
                            <div className="shrink-0 p-3.5 bg-slate-50 rounded-2xl flex items-center justify-center">
                                {c.icon}
                            </div>

                            {/* Content */}
                            <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                                <h3 className="text-xs font-black !text-slate-900 tracking-wide uppercase leading-snug">
                                    {c.title}
                                </h3>
                                <p className="text-[10px] !text-slate-600 font-bold leading-normal">
                                    {c.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhoWeConnect;


