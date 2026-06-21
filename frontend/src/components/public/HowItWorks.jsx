import React from 'react';
import { FileText, Users, ReceiptText, Handshake, Ship } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            number: "1",
            icon: <FileText size={24} className="text-[#0066FF]" />,
            title: "Submit Inquiry",
            desc: "Post your freight request with shipment details."
        },
        {
            number: "2",
            icon: <Users size={24} className="text-[#0066FF]" />,
            title: "Vendors Respond",
            desc: "Multiple verified vendors receive your inquiry."
        },
        {
            number: "3",
            icon: <ReceiptText size={24} className="text-[#0066FF]" />,
            title: "Compare Quotes",
            desc: "Compare rates, services and transit time."
        },
        {
            number: "4",
            icon: <Handshake size={24} className="text-[#0066FF]" />,
            title: "Choose Best Partner",
            desc: "Select the right logistics partner for your shipment."
        },
        {
            number: "5",
            icon: <Ship size={24} className="text-[#0066FF]" />,
            title: "Ship Worldwide",
            desc: "Move your cargo anywhere in the world."
        }
    ];

    return (
        <section className="bg-white py-16 px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="w-full max-w-[1400px] mx-auto text-center">
                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black !text-slate-950 mb-16 tracking-tight">
                    How Logistics Scanner Works
                </h2>

                {/* Steps Row */}
                <div className="relative flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 lg:gap-4">
                    {/* Connecting Line (Desktop) */}
                    <div className="absolute top-6 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 hidden lg:block -z-10" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center max-w-[220px] relative z-10">
                            {/* Step Indicator (Circle Number) */}
                            <div className="w-7 h-7 rounded-full bg-[#0066FF] text-white text-xs font-black flex items-center justify-center mb-4 shadow-sm shadow-[#0066FF]/20">
                                {step.number}
                            </div>

                            {/* Icon Box */}
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-[0_5px_15px_rgba(0,0,0,0.02)]">
                                {step.icon}
                            </div>

                            {/* Title & Desc */}
                            <h3 className="text-sm font-black !text-slate-900 mb-1.5 uppercase tracking-wide">
                                {step.title}
                            </h3>
                            <p className="text-[11px] !text-slate-600 font-bold leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
