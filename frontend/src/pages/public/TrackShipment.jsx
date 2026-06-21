import React, { useState } from 'react';
import { Search, Package, CheckCircle, Truck, Globe, Clock, Phone, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';

const carriers = [
    {
        id: 'dtdc',
        name: 'DTDC',
        logo: '/courier/dtdc.png',
        prefix: ['D', 'Z', 'H'],
        example: 'D12345678',
        trackUrl: 'https://www.dtdc.in/trace.asp?Ttype=show&TNo=',
        color: 'bg-red-600',
        desc: 'Domestic pan-India shipments'
    },
    {
        id: 'dhl',
        name: 'DHL',
        logo: '/courier/dhl.png',
        prefix: ['1', '2', '3', 'J'],
        example: 'JD123456789',
        trackUrl: 'https://www.dhl.com/in-en/home/tracking.html?tracking-id=',
        color: 'bg-yellow-500',
        desc: 'International express shipments'
    },
    {
        id: 'fedex',
        name: 'FedEx',
        logo: '/courier/fadex.png',
        prefix: ['7', '6'],
        example: '7489234567890',
        trackUrl: 'https://www.fedex.com/fedextrack/?trknbr=',
        color: 'bg-purple-600',
        desc: 'International priority shipments'
    },
    {
        id: 'ups',
        name: 'UPS',
        logo: '/courier/ups.png',
        prefix: ['1Z'],
        example: '1Z12345E0291980793',
        trackUrl: 'https://www.ups.com/track?loc=en_IN&tracknum=',
        color: 'bg-amber-700',
        desc: 'Global parcel & freight'
    },
    {
        id: 'aramex',
        name: 'Aramex',
        logo: '/courier/armex.webp',
        prefix: ['4'],
        example: '41234567890',
        trackUrl: 'https://www.aramex.com/us/en/track/results?ShipmentNumber=',
        color: 'bg-orange-600',
        desc: 'Middle East & worldwide'
    },
    {
        id: 'tnt',
        name: 'TNT',
        logo: '/courier/tnt.png',
        prefix: ['GE', 'T'],
        example: 'GE123456789IN',
        trackUrl: 'https://www.tnt.com/express/en_IN/site/tracking.html?searchType=con&cons=',
        color: 'bg-red-700',
        desc: 'Europe & international freight'
    },
    {
        id: 'dpd',
        name: 'DPD',
        logo: '/courier/DPD.png',
        prefix: ['0'],
        example: '01234567890123456789',
        trackUrl: 'https://tracking.dpd.de/status/en_US/parcel/',
        color: 'bg-red-500',
        desc: 'European parcel delivery'
    },
];

const faqs = [
    { q: "Where can I find my tracking number?", a: "Your tracking number (AWB) is on the receipt given to you at the time of booking, or sent via SMS/WhatsApp after pickup confirmation." },
    { q: "How long does tracking update take?", a: "Tracking updates usually appear within 2-4 hours of the parcel being scanned at a logistics hub. International shipments may take up to 24 hours." },
    { q: "My tracking shows 'In Transit' for 2 days — is it normal?", a: "Yes, this is normal for long-distance shipments. If it hasn't moved in 4+ days, please call us at +91 88512 05871 and we'll investigate immediately." },
    { q: "Can I track without a tracking number?", a: "Please contact our team with your booking details (name, phone, date) and we'll retrieve your tracking number for you within minutes." },
];

const TrackShipment = () => {
    const [awb, setAwb] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState(null);
    const [openFaq, setOpenFaq] = useState(null);
    const [error, setError] = useState('');

    const detectCarrier = (value) => {
        if (!value) { setSelectedCarrier(null); return; }
        const upperVal = value.toUpperCase();
        const detected = carriers.find(c =>
            c.prefix.some(p => upperVal.startsWith(p.toUpperCase()))
        );
        setSelectedCarrier(detected || null);
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setAwb(val);
        setError('');
        detectCarrier(val.trim());
    };

    const handleTrack = () => {
        const trimmed = awb.trim();
        if (!trimmed) { setError('Please enter a tracking number.'); return; }
        if (!selectedCarrier) { setError('Could not auto-detect carrier. Please select manually below.'); return; }
        window.open(selectedCarrier.trackUrl + trimmed, '_blank');
    };

    const handleManualCarrier = (carrier) => {
        setSelectedCarrier(carrier);
        setError('');
    };

    return (
        <div className="bg-dark-900 min-h-screen pt-24 pb-20 text-white">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1537704703424-e89d1fa7c3c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-dark-900/40 to-dark-900" />
                <div className="relative container mx-auto px-6 py-16 text-center">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-4">Real-Time Intelligence</span>
                    <h1 className="text-5xl md:text-7xl font-display text-white mb-4 leading-tight">
                        Track Your <span className="text-gold italic">Shipment</span>
                    </h1>
                    <p className="text-white/60 max-w-xl mx-auto font-light">
                        Enter your AWB / tracking number below. We auto-detect the carrier and redirect you to live tracking.
                    </p>
                </div>
            </div>

            {/* Main Tracking Card */}
            <div className="container mx-auto px-6 -mt-4 mb-20 max-w-3xl">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md shadow-2xl shadow-black/50">
                    <label className="block text-gold text-xs font-bold uppercase tracking-widest mb-3">
                        AWB / Tracking Number
                    </label>
                    <div className="flex gap-3 mb-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={awb}
                                onChange={handleChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                placeholder="e.g. D12345678  or  JD123456789"
                                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:border-gold focus:outline-none transition-all placeholder:text-white/20 pr-12"
                            />
                            {selectedCarrier && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <img src={selectedCarrier.logo} alt={selectedCarrier.name} className="h-6 w-auto object-contain" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleTrack}
                            className="px-8 bg-gold text-black font-black uppercase tracking-wider rounded-2xl hover:bg-white transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Search size={18} /> Track
                        </button>
                    </div>

                    {/* Auto-detected carrier indicator */}
                    {selectedCarrier && (
                        <div className="flex items-center gap-2 text-sm text-green-400 mb-4 mt-1">
                            <CheckCircle size={14} />
                            <span>Auto-detected: <strong>{selectedCarrier.name}</strong> — {selectedCarrier.desc}</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400 mb-4 mt-1">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Manual carrier selector */}
                    <div className="mt-6">
                        <p className="text-white/40 text-xs uppercase tracking-widest mb-4 font-bold">Or select carrier manually:</p>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                            {carriers.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleManualCarrier(c)}
                                    title={c.name}
                                    className={`flex flex-col items-center justify-center bg-white rounded-xl p-2 h-14 transition-all hover:scale-110 ${selectedCarrier?.id === c.id ? 'ring-2 ring-gold scale-110' : 'opacity-70 hover:opacity-100'}`}
                                >
                                    <img src={c.logo} alt={c.name} className="h-8 w-full object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direct Track Buttons */}
                    {selectedCarrier && awb.trim() && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <a
                                href={selectedCarrier.trackUrl + awb.trim()}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-3 py-4 bg-gold text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all"
                            >
                                <ExternalLink size={18} />
                                Track on {selectedCarrier.name} Website
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* All Carrier Direct Track Links */}
            <div className="container mx-auto px-6 mb-24">
                <div className="text-center mb-12">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-3">All Carriers</span>
                    <h2 className="text-3xl md:text-4xl font-display text-white">
                        Direct <span className="text-gold italic">Carrier Portals</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {carriers.map((c) => (
                        <a
                            key={c.id}
                            href={c.trackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-gold/40 transition-all group hover:-translate-y-0.5"
                        >
                            <div className="w-20 h-14 bg-white rounded-xl flex items-center justify-center p-3 shrink-0">
                                <img src={c.logo} alt={c.name} className="h-full w-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm">{c.name}</p>
                                <p className="text-white/50 text-xs font-light truncate">{c.desc}</p>
                                <p className="text-gold/60 text-xs mt-1 font-mono">e.g. {c.example}</p>
                            </div>
                            <ExternalLink size={16} className="text-white/30 group-hover:text-gold transition-colors shrink-0" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Tracking Steps */}
            <div className="container mx-auto px-6 mb-24">
                <div className="text-center mb-12">
                    <span className="text-gold text-xs font-bold tracking-[0.4em] uppercase block mb-3">How It Works</span>
                    <h2 className="text-3xl md:text-4xl font-display text-white">
                        Track in <span className="text-gold italic">3 Steps</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    <div className="hidden md:block absolute top-12 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-gold/40 to-gold/40" />
                    <div className="hidden md:block absolute top-12 left-2/3 w-1/6 h-0.5 bg-gold/40" />
                    {[
                        { icon: Package, step: "01", title: "Enter AWB", desc: "Type your tracking number in the search box above. The carrier is auto-detected instantly." },
                        { icon: Search, step: "02", title: "Auto-Detect", desc: "Our system identifies your carrier (DTDC, DHL, FedEx, UPS, etc.) from the tracking format." },
                        { icon: Truck, step: "03", title: "Live Tracking", desc: "You're redirected to the carrier's live tracking portal with your shipment status." },
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center text-center bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-gold/30 transition-all">
                            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mb-4 relative">
                                <step.icon size={28} className="text-gold" />
                                <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-black w-7 h-7 rounded-full flex items-center justify-center">
                                    {step.step}
                                </span>
                            </div>
                            <h3 className="text-xl font-display text-white mb-2">{step.title}</h3>
                            <p className="text-white/60 text-sm font-light leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ */}
            <div className="container mx-auto px-6 mb-24 max-w-3xl">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-display text-white">
                        Tracking <span className="text-gold italic">FAQs</span>
                    </h2>
                </div>
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left"
                            >
                                <span className="font-bold text-white/90 text-sm pr-6">{faq.q}</span>
                                <ChevronRight size={16} className={`text-gold shrink-0 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                            </button>
                            {openFaq === i && (
                                <div className="px-6 pb-5 text-white/60 text-sm font-light leading-relaxed border-t border-white/5 pt-4">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Help CTA */}
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="bg-white/5 border border-gold/20 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div>
                        <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">Need Help?</p>
                        <h3 className="text-2xl font-display text-white mb-2">Can't find your shipment?</h3>
                        <p className="text-white/60 text-sm font-light">Call or WhatsApp us with your booking details and we'll track it for you immediately.</p>
                    </div>
                    <div className="flex flex-col gap-3 shrink-0">
                        <a href="tel:+918851205871" className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gold text-black font-black uppercase tracking-wider rounded-xl hover:bg-white transition-all whitespace-nowrap">
                            <Phone size={16} /> +91 88512 05871
                        </a>
                        <a href="https://wa.me/918851205871" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-8 py-3.5 border border-green-500/50 text-green-400 font-bold uppercase tracking-wider rounded-xl hover:bg-green-500/10 transition-all">
                            WhatsApp Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackShipment;
