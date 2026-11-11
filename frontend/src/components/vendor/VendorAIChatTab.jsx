import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    Send, Bot, Sparkles, Building2, MapPin, 
    CheckCircle2, DollarSign, ArrowRight, RefreshCw, RotateCcw, 
    Mic, MicOff, Search, Compass, ShieldCheck, ChevronRight, Copy, Check,
    Ship, Plane, Truck, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const QUICK_CARDS = [
    { id: 1, title: "Find Best Freight Forwarder", desc: "Origin, destination & mode based top partner suggestion", prompt: "Best freight forwarder kaise find karein?" },
    { id: 2, title: "Compare Freight Rates", desc: "Live comparison across Sea FCL, LCL & Air lines", prompt: "Compare freight rates from India to China" },
    { id: 3, title: "Find Verified Vendor", desc: "Verified forwarders and logistics companies near you", prompt: "Verified freight forwarder near me" },
    { id: 4, title: "Find Vendor by City", desc: "Search top vendors in Delhi, Mumbai, Mundra etc.", prompt: "Best freight forwarder in Delhi" },
    { id: 5, title: "Find Vendor by Country", desc: "Forwarders active in China, UAE, USA & Europe", prompt: "Best freight forwarder in China" },
    { id: 6, title: "Search Shipping Route", desc: "Best sea/air routes, transit days & port advice", prompt: "Best route from China to India" },
    { id: 7, title: "Get Freight Quote", desc: "Direct quotation request form for custom cargo", prompt: "I need a freight quote" },
    { id: 8, title: "Top 10 Logistics Companies", desc: "Ranked verified forwarders list on Logistics Scanner", prompt: "Top 10 freight forwarders in India" }
];

// Rich Formatter for Strong & Clear Typography
const FormattedMessage = ({ content }) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
        <div className="space-y-3 text-slate-800 leading-relaxed font-normal">
            {lines.map((rawLine, idx) => {
                const line = rawLine.trim();
                if (!line) return <div key={idx} className="h-1" />;

                // Main Section Headers ### Heading or #### Heading
                const isHeading3 = line.startsWith('###');
                const isHeading4 = line.startsWith('####');

                if (isHeading3 || isHeading4) {
                    const headingClean = line.replace(/^#{3,4}\s*/, '').replace(/\*\*/g, '');
                    return (
                        <div key={idx} className="pt-3 pb-1 border-b border-slate-200/80">
                            <h4 className="font-black text-[15px] text-slate-950 tracking-tight flex items-center gap-2">
                                <span className="w-2 h-4 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full inline-block"></span>
                                {headingClean}
                            </h4>
                        </div>
                    );
                }

                // Bullet point line
                const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
                const isNumbered = /^\d+\.\s/.test(line);

                // Parse bold parts: **text**
                const parts = line.split(/(\*\*.*?\*\*)/g);

                const renderedParts = parts.map((part, pIdx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const boldText = part.slice(2, -2);
                        return (
                            <strong 
                                key={pIdx} 
                                className="font-extrabold text-slate-950 bg-blue-50/90 text-blue-950 px-1.5 py-0.5 rounded mx-0.5 border border-blue-200/60 inline-block shadow-2xs"
                            >
                                {boldText}
                            </strong>
                        );
                    }
                    return <span key={pIdx}>{part}</span>;
                });

                if (isBullet || isNumbered) {
                    return (
                        <div key={idx} className="flex items-start gap-2.5 pl-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></span>
                            <div className="flex-1 text-[13.5px] text-slate-800 font-medium">
                                {renderedParts}
                            </div>
                        </div>
                    );
                }

                return (
                    <p key={idx} className="text-[13.5px] text-slate-800 font-medium">
                        {renderedParts}
                    </p>
                );
            })}
        </div>
    );
};

