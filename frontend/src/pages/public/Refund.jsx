import React from 'react';
import { RefreshCcw, Calendar, AlertCircle, Mail, Phone, MapPin, Building, CreditCard } from 'lucide-react';

const Refund = () => {
    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-20 font-sans text-slate-900">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex p-3 bg-[#0066FF]/10 rounded-2xl text-[#0066FF] mb-4 shadow-sm">
                        <RefreshCcw size={36} strokeWidth={2.5} />
                    </div>
                    <span className="text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block">
                        Our Policies
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[#0B1E43] tracking-tight uppercase">
                        Cancellation & <span className="text-[#0066FF]">Refund</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold mt-4">
                        <Calendar size={16} className="text-[#0066FF]" />
                        <span>Effective Date: 25th February 2025</span>
                    </div>
                </div>

                {/* Content Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-5 relative z-10">
                        <p className="font-medium text-slate-800 text-lg">
                            At <span className="text-[#0066FF] font-bold">Logisticsscanner.com</span>, we act strictly as a facilitator connecting customers and logistics vendors (such as Freight Forwarders, LAND transporters, and Warehousing providers) across both B2B and B2C segments.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Sections */}
                    <div className="space-y-10 text-sm md:text-base relative z-10">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Refunds are Considered if:
                            </h2>
                            <div className="pl-5">
                                <ul className="list-none space-y-3">
                                    {[
                                        "There is a duplicate payment made due to a technical error.",
                                        "A paid service (e.g., vendor listing upgrade) is not activated due to a fault directly on our end."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Refunds are NOT Issued for:
                            </h2>
                            <div className="pl-5">
                                <ul className="list-none space-y-3">
                                    {[
                                        "A change of mind after vendor registration or subscription purchase.",
                                        "Service dissatisfaction or any disputes arising directly with vendors (vendors are solely responsible for service execution)."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Refund Process
                            </h2>
                            <div className="pl-5">
                                <ol className="list-decimal list-outside text-slate-600 space-y-3 pl-4 leading-relaxed marker:text-[#0066FF] marker:font-bold">
                                    <li>Email <span className="text-[#0B1E43] font-bold">info@logisticdekho.com</span> with clear payment proof and your reason for requesting a refund.</li>
                                    <li>Approved refunds will be processed directly to your original payment method.</li>
                                    <li>Please allow <span className="text-[#0066FF] font-bold">7 to 10 Business Days</span> for the credited amount to reflect in your account.</li>
                                </ol>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Payment Gateway Fees
                            </h2>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 mt-4 shadow-sm">
                                <AlertCircle size={24} className="text-red-500 shrink-0" />
                                <div>
                                    <strong className="text-red-600 uppercase tracking-wider block mb-2 text-sm font-black">Non-refundable Elements:</strong>
                                    <p className="text-slate-700 leading-relaxed">
                                        Any payment gateway charges, applicable taxes, and associated bank processing fees are strictly non-refundable under all circumstances.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100 my-8" />

                        {/* Contact info */}
                        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                            <h3 className="text-lg font-black text-[#0B1E43] uppercase tracking-wider flex items-center gap-3">
                                <Building size={20} className="text-[#0066FF]" /> Contact Information
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                If you require assistance regarding our Cancellation & Refund Policy, please contact our support team:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-[#0066FF]" />
                                    </div>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        <strong className="block text-[#0B1E43] mb-1">BNB Worldwide Pvt. Ltd.</strong>
                                        210/2, S/F, Commercial Flats,<br />District Centre, Janakpuri,<br />New Delhi, Delhi, India, 110058
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 flex items-center justify-center shrink-0">
                                            <Mail size={18} className="text-[#0066FF]" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">info@logisticdekho.com</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 flex items-center justify-center shrink-0">
                                            <Phone size={18} className="text-[#0066FF]" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">92663 35550</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Refund;
