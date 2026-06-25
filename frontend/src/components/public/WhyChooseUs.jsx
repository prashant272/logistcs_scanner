import React from 'react';
import { ShieldCheck, CircleDollarSign, Globe, Headset, Lock } from 'lucide-react';

const WhyChooseUs = () => {
    const reasons = [
        {
            icon: <ShieldCheck size={36} className="text-[#0066FF]" />,
            title: "Verified Network",
            desc: "Connect with verified and trusted logistics professionals."
        },
        {
            icon: <CircleDollarSign size={36} className="text-[#0066FF]" />,
            title: "Save Time & Cost",
            desc: "Compare multiple quotes and choose the best logistics solution."
        },
        {
            icon: <Globe size={36} className="text-[#0066FF]" />,
            title: "Global Reach",
            desc: "Expand your business network in 190+ countries."
        },
        {
            icon: <Headset size={36} className="text-[#0066FF]" />,
            title: "Dedicated Support",
            desc: "Our expert team is here to support you at every step."
        },
        {
            icon: <Lock size={36} className="text-[#0066FF]" />,
            title: "Secure Platform",
            desc: "Your data and business information are always safe with us."
        }
    ];

    return (
        <section className="py-10 bg-white  px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="w-full max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
                    
                    {/* Left Column: Title and CTA */}
                    <div className="xl:col-span-3 space-y-4 text-left">
                        <h2 className="text-3xl md:text-4xl font-black !text-slate-950 leading-tight tracking-tight">
                            Why Choose <br />
                            Logistics Scanner?
                        </h2>
                        <p className="!text-slate-600 text-sm font-bold leading-relaxed">
                            Empowering logistics professionals with technology, network and opportunities.
                        </p>
                        <div className="pt-2">
                            <button className="px-6 py-2.5 border border-[#0066FF] hover:bg-[#0066FF]/5 !text-[#0066FF] text-xs font-black rounded-lg transition-all cursor-pointer bg-transparent">
                                Learn More
                            </button>
                        </div>
                    </div>

                    {/* Right Column: 5 Cards Grid */}
                    <div className="xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {reasons.map((r, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col items-center text-center space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                            >
                                {/* Icon Container */}
                                <div className="shrink-0 p-3 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    {r.icon}
                                </div>

                                {/* Text content */}
                                <div className="space-y-1.5 flex-1 flex flex-col justify-start">
                                    <h3 className="text-xs font-black !text-slate-900 tracking-wide uppercase leading-snug">
                                        {r.title}
                                    </h3>
                                    <p className="text-[10px] !text-slate-600 font-bold leading-normal">
                                        {r.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;