// Inline Freight Inquiry Card embedded directly into the chat
const InlineQuoteBox = ({ defaultFrom = 'Mumbai', defaultTo = 'China', defaultMode = 'sea' }) => {
    const [fromLoc, setFromLoc] = useState(defaultFrom);
    const [toLoc, setToLoc] = useState(defaultTo);
    const [shipMode, setShipMode] = useState(defaultMode || 'sea');
    const [commodity, setCommodity] = useState('');
    const [weight, setWeight] = useState('');
    const [containerType, setContainerType] = useState('20ft Container');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('userToken');
            const payload = {
                fromLocation: fromLoc,
                toLocation: toLoc,
                type: shipMode,
                category: 'international',
                commodity: commodity || 'General Cargo',
                message: `Direct Inquiry from AI Chat | Mode: ${shipMode.toUpperCase()} | Load: ${containerType} | Weight/CBM: ${weight || 'N/A'}`
            };
            await api.post('/enquiries', payload);
            setDone(true);
        } catch (err) {
            console.error(err);
            setDone(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex items-center gap-3.5 shadow-sm">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div>
                    <h5 className="font-extrabold text-sm text-emerald-950">Quotation Request Successfully Registered!</h5>
                    <p className="text-xs text-emerald-800 mt-1 font-semibold">
                        Logistics Scanner verified vendors active for <strong className="text-emerald-950">{fromLoc} → {toLoc}</strong> will review your cargo details and submit customized rates shortly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 border-2 border-blue-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                        <DollarSign className="w-4 h-4" />
                    </span>
                    <div>
                        <h5 className="font-black text-sm text-slate-900">
                            Request Live Quotes from Verified Portal Vendors
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Fill your cargo specs below to get instant quotes directly inside Logistics Scanner
                        </p>
                    </div>
                </div>
                <span className="text-[11px] uppercase font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                    {shipMode} Freight
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Origin Port / City</label>
                        <input
                            type="text"
                            required
                            value={fromLoc}
                            onChange={(e) => setFromLoc(e.target.value)}
                            placeholder="e.g. Mumbai, Nhava Sheva"
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination Port / City</label>
                        <input
                            type="text"
                            required
                            value={toLoc}
                            onChange={(e) => setToLoc(e.target.value)}
                            placeholder="e.g. Shanghai, Jebel Ali, USA"
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Commodity / Goods</label>
                        <input
                            type="text"
                            required
                            value={commodity}
                            onChange={(e) => setCommodity(e.target.value)}
                            placeholder="e.g. Textiles, Machinery, Chemicals"
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Weight / CBM / Volume</label>
                        <input
                            type="text"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="e.g. 500 kg / 4 CBM"
                            className="w-full text-xs font-bold px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Container / Load Type</label>
                        <select
                            value={containerType}
                            onChange={(e) => setContainerType(e.target.value)}
                            className="w-full text-xs font-bold px-3 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                        >
                            <option value="20ft Container">20ft Standard Container</option>
                            <option value="40ft Container">40ft High Cube Container</option>
                            <option value="LCL Loose Cargo">LCL (Loose Cargo / Shared)</option>
                            <option value="Air Cargo Box">Air Cargo Standard Box</option>
                            <option value="Road Full Truck">FTL (Full Truck Load)</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit & Request Live Rates from Portal Vendors</span>
                </button>
            </form>
        </div>
    );
};

