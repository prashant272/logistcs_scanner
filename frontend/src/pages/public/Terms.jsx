import React from 'react';
import { ShieldCheck, Calendar, Building, Globe, MapPin, Mail, Phone } from 'lucide-react';

const Terms = () => {
    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-20 font-sans text-slate-900">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex p-3 bg-[#0066FF]/10 rounded-2xl text-[#0066FF] mb-4 shadow-sm">
                        <ShieldCheck size={36} strokeWidth={2.5} />
                    </div>
                    <span className="text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block">
                        Legal Documentation
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[#0B1E43] tracking-tight uppercase">
                        Terms & <span className="text-[#0066FF]">Conditions</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold mt-4">
                        <Calendar size={16} className="text-[#0066FF]" />
                        <span>Effective Date: 25th July 2025</span>
                    </div>
                </div>

                {/* Content Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-5 relative z-10">
                        <p className="font-medium text-slate-800 text-lg">
                            This document is an electronic record in terms of the Information Technology Act, 2000 and rules made thereunder, and the amended provisions relating to electronic records in various statutes as amended by the Information Technology Act, 2000.
                        </p>
                        <p>
                            This document is published in accordance with Rule 3(1) of the Information Technology (Intermediaries Guidelines) Rules, 2011 that require publishing the rules and regulations, privacy policy and terms of use for access or usage of <span className="text-[#0066FF] font-bold">www.logisticsscanner.com</span> (“Website”), including the related mobile site and mobile application (collectively, “Platform”).
                        </p>
                        <p>
                            The Platform is owned and operated by <span className="text-[#0B1E43] font-black">BNB Worldwide Pvt. Ltd.</span>, formerly known as BNB Travel Community (OPC) Private Limited, a company registered under the Companies Act, with its registered office at 210/2, S/F, Commercial Flats, District Centre, Janakpuri, New Delhi, India, 110058 (hereinafter referred to as “Platform Owner”, “we”, “us” or “our”).
                        </p>
                        <p>
                            By accessing, browsing, or otherwise using the Platform, you agree to be bound by these Terms and Conditions (“Terms of Use”) and our policies, including but not limited to the Privacy Policy and Cancellation & Refund Policy.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Sections */}
                    <div className="space-y-10 text-sm md:text-base relative z-10">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                1. Platform & Services
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                Logisticsscanner.com is an online marketplace connecting customers and vendors in the logistics sector. We deal with vendors such as Freight Forwarders, LAND transport service providers, Warehousing companies, and Custom House Agents, offering B2B and B2C logistics solutions. We act only as a facilitator; actual services and rates are offered by third-party vendors.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                2. Eligibility & User Obligations
                            </h2>
                            <div className="pl-5">
                                <ul className="list-none space-y-3">
                                    {[
                                        "You must be at least 18 years old to use the Platform.",
                                        "You agree to provide accurate and current information during registration.",
                                        "You agree not to use the Platform for unlawful purposes.",
                                        "You agree to pay all applicable charges for paid services."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                3. Vendor Rates & Disclaimers
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                Rates are provided directly by third-party vendors. We do not verify or guarantee the accuracy of rates or the service quality. We are not liable for any errors, disputes, or losses arising from vendor data or agreements.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                4. Payments
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                Payments are securely processed through PhonePe and other verified payment gateways. Please note that payment gateway charges and applicable taxes are non-refundable.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                5. Intellectual Property
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                All content, layout design, icons, logos, databases, and software on the Platform are the intellectual property of BNB Worldwide Pvt. Ltd. or its licensors.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                6. Limitation of Liability
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                We shall not be liable for any indirect, incidental, or consequential damages. Our maximum liability is strictly limited to the amount paid by you for using our services, or Rs. 100, whichever is less.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                7. Indemnity & Modifications
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                You agree to indemnify and hold harmless Platform Owner, its affiliates, and agents from any claims, damages, or legal actions arising from your breach of these Terms or applicable laws. We reserve the right to revise these Terms at any time.
                            </p>
                        </section>

                        <hr className="border-slate-100 my-8" />

                        {/* Contact info card inside */}
                        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                            <h3 className="text-lg font-black text-[#0B1E43] uppercase tracking-wider flex items-center gap-3">
                                <Building size={20} className="text-[#0066FF]" /> Contact Information
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                For any questions regarding these Terms & Conditions, please contact us:
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

export default Terms;
