import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronDown, ChevronUp, Package, Globe, Truck } from 'lucide-react';

const Contact = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I book a pickup?",
            answer: "Simply call us, WhatsApp us, or visit our branch at Greater Noida West. We offer same-day pickup for orders placed before 4 PM."
        },
        {
            question: "Which courier services do you offer?",
            answer: "We are authorized partners of DTDC, DHL, FedEx, UPS, Aramex, TNT, and DPD — covering domestic and international shipments to 220+ countries."
        },
        {
            question: "How can I track my shipment?",
            answer: "Use the 'Track Shipment' page on our website, or enter your AWB number on the carrier's website directly. Our team is always available to assist."
        },
        {
            question: "Do you offer COD (Cash on Delivery)?",
            answer: "Yes, COD is available for select domestic routes. Please contact us to confirm availability for your specific destination."
        },
        {
            question: "What items are restricted for international shipping?",
            answer: "Restricted items include battery-powered devices, flammable liquids, and certain food items. Contact us for a complete restricted items list based on your destination country."
        },
    ];

    return (
        <div className="bg-dark-900 min-h-screen pt-24 pb-20 text-white">
            {/* Header */}
            <div className="container mx-auto px-6 text-center mb-20">
                <span className="text-gold text-sm font-bold tracking-[0.3em] uppercase block mb-4">
                    Contact Us
                </span>
                <h1 className="text-4xl md:text-6xl font-display text-white mb-6">
                    Get in Touch with <span className="text-gold italic">Logistics Scanner</span>
                </h1>
                <p className="text-white/60 max-w-2xl mx-auto text-lg font-light">
                    Whether you need a domestic courier, international freight, or a corporate logistics solution — our elite team is ready to help.
                </p>
            </div>

            {/* Quick Service Cards */}
            <div className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Package, title: "Book a Pickup", desc: "Call or WhatsApp us for same-day pickup scheduling.", cta: "Call Now", href: "tel:+918851205871" },
                        { icon: Globe, title: "International Shipping", desc: "Get a quote for DHL, FedEx, UPS & Aramex international shipments.", cta: "Get Quote", href: "https://wa.me/918851205871" },
                        { icon: Truck, title: "Track Shipment", desc: "Real-time tracking for all your domestic and international parcels.", cta: "Track Now", href: "/track" },
                    ].map((card, i) => (
                        <a key={i} href={card.href} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-gold/40 transition-all group hover:-translate-y-1 block">
                            <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                                <card.icon size={24} className="text-gold" />
                            </div>
                            <h3 className="text-xl font-display text-white mb-2">{card.title}</h3>
                            <p className="text-white/60 text-sm font-light mb-4">{card.desc}</p>
                            <span className="text-gold text-sm font-bold uppercase tracking-wider border-b border-gold/40 pb-0.5 group-hover:border-gold transition-colors">{card.cta} →</span>
                        </a>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Left Column: Contact Info */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-gold/30 transition-all">
                            <MapPin className="text-gold mb-4" size={24} />
                            <h3 className="font-bold text-white mb-2">Our Branch</h3>
                            <p className="text-white/60 text-sm leading-relaxed">Plot No 47, Baba Haridass Market, Tura Mandi, Najafgarh, Near Reliance Smart Mall, Delhi - 110043</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-gold/30 transition-all">
                            <Phone className="text-gold mb-4" size={24} />
                            <h3 className="font-bold text-white mb-2">Call / WhatsApp</h3>
                            <p className="text-white/60 text-sm">+91 88512 05871</p>
                            <p className="text-white/60 text-sm">+91 95552 54163</p>
                            <p className="text-white/60 text-sm">+91 88826 63673</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-gold/30 transition-all">
                            <Mail className="text-gold mb-4" size={24} />
                            <h3 className="font-bold text-white mb-2">Email Us</h3>
                            <p className="text-white/60 text-sm">info@logisticscanner.com</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-gold/30 transition-all">
                            <Clock className="text-gold mb-4" size={24} />
                            <h3 className="font-bold text-white mb-2">Working Hours</h3>
                            <p className="text-white/60 text-sm">Mon – Sat</p>
                            <p className="text-white/60 text-sm">9:00 AM – 8:00 PM</p>
                        </div>
                    </div>

                    {/* Google Map */}
                    <div className="rounded-2xl overflow-hidden border border-white/10 h-64 w-full relative">
                        <iframe
                             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.186!2d77.4315!3d28.6239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDM3JzI2LjQiTiA3N8KwMjUnNTMuNCJF!5e0!3m2!1sen!2sin!4v1620000000000"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'grayscale(80%) invert(90%) contrast(90%)' }}
                            allowFullScreen=""
                            loading="lazy"
                            title="Logistics Scanner Location"
                        />
                        <div className="absolute inset-0 pointer-events-none mix-blend-overlay bg-gold/5" />
                    </div>

                    {/* WhatsApp CTA */}
                    <a
                        href="https://wa.me/918851205871"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all uppercase tracking-wider hover:scale-[1.02] transform"
                    >
                        <MessageCircle size={22} />
                        Book Pickup via WhatsApp
                    </a>
                </div>

                {/* Right Column: Form & FAQ */}
                <div className="space-y-12">
                    {/* Contact Form */}
                    <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                        <h3 className="text-2xl font-display text-white mb-2">Request a Quote</h3>
                        <p className="text-white/50 text-sm mb-8 font-light">Fill in your shipment details and we'll get back to you within 30 minutes.</p>
                        <form className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Full Name</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-gold focus:outline-none transition-colors placeholder:text-gray-600" placeholder="Your Name" />
                                </div>
                                <div>
                                    <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Phone</label>
                                    <input type="tel" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-gold focus:outline-none transition-colors placeholder:text-gray-600" placeholder="+91 XXXXX XXXXX" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Email</label>
                                <input type="email" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-gold focus:outline-none transition-colors placeholder:text-gray-600" placeholder="your@email.com" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Service Type</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-gray-400 focus:border-gold focus:outline-none transition-colors">
                                        <option>Select Service</option>
                                        <option>Domestic Courier (DTDC)</option>
                                        <option>International - DHL</option>
                                        <option>International - FedEx</option>
                                        <option>International - UPS</option>
                                        <option>International - Aramex</option>
                                        <option>Corporate Contract</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Destination</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-gold focus:outline-none transition-colors placeholder:text-gray-600" placeholder="City / Country" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gold text-xs font-bold uppercase tracking-wider mb-2">Additional Details</label>
                                <textarea rows="3" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-gold focus:outline-none transition-colors placeholder:text-gray-600 resize-none" placeholder="Weight, dimensions, or any special requirements..." />
                            </div>
                            <button className="w-full py-4 bg-gold text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all transform hover:scale-[1.02]">
                                Get Quote Now
                            </button>
                        </form>
                    </div>

                    {/* FAQ Section */}
                    <div>
                        <h3 className="text-2xl font-display text-white mb-6">Common Questions</h3>
                        <div className="space-y-3">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden hover:border-white/20 transition-colors">
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                                    >
                                        <span className="font-bold text-white text-sm pr-4">{faq.question}</span>
                                        {openFaq === index
                                            ? <ChevronUp className="text-gold shrink-0" size={18} />
                                            : <ChevronDown className="text-white/40 shrink-0" size={18} />}
                                    </button>
                                    {openFaq === index && (
                                        <div className="px-6 pb-5 text-white/60 text-sm border-t border-white/5 pt-4 font-light leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