const VendorAIChatTab = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Speech-to-text setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'hi-IN';

            rec.onresult = (e) => {
                const text = e.results[0][0].transcript;
                if (text) {
                    setInput(text);
                    handleSend(text);
                }
                setIsListening(false);
            };
            rec.onerror = () => setIsListening(false);
            rec.onend = () => setIsListening(false);
            recognitionRef.current = rec;
        }
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) {
            alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const handleSend = async (queryText) => {
        const text = (queryText || input).trim();
        if (!text || loading) return;

        const newMessages = [...messages, { sender: 'user', text }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chatbot/query', {
                message: text
            });

            if (res.data?.success) {
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: res.data.reply,
                        routeInfo: res.data.routeInfo || null,
                        showQuoteForm: res.data.showQuoteForm || false,
                        vendors: res.data.vendors || [],
                        rates: res.data.rates || []
                    }
                ]);
            } else {
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: "Sorry, could not process the response. Please try again."
                    }
                ]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages([
                ...newMessages,
                {
                    sender: 'bot',
                    text: "Connection error. Make sure the backend server is running."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([]);
        setInput('');
    };

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Logistics AI Assistant</h2>
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full flex items-center gap-1.5 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Portal Database & AI Active
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Instant Freight Quotes, Verified Forwarders, Port Navigation & Customs</p>
                    </div>
                </div>

                {messages.length > 0 && (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
                        title="New Chat"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Chat
                    </button>
                )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
                {/* Initial View: 8 Quick Prompt Cards */}
                {messages.length === 0 && (
                    <div className="max-w-4xl mx-auto py-6 space-y-6">
                        <div className="text-center space-y-2.5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                Smart Logistics AI
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                Find the Best Freight Forwarders & Live Shipping Rates
                            </h3>
                            <p className="text-sm text-slate-600 max-w-lg mx-auto font-medium">
                                Choose one of the quick options below or type your freight requirement in English or Hindi.
                            </p>
                        </div>

                        {/* 8 Clickable Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {QUICK_CARDS.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleSend(card.prompt)}
                                    className="p-4 bg-white hover:bg-blue-50/40 rounded-2xl border border-slate-200/90 hover:border-blue-500 text-left transition-all duration-200 shadow-sm hover:shadow-md group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                                            {card.id}
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                            {card.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1.5 font-medium line-clamp-2">
                                            {card.desc}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center text-xs font-bold text-blue-600 gap-1">
                                        Ask AI <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Conversation Messages */}
                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3.5 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                        <div
                            className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black shadow-sm ${
                                m.sender === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-blue-500/20'
                            }`}
                        >
                            {m.sender === 'user' ? 'YOU' : <Bot className="w-5 h-5" />}
                        </div>

                        <div className="space-y-4 flex-1">
                            {/* Message Bubble */}
                            <div
                                className={`p-5 rounded-2xl shadow-sm relative group border ${
                                    m.sender === 'user'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none border-blue-700 font-medium'
                                        : 'bg-white border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs'
                                }`}
                            >
                                {m.sender === 'user' ? (
                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-semibold">{m.text}</p>
                                ) : (
                                    <>
                                        <FormattedMessage content={m.text} />
                                        {/* Copy button */}
                                        <button
                                            onClick={() => handleCopy(m.text, idx)}
                                            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy response"
                                        >
                                            {copiedIdx === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* INLINE QUOTATION FORM: Inquire inside chat */}
                            {(m.routeInfo || m.showQuoteForm) && (
                                <InlineQuoteBox
                                    defaultFrom={m.routeInfo?.from || 'Mumbai'}
                                    defaultTo={m.routeInfo?.to || 'China'}
                                    defaultMode={m.routeInfo?.mode || 'sea'}
                                />
                            )}

                            {/* Verified Forwarders on Logistics Scanner */}
                            {m.vendors && m.vendors.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between px-1">
                                        <h5 className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                            Logistics Scanner Verified Portal Vendors
                                        </h5>
                                        <span className="text-[11px] font-bold text-slate-500">{m.vendors.length} Vendors Listed</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {m.vendors.map((v, vIdx) => (
                                            <div
                                                key={v._id || vIdx}
                                                className="bg-white border-2 border-slate-200/90 hover:border-blue-500 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h5 className="font-black text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                                                                {v.company || v.name}
                                                            </h5>
                                                            {v.isVerified && (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                                            {v.city ? `${v.city}, ` : ''}{v.country || 'India'}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to={`/vendor-network/profile/${v._id}`}
                                                        target="_blank"
                                                        className="text-[11px] font-extrabold text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-200 transition-all shadow-2xs whitespace-nowrap"
                                                    >
                                                        View Profile
                                                    </Link>
                                                </div>

                                                {v.services && v.services.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {v.services.slice(0, 3).map((s, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Published Rates */}
                            {m.rates && m.rates.length > 0 && (
                                <div className="space-y-2 pt-1">
                                    <h5 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider px-1">
                                        Published Direct Rates
                                    </h5>
                                    <div className="space-y-2.5">
                                        {m.rates.map((r, rIdx) => (
                                            <div
                                                key={r._id || rIdx}
                                                className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="text-xs font-black text-slate-900 capitalize tracking-tight">
                                                        {r.fromLocation} → {r.toLocation}
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg uppercase mt-1 inline-block border border-blue-200">
                                                        {r.type} • {r.vendor?.company || 'Verified Vendor'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base font-black text-emerald-600">
                                                        ₹{r.price?.toLocaleString()}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 font-bold">
                                                        {r.seaLoadType || r.truckLoad || 'Standard Rate'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2.5 text-slate-700 text-xs font-bold bg-white border border-slate-200 p-4 rounded-2xl max-w-sm shadow-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        Fetching verified vendors & rate breakdown...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-white border-t border-slate-200 p-4 shadow-sm">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2.5"
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening... bolna shuru kijiye..." : "Ask freight question (e.g. best rate mumbai to china mode sea, Top 10 forwarders)..."}
                            className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-sm font-semibold px-4 py-3.5 rounded-xl border transition-all outline-none ${
                                isListening 
                                    ? 'border-red-500 ring-3 ring-red-500/20 bg-red-50/20' 
                                    : 'border-slate-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
                            }`}
                        />
                    </div>

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={toggleVoice}
                        className={`p-3.5 rounded-xl border transition-all ${
                            isListening 
                                ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                        title={isListening ? "Stop Voice" : "Voice Input (Hindi/English)"}
                    >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <span>Send</span>
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VendorAIChatTab;
