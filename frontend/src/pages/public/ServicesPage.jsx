import React, { useState } from 'react';
import { Truck, Globe, Rocket, Package, ShoppingCart, FileText, Pill, ShieldAlert, RotateCcw, Check, Phone, ChevronRight, Building2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServicesPage = () => {
    const [activeTab, setActiveTab] = useState('domestic');

    const mainServices = [
        {
            id: 'domestic',
            icon: Truck,
            label: "Domestic",
            title: "Domestic Courier",
            subtitle: "Pan-India delivery powered by DTDC",
            desc: "India's most reliable domestic courier service with DTDC's gold-standard network. We handle everything from envelopes to heavy parcels, delivering to 19,000+ pin codes across all 28 states.",
            features: [
                "Same-day pickup available",
                "19,000+ pin codes covered",
                "Next-day delivery to major cities",
                "Real-time tracking on every shipment",
                "COD (Cash on Delivery) available",
                "Doorstep pickup & delivery",
                "Fragile item handling",
                "Insurance cover available"
            ],
            partner: "DTDC",
            color: "from-blue-900/20 to-dark-900",
            tag: "Most Popular"
        },
        {
            id: 'international',
            icon: Globe,
            label: "International",
            title: "International Shipping",
            subtitle: "220+ countries via DHL, FedEx, UPS & Aramex",
            desc: "Send your parcels and documents to any corner of the world. As authorized partners of DHL, FedEx, UPS, Aramex, TNT and DPD, we offer the best rates and transit times for international shipments.",
            features: [
                "220+ countries & territories",
                "Authorized DHL, FedEx, UPS & Aramex partner",
                "Best rate comparison across carriers",
                "Customs documentation assistance",
                "Express & Economy options",
                "Real-time international tracking",
                "Door-to-door service",
                "Insurance & shipment protection"
            ],
            partner: "DHL / FedEx / UPS",
            color: "from-purple-900/20 to-dark-900",
            tag: "Global"
        },
        {
            id: 'express',
            icon: Rocket,
            label: "Express",
            title: "Express Delivery",
            subtitle: "Time-critical same-day & next-day service",
            desc: "When every minute matters. Our Express service guarantees the fastest transit times for your most urgent shipments — be it legal documents, medical samples, or critical business materials.",
            features: [
                "Same-day city delivery",
                "Next-day pan-India service",
                "Priority handling & scanning",
                "Dedicated delivery executive",
                "Guaranteed time-slot delivery",
                "Live tracking with SMS alerts",
                "Proof of delivery signature",
                "24/7 emergency booking"
            ],
            partner: "DTDC / DHL Express",
            color: "from-red-900/20 to-dark-900",
            tag: "Fastest"
        },
        {
            id: 'ecommerce',
            icon: ShoppingCart,
            label: "E-Commerce",
            title: "E-Commerce Logistics",
            subtitle: "End-to-end fulfilment for online sellers",
            desc: "Designed for Meesho sellers, Amazon vendors, Flipkart merchants, and D2C brands who need reliable high-volume shipping with COD settlements and return management.",
            features: [
                "Bulk pickup scheduling",
                "COD remittance within 2 days",
                "Reverse logistics & returns",
                "Multiple marketplace integration",
                "Weight & dimension verification",
                "Dedicated account manager",
                "Monthly MIS reports",
                "Competitive volume pricing"
            ],
            partner: "DTDC + Multi-Carrier",
            color: "from-green-900/20 to-dark-900",
            tag: "For Sellers"
        }
    ];

    const allServices = [
        { icon: Truck, title: "Domestic Courier", desc: "Pan-India delivery to 19,000+ pin codes via DTDC's express network.", partner: "DTDC" },
        { icon: Globe, title: "International Courier", desc: "Global shipping to 220+ countries via DHL, FedEx, UPS & Aramex.", partner: "Multi-Carrier" },
        { icon: Rocket, title: "Express Delivery", desc: "Same-day and next-day priority services for urgent shipments.", partner: "DTDC / DHL" },
        { icon: Package, title: "Bulk & Cargo", desc: "Specialized handling for heavy industrial and commercial shipments.", partner: "DTDC / TNT" },
        { icon: ShoppingCart, title: "E-Commerce Shipping", desc: "End-to-end logistics with COD collection for online vendors.", partner: "Multi-Carrier" },
        { icon: FileText, title: "Document Courier", desc: "Secure, tamper-proof delivery for legal, academic & business documents.", partner: "DTDC / DHL" },
        { icon: Pill, title: "Medicine Express", desc: "Temperature-sensitive and time-critical medical supply deliveries.", partner: "FedEx / UPS" },
        { icon: ShieldAlert, title: "Fragile Item Handling", desc: "Customized bubble wrapping and extra-care packaging for delicate goods.", partner: "All Carriers" },
        { icon: RotateCcw, title: "Reverse Logistics", desc: "Hassle-free return management and pickup scheduling for businesses.", partner: "DTDC" },
    ];

    const activeService = mainServices.find(s => s.id === activeTab);

    return (
        <div className="bg-dark-900 min-h-screen pt-24 pb-20 text-white">
            {/* Hero Banner */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-dark-900/60 to-dark-900" />
                <div className="relative container mx-auto px-6 py-20 text-center">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-4">
                        Trusted Solutions
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display text-white mb-6 leading-tight">
                        Best Logistics &<br />
                        <span className="text-gold italic">Courier Services in Dwarka</span>
                    </h1>
                    <p className="text-white/60 max-w-3xl mx-auto text-lg font-light leading-relaxed mb-10">
                        Authorized partners of <span className="text-gold font-bold">DTDC, DHL, FedEx, UPS, Aramex, TNT & DPD</span> — connecting Dwarka to the world with precision, speed, and absolute reliability.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="tel:+918851205871" className="px-8 py-4 bg-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 rounded-xl flex items-center gap-2">
                            <Phone size={18} /> Book Pickup Now
                        </a>
                        <Link to="/contact" className="px-8 py-4 border border-gold/50 text-gold font-bold uppercase tracking-widest hover:bg-gold/10 transition-all rounded-xl">
                            Get a Quote
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Services Tabs */}
            <div className="container mx-auto px-6 mt-20 mb-28">
                <div className="text-center mb-12">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-3">Core Offerings</span>
                    <h2 className="text-4xl md:text-5xl font-display text-white">
                        Choose Your <span className="text-gold italic">Service</span>
                    </h2>
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {mainServices.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveTab(s.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === s.id
                                ? 'bg-gold text-black shadow-lg shadow-gold/20'
                                : 'bg-white/5 border border-white/10 text-white/70 hover:border-gold/40 hover:text-gold'
                                }`}
                        >
                            <s.icon size={16} />
                            {s.label}
                            {s.tag && activeTab === s.id && (
                                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">{s.tag}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Active Service Detail */}
                {activeService && (
                    <div className={`bg-gradient-to-br ${activeService.color} border border-white/10 rounded-3xl p-8 md:p-14 transition-all duration-500`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gold text-xs font-bold uppercase tracking-widest border border-gold/30 px-3 py-1 rounded-full">{activeService.tag}</span>
                                    <span className="text-white/40 text-xs uppercase tracking-widest">via {activeService.partner}</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-display text-white mt-4 mb-3">{activeService.title}</h3>
                                <p className="text-gold text-sm font-bold mb-6 tracking-wide">{activeService.subtitle}</p>
                                <p className="text-white/70 leading-relaxed font-light text-lg mb-8">{activeService.desc}</p>
                                <div className="flex flex-wrap gap-3">
                                    <a href="https://wa.me/918851205871" target="_blank" rel="noreferrer" className="px-8 py-3.5 bg-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all rounded-xl text-sm">
                                        Book Now
                                    </a>
                                    <Link to="/contact" className="px-8 py-3.5 border border-white/20 text-white font-bold uppercase tracking-widest hover:border-gold hover:text-gold transition-all rounded-xl text-sm">
                                        Get Quote
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-white/40 text-xs uppercase tracking-widest mb-6 font-bold">What's Included</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeService.features.map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-gold/30 transition-colors">
                                            <Check size={16} className="text-gold shrink-0" />
                                            <span className="text-white/80 text-sm font-light">{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* All Services Grid */}
            <div className="container mx-auto px-6 mb-28">
                <div className="text-center mb-16">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-3">Complete Portfolio</span>
                    <h2 className="text-4xl md:text-5xl font-display text-white">
                        All <span className="text-gold italic">Services</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allServices.map((s, i) => (
                        <div key={i} className="group bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-gold/40 transition-all duration-500 hover:-translate-y-2 flex flex-col">
                            <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold group-hover:text-black transition-all duration-500 text-gold">
                                <s.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-xl font-display text-white group-hover:text-gold transition-colors">{s.title}</h3>
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed font-light mb-4">{s.desc}</p>
                                <span className="text-xs text-gold/70 font-bold uppercase tracking-widest border border-gold/20 px-2 py-1 rounded-md">{s.partner}</span>
                            </div>
                            <a href="https://wa.me/918851205871" target="_blank" rel="noreferrer" className="mt-6 flex items-center gap-2 text-gold text-sm font-bold group-hover:gap-3 transition-all">
                                Book Now <ArrowRight size={16} />
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corporate / Business Plans */}
            <div className="container mx-auto px-6 mb-28">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: Building2,
                            name: "Starter",
                            for: "Individuals & Occasional Shippers",
                            price: "Pay Per Shipment",
                            features: ["No monthly commitment", "All carrier access", "Real-time tracking", "Doorstep pickup"],
                            cta: "Start Now",
                            highlight: false
                        },
                        {
                            icon: Package,
                            name: "Business",
                            for: "E-commerce & Regular Sellers",
                            price: "Contract Rates",
                            features: ["Dedicated account manager", "Bulk discounts on 10+ shipments", "COD settlement within 2 days", "Priority pickup scheduling", "Monthly MIS reports"],
                            cta: "Contact Us",
                            highlight: true
                        },
                        {
                            icon: Building2,
                            name: "Enterprise",
                            for: "Corporates & Large Businesses",
                            price: "Custom Pricing",
                            features: ["Exclusive wholesale rates", "Multi-location pickup", "White-label solution", "Dedicated support line", "Custom SLA agreements"],
                            cta: "Request Proposal",
                            highlight: false
                        }
                    ].map((plan, i) => (
                        <div key={i} className={`relative rounded-3xl p-8 border transition-all hover:-translate-y-1 ${plan.highlight
                            ? 'bg-gold/10 border-gold shadow-2xl shadow-gold/10'
                            : 'bg-white/5 border-white/10 hover:border-gold/30'
                            }`}>
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                    Most Popular
                                </div>
                            )}
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-display text-white mb-1">{plan.name}</h3>
                                <p className="text-white/50 text-xs mb-4">{plan.for}</p>
                                <p className={`text-xl font-bold ${plan.highlight ? 'text-gold' : 'text-white'}`}>{plan.price}</p>
                            </div>
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f, fi) => (
                                    <li key={fi} className="flex items-center gap-3 text-white/70 text-sm font-light">
                                        <Check size={14} className="text-gold shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <a href="https://wa.me/918851205871" target="_blank" rel="noreferrer"
                                className={`w-full flex items-center justify-center py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${plan.highlight
                                    ? 'bg-gold text-black hover:bg-white'
                                    : 'border border-gold/40 text-gold hover:bg-gold/10'
                                    }`}>
                                {plan.cta} <ChevronRight size={16} className="ml-1" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Strip */}
            <div className="container mx-auto px-6">
                <div className="relative bg-white/5 border border-gold/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-4">Get Started Today</span>
                        Ready to Ship <span className="text-gold italic">with Us?</span>
                    <p className="text-white/60 max-w-2xl mx-auto mb-10 font-light">
                        Call us, WhatsApp us, or walk into our branch at Dwarka. Our team is available 6 days a week to help you find the best carrier and rate for your shipment.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="tel:+918851205871" className="px-10 py-4 bg-gold text-black font-black uppercase tracking-widest hover:bg-white transition-all rounded-xl flex items-center gap-2 transform hover:scale-105">
                            <Phone size={18} /> +91 88512 05871
                        </a>
                        <a href="https://wa.me/918851205871" target="_blank" rel="noreferrer" className="px-10 py-4 border border-green-500 text-green-400 font-bold uppercase tracking-widest hover:bg-green-500/10 transition-all rounded-xl">
                            WhatsApp Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
