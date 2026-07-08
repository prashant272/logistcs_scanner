import React, { useState } from 'react';
import { HelpCircle, User, Building, Mail, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import useSEO from '../../hooks/useSEO';

const Support = () => {
    useSEO({
        title: 'Help & Support | Logistics Scanner Help Center',
        description: 'Need help? Visit the Logistics Scanner Support Center for FAQs, guides, and assistance with your freight shipping and vendor management.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    const [userType, setUserType] = useState('');
    const [helpType, setHelpType] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, send data to server
        setTimeout(() => {
            setSubmitted(true);
        }, 800);
    };

    if (submitted) {
        return (
            <div className="bg-slate-50 min-h-screen pt-32 pb-20 font-sans flex items-center justify-center px-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg w-full shadow-2xl shadow-slate-200/50">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-50 text-green-500 mb-8 shadow-inner">
                        <CheckCircle size={48} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-display font-black text-[#0B1E43] mb-4 uppercase tracking-tight">Request Received</h2>
                    <p className="text-slate-600 leading-relaxed text-sm mb-8">
                        Thank you for reaching out! Our support team has received your request and will get back to you within <span className="font-bold text-[#0B1E43]">24-48 hours</span>.
                    </p>
                    <button 
                        onClick={() => { setSubmitted(false); setFormData({name: '', organization: '', email: '', message: ''}); setUserType(''); setHelpType(''); }}
                        className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-black uppercase tracking-widest text-sm py-4 px-8 rounded-xl transition-all transform hover:-translate-y-1 shadow-lg shadow-[#0066FF]/20"
                    >
                        Submit Another Request
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-20 font-sans">
            <div className="container mx-auto px-6 max-w-3xl">
                {/* Header */}
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex p-3 bg-[#0066FF]/10 rounded-2xl text-[#0066FF] mb-4 shadow-sm">
                        <HelpCircle size={36} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-[#0B1E43] mb-2 uppercase">
                        How Can We <span className="text-[#0066FF]">Help?</span>
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto">
                        Whether you are a vendor, client, or someone exploring opportunities, let us know how we can assist you.
                    </p>
                </div>

                {/* Support Form Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none"></div>

                    <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                        {/* 1. Identity Selection */}
                        <div className="space-y-4">
                            <label className="text-slate-400 text-xs font-black uppercase tracking-[0.15em] block text-center mb-6">
                                I am a...
                            </label>
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {['Vendor', 'Client', 'Other'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setUserType(type)}
                                        className={`py-4 px-2 rounded-2xl text-xs md:text-sm font-bold tracking-wider transition-all duration-300 border ${
                                            userType === type 
                                                ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-lg shadow-[#0066FF]/20 transform scale-[1.02]' 
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#0066FF]/30 hover:text-[#0066FF] hover:bg-blue-50/50'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* 2. Help Request Type */}
                        <div className="space-y-5">
                            <label className="text-[#0B1E43] text-base font-bold flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <span>Please provide the information below <span className="text-red-500">*</span></span>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block w-fit">Required</span>
                            </label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-2">
                                {[
                                    { id: 'start', label: 'Start Shipping with Logistics Scanner' },
                                    { id: 'quote', label: 'Request a Quote (existing clients)' },
                                    { id: 'other_help', label: 'Other Support Inquiry' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setHelpType(item.id)}
                                        className={`py-5 px-5 rounded-2xl text-[11px] md:text-xs font-bold leading-relaxed text-left transition-all duration-300 border flex items-center shadow-sm ${
                                            helpType === item.id 
                                                ? 'bg-[#0066FF]/5 text-[#0066FF] border-[#0066FF]/30' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-[#0066FF]/30 hover:bg-blue-50/30 hover:text-[#0066FF]'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 mr-3 flex items-center justify-center transition-colors ${helpType === item.id ? 'border-[#0066FF] bg-white' : 'border-slate-300 bg-transparent'}`}>
                                            {helpType === item.id && <div className="w-2 h-2 rounded-full bg-[#0066FF]"></div>}
                                        </div>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Details Fields */}
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block ml-1">
                                        First & Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User size={18} className="text-slate-400 group-focus-within:text-[#0066FF] transition-colors" />
                                        </div>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 text-sm font-medium focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" 
                                            placeholder="Enter your name" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block ml-1">
                                        Organization Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Building size={18} className="text-slate-400 group-focus-within:text-[#0066FF] transition-colors" />
                                        </div>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.organization}
                                            onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 text-sm font-medium focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" 
                                            placeholder="Enter your organization name" 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block ml-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-slate-400 group-focus-within:text-[#0066FF] transition-colors" />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 text-sm font-medium focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" 
                                        placeholder="Enter your email" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-wider block ml-1">
                                    How Can We Help You?
                                </label>
                                <div className="relative group">
                                    <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                                        <MessageSquare size={18} className="text-slate-400 group-focus-within:text-[#0066FF] transition-colors" />
                                    </div>
                                    <textarea 
                                        rows="4" 
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 text-sm font-medium focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal resize-none" 
                                        placeholder="Your message (optional)" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button 
                                type="submit"
                                disabled={!userType || !helpType || !formData.name || !formData.organization || !formData.email}
                                className="w-full py-5 bg-[#0066FF] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#0052cc] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shadow-xl shadow-[#0066FF]/25"
                            >
                                Submit Request <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Support;
