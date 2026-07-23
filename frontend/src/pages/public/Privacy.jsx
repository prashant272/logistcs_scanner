import React from 'react';
import { Eye, Calendar, ShieldCheck, Mail, Phone, MapPin, Building, Info } from 'lucide-react';
import useSEO from '../../hooks/useSEO';

const Privacy = () => {
    useSEO({
        title: 'Privacy Policy | Logistics Scanner Data Protection',
        description: 'Read the Logistics Scanner Privacy Policy to understand how we collect, use, and protect your personal and business information.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-20 font-sans text-slate-900">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex p-3 bg-[#0066FF]/10 rounded-2xl text-[#0066FF] mb-4 shadow-sm">
                        <Eye size={36} strokeWidth={2.5} />
                    </div>
                    <span className="text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block">
                        Data Protection
                    </span>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-[#0B1E43] tracking-tight uppercase">
                        Privacy <span className="text-[#0066FF]">Policy</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold mt-4">
                        <Calendar size={16} className="text-[#0066FF]" />
                        <span>Effective Date: 25th July 2025</span>
                    </div>
                </div>

                {/* Content Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none"></div>

                    <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-5 relative z-10">
                        <p className="font-medium text-slate-800 text-lg">
                            <span className="text-[#0B1E43] font-bold">BNB Worldwide Pvt. Ltd.</span> (formerly BNB Travel Community (OPC) Private Limited) values your privacy.
                        </p>
                        <p>
                            This Privacy Policy outlines how we collect, use, and protect your data when you visit <span className="text-[#0066FF] font-bold">www.logisticsscanner.com</span> (the "Platform"). By using our Platform, you consent to the practices described in this policy.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Sections */}
                    <div className="space-y-10 text-sm md:text-base relative z-10">
                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                1. Information We Collect
                            </h2>
                            <div className="pl-5 space-y-4">
                                <p className="text-slate-600 font-bold">We may collect the following types of information:</p>
                                <ul className="list-none space-y-3">
                                    {[
                                        { title: "Personal Information", desc: "Name, email address, phone number, company details, GST numbers, and business addresses provided during registration or inquiry." },
                                        { title: "Logistics Data", desc: "Inquiry details, freight search history, cargo details, and shipment tracking information." },
                                        { title: "Technical Data", desc: "IP address, browser type, device information, and usage statistics collected via cookies and analytics tools." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-full bg-[#0066FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Info size={18} className="text-[#0066FF]" />
                                            </div>
                                            <div>
                                                <strong className="block text-[#0B1E43] mb-1">{item.title}</strong>
                                                <span className="text-slate-600 leading-relaxed block">{item.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                2. How We Use Your Information
                            </h2>
                            <div className="pl-5">
                                <ul className="list-none space-y-3 text-slate-600">
                                    {[
                                        "To connect customers with appropriate freight forwarders and vendors.",
                                        "To provide customer support and respond to inquiries.",
                                        "To send transactional emails, platform updates, and promotional offers.",
                                        "To improve platform performance, security, and user experience.",
                                        "To comply with legal obligations and resolve disputes."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
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
                                3. Information Sharing
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                We act as a bridge between users and vendors. Thus, your <span className="font-bold text-[#0B1E43]">inquiry details and contact information may be shared with relevant third-party vendors</span> to fulfill your logistics requests. We do not sell your personal data to advertisers. We may also share data with law enforcement agencies if required by law.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                4. Data Security
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                We implement industry-standard security measures, including SSL encryption, to protect your data against unauthorized access, alteration, or disclosure. However, no electronic transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                5. Cookies
                            </h2>
                            <p className="text-slate-600 leading-relaxed pl-5">
                                Our Platform uses cookies to enhance user experience, remember login sessions, and track user behavior for analytics. You can control or disable cookies through your browser settings, though some platform features may become unavailable.
                            </p>
                        </section>

                        <hr className="border-slate-100 my-8" />

                        {/* Contact info card */}
                        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                            <h3 className="text-lg font-black text-[#0B1E43] uppercase tracking-wider flex items-center gap-3">
                                <ShieldCheck size={20} className="text-[#0066FF]" /> Privacy Queries
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                If you have any concerns regarding your data or wish to delete your account, please reach out to our grievance officer:
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
                                        <span className="text-sm font-semibold text-slate-700">info@logisticsscanner.com</span>
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

export default Privacy;
