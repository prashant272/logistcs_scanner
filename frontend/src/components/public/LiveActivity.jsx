import React from 'react';
import { ClipboardList, Globe, MessageSquare, Users, Truck, Ship, Plane } from 'lucide-react';

const LiveActivity = () => {
    const stats = [
        {
            icon: <ClipboardList size={26} className="text-[#0066FF]" />,
            value: "1,250+",
            label: "New Inquiries Posted Today",
            bgColor: "bg-blue-50"
        },
        {
            icon: <Globe size={26} className="text-[#10B981]" />,
            value: "78",
            label: "Countries Active Today",
            bgColor: "bg-emerald-50"
        },
        {
            icon: <MessageSquare size={26} className="text-[#F59E0B]" />,
            value: "650+",
            label: "Quotes Submitted",
            bgColor: "bg-amber-50"
        },
        {
            icon: <Users size={26} className="text-[#8B5CF6]" />,
            value: "120+",
            label: "New Business Connections",
            bgColor: "bg-purple-50"
        },
        {
            icon: <Truck size={26} className="text-[#14B8A6]" />,
            value: "85+",
            label: "Services Requested",
            bgColor: "bg-teal-50"
        }
    ];

    const inquiries = [
        {
            type: "sea",
            icon: <Ship size={18} className="text-[#0066FF]" />,
            from: "Mumbai (IN)",
            to: "New York (US)",
            details: "FCL 40HC • General Cargo",
            quotes: "12 Quotes",
            time: "2 min ago"
        },
        {
            type: "sea",
            icon: <Ship size={18} className="text-[#0066FF]" />,
            from: "Shanghai (CN)",
            to: "Hamburg (DE)",
            details: "LCL Shipment • 5 CBM",
            quotes: "8 Quotes",
            time: "5 min ago"
        },
        {
            type: "air",
            icon: <Plane size={18} className="text-[#0066FF]" />,
            from: "Dubai (AE)",
            to: "Delhi (IN)",
            details: "Air Freight • 500 kg",
            quotes: "5 Quotes",
            time: "8 min ago"
        }
    ];

    return (
        <section className="bg-white py-16 px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="w-full max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Left Column: Live Activity Statistics */}
                    <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex flex-col justify-start gap-6">
                        {/* Header & Subtitle */}
                        <div>
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-black !text-slate-950 uppercase tracking-wider">
                                    Today on Logistics Scanner
                                </h3>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wide">Live Activity</span>
                                </div>
                            </div>
                            <p className="!text-slate-500 text-xs font-bold mt-2.5 mb-2 leading-normal">
                                Real-time operational metrics showing platform demand, active global routes, and logistics transaction volume.
                            </p>
                        </div>

                        {/* Horizontal list of 5 stat widgets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            {stats.map((s, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between items-start min-h-[160px] shadow-[0_5px_15px_rgba(0,0,0,0.01)] hover:border-[#0066FF]/40 hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Icon Container */}
                                    <div className={`p-3 rounded-2xl ${s.bgColor} shrink-0`}>
                                        {s.icon}
                                    </div>
                                    <div className="space-y-1.5 w-full pt-4">
                                        <div className="text-2xl md:text-3xl font-black !text-slate-950 tracking-tight leading-none">
                                            {s.value}
                                        </div>
                                        <div className="text-[10px] md:text-[11px] !text-slate-600 font-black leading-snug uppercase tracking-wide">
                                            {s.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Latest Freight Inquiries */}
                    <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-[0_15px_50px_rgba(0,0,0,0.03)] flex flex-col justify-start gap-4">
                        {/* Header */}
                        <div>
                            <div className="border-b border-slate-100 pb-4 mb-3">
                                <h3 className="text-lg font-black !text-slate-950 uppercase tracking-wider">
                                    Latest Freight Inquiries
                                </h3>
                            </div>
                            <p className="!text-slate-500 text-xs font-bold leading-normal">
                                Live bids and freight requirements submitted by cargo owners worldwide.
                            </p>
                        </div>

                        {/* Inquiries list */}
                        <div className="space-y-2.5">
                            {inquiries.map((inq, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-slate-50/45 rounded-2xl border border-slate-150 hover:border-[#0066FF]/35 transition-all duration-300 hover:shadow-sm"
                                >
                                    {/* Route & Icon */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                            {inq.icon}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black !text-slate-950 flex items-center gap-1.5 tracking-tight">
                                                <span>{inq.from}</span>
                                                <span className="text-[#0066FF] font-light">→</span>
                                                <span>{inq.to}</span>
                                            </div>
                                            <div className="text-[10px] !text-slate-600 font-bold tracking-wide mt-0.5">
                                                {inq.details}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quote count & Time */}
                                    <div className="text-right space-y-0.5 shrink-0 ml-2">
                                        <div className="text-[11px] font-black !text-[#0066FF] tracking-wide">
                                            {inq.quotes}
                                        </div>
                                        <div className="text-[10px] !text-slate-500 font-bold">
                                            {inq.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default LiveActivity;
