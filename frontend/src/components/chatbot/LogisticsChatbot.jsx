import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Send, Bot, Building2, MapPin, 
    CheckCircle2, DollarSign, ArrowRight, RefreshCw, Phone, Globe, Sparkles,
    Mic, MicOff, RotateCcw, Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const QUICK_BUTTONS = [
    { id: 1, label: "Find Best Freight Forwarder", prompt: "Best freight forwarder kaise find karein?" },
    { id: 2, label: "Compare Freight Rates", prompt: "Compare freight rates from India to China" },
    { id: 3, label: "Find Verified Vendor", prompt: "Verified freight forwarder near me" },
    { id: 4, label: "Find Vendor by City", prompt: "Best freight forwarder in Delhi" },
    { id: 5, label: "Find Vendor by Country", prompt: "Best freight forwarder in China" },
    { id: 6, label: "Search Shipping Route", prompt: "Best route from China to India" },
    { id: 7, label: "Get Freight Quote", prompt: "I need a freight quote" },
    { id: 8, label: "Find Top 10 Logistics Companies", prompt: "Top 10 freight forwarders in India" }
];

const INITIAL_GREETING = {
    sender: 'bot',
    text: "Namaste! 🙏 Welcome to Logistics Scanner AI Assistant.\nAsk anything about Freight Forwarders, Shipping Rates, CHA / Customs Clearance, Port suggestions, or Container Bookings in ANY language (Hindi, English, Hinglish, Chinese, etc.)!",
    quickOptions: QUICK_BUTTONS.map(b => b.label)
};

const LogisticsChatbot = ({ defaultOpen = false, placementClass = "fixed bottom-8 right-8 z-50" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([INITIAL_GREETING]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Initialize Web Speech API for voice search
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'hi-IN'; // Default Hindi/Hinglish, also understands English

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setInput(transcript);
                    handleSendMessage(transcript);
                }
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSendMessage = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        // Add user query
        const newMessages = [...messages, { sender: 'user', text: query }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chatbot/query', {
                message: query
            });

            if (res.data?.success) {
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: res.data.reply,
                        actionType: res.data.actionType,
                        vendors: res.data.vendors || [],
                        rates: res.data.rates || [],
                        quickOptions: res.data.quickOptions || []
                    }
                ]);
            } else {
                setMessages([
                    ...newMessages,
                    {
                        sender: 'bot',
                        text: "Maaf kijiye, abhi response process karne me dikkat aa rahi hai. Kripya thodi der baad try karein."
                    }
                ]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages([
                ...newMessages,
                {
                    sender: 'bot',
                    text: "Connection error. Please verify backend server is running."
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleResetChat = () => {
        setMessages([INITIAL_GREETING]);
        setInput('');
    };

    const handleQuickAction = (btn) => {
        handleSendMessage(btn.prompt);
    };

    return (
        <div className={placementClass}>
            {/* Floating Launcher Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all duration-300 group border border-white/20"
                    aria-label="Open AI Assistant"
                >
                    <Bot className="w-7 h-7 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                    </span>

                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl border border-slate-700">
                        Ask Logistics AI ⚡
                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 transform rotate-45 border-r border-t border-slate-700"></div>
                    </div>
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div className="w-[360px] sm:w-[420px] h-[610px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-md">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 p-3.5 text-white flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                                    Logistics AI
                                    <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500 rounded-full font-medium">Online</span>
                                </h3>
                                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" /> All Languages • Rates & Vendors
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Reset Chat Button */}
                            <button
                                onClick={handleResetChat}
                                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Reset Conversation"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Close Chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick 8 Action Chips Header */}
                    <div className="bg-slate-800/80 border-b border-slate-700 p-2 overflow-x-auto no-scrollbar flex gap-1.5">
                        {QUICK_BUTTONS.slice(0, 4).map((b) => (
                            <button
                                key={b.id}
                                onClick={() => handleQuickAction(b)}
                                className="whitespace-nowrap px-2.5 py-1 text-xs bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg border border-slate-600 transition-all font-medium"
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-sm">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md ${
                                        m.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                                </div>

                                {/* Render Database Vendors */}
                                {m.vendors && m.vendors.length > 0 && (
                                    <div className="mt-2.5 w-full space-y-2">
                                        {m.vendors.map((v, vIdx) => (
                                            <div
                                                key={v._id || vIdx}
                                                className="bg-slate-800/90 border border-slate-700 hover:border-blue-500 rounded-xl p-3 transition-all duration-200 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="font-semibold text-white text-xs">
                                                                {v.company || v.name}
                                                            </h4>
                                                            {v.isVerified && (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin className="w-3 h-3 text-cyan-400" />
                                                            {v.city ? `${v.city}, ` : ''}{v.country || 'India'}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        to={`/vendor-network/profile/${v._id}`}
                                                        className="text-[11px] bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-md border border-blue-500/30 transition-all font-medium"
                                                    >
                                                        Profile
                                                    </Link>
                                                </div>

                                                {v.services && v.services.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {v.services.slice(0, 3).map((s, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Render Database Rates */}
                                {m.rates && m.rates.length > 0 && (
                                    <div className="mt-2.5 w-full space-y-2">
                                        {m.rates.map((r, rIdx) => (
                                            <div
                                                key={r._id || rIdx}
                                                className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 shadow-sm flex items-center justify-between"
                                            >
                                                <div>
                                                    <div className="text-xs font-bold text-white capitalize">
                                                        {r.fromLocation} → {r.toLocation}
                                                    </div>
                                                    <span className="text-[10px] uppercase font-semibold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
                                                        {r.type} • {r.vendor?.company || 'Verified Vendor'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-extrabold text-emerald-400">
                                                        ₹{r.price?.toLocaleString()}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">
                                                        {r.seaLoadType || r.truckLoad || 'Std Rate'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Action CTA (Quote prompt) */}
                                {m.actionType === 'quote_prompt' && (
                                    <div className="mt-2 w-full">
                                        <Link
                                            to="/search-results"
                                            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-medium hover:opacity-95 shadow-md"
                                        >
                                            Request Custom Quote
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                )}

                                {/* Quick options */}
                                {m.quickOptions && m.quickOptions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {m.quickOptions.map((opt, oIdx) => (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleSendMessage(opt)}
                                                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-full px-2.5 py-1 transition-colors"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                Searching Database & Consulting AI...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 8 Quick Action Buttons */}
                    <div className="bg-slate-800/90 border-t border-slate-700 p-2">
                        <div className="grid grid-cols-2 gap-1.5">
                            {QUICK_BUTTONS.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => handleQuickAction(b)}
                                    className="text-left text-[11px] text-slate-300 hover:text-white bg-slate-900/60 hover:bg-blue-600/40 p-1.5 rounded-lg border border-slate-700/60 transition-colors truncate"
                                    title={b.label}
                                >
                                    ⚡ {b.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Input with Voice Input (Mic) */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening... bolna shuru kijiye..." : "Type or speak in Hindi/English..."}
                            className={`flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-xl border transition-all ${
                                isListening ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-700 focus:border-blue-500'
                            }`}
                        />
                        {/* Voice Mic Button */}
                        <button
                            type="button"
                            onClick={toggleVoiceInput}
                            className={`p-2.5 rounded-xl transition-all ${
                                isListening 
                                    ? 'bg-red-500 text-white animate-pulse' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            }`}
                            title={isListening ? "Stop Listening" : "Speak (Hindi/English Voice Input)"}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-md"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LogisticsChatbot;
