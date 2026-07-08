import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, ChevronDown, ChevronUp, Package, Globe, Truck, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import useSEO from '../../hooks/useSEO';

const Contact = () => {
    useSEO({
        title: 'Contact Logistics Scanner | Customer Support & Inquiries',
        description: 'Get in touch with Logistics Scanner. Our customer support team is here to help with your freight rate comparisons and logistics vendor queries.',
        keywords: 'logistics scanner, freight rate comparison, shipping rates online, logistics platform India, freight forwarding services'
    });

    const [userType, setUserType] = useState('Client');
    const [topic, setTopic] = useState('');
    const [name, setName] = useState('');
    const [organization, setOrganization] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [openFaq, setOpenFaq] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/contact', {
                userType,
                topic,
                name,
                organization,
                email,
                message
            });
            setSuccess('Your message has been sent successfully. We will get back to you soon.');
            setTopic('');
            setName('');
            setOrganization('');
            setEmail('');
            setMessage('');
            setUserType('Client');
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
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
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
            {/* Header Section */}
            <div className="bg-white pt-24 pb-16 md:pt-32 md:pb-24 px-6 border-b border-slate-200">
                <div className="container mx-auto max-w-5xl text-center">
                    <span className="text-blue-600 font-bold uppercase tracking-[0.2em] text-sm mb-4 block">
                        Get In Touch
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
                        How Can We <span className="text-blue-600">Help?</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        We're here to help and answer any question you might have. We look forward to hearing from you.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    {/* Left Column: Form */}
                    <div className="flex-1 bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Please provide the information below:</h2>
                        
                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
                                <CheckCircle className="text-green-500 shrink-0" size={20} />
                                <span className="font-medium text-sm">{success}</span>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                <span className="font-medium text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* User Type Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">I am a...</label>
                                <div className="flex flex-wrap gap-4">
                                    {['Vendor', 'Client', 'Other'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setUserType(type)}
                                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all border-2 ${
                                                userType === type 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                                            }`}
                                        >
                                            I am {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Topic Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">How Can We Help You? *</label>
                                <div className="relative">
                                    <select 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        required
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium cursor-pointer"
                                    >
                                        <option value="" disabled>Select an option</option>
                                        <option value="start">Start Shipping with Logistics Scanner</option>
                                        <option value="quote">Request a Quote (existing clients)</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">First & Last Name *</label>
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Enter your name" 
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Organization Name *</label>
                                    <input 
                                        type="text" 
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        required
                                        placeholder="Enter your organization name" 
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Email *</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email" 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Your Message</label>
                                <textarea 
                                    rows="4" 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="How can we help you?" 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium resize-none"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20 hover:shadow-blue-600/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Contact Details & FAQs */}
                    <div className="lg:w-1/3 space-y-8">
                        {/* Contact Info Card */}
                        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                            
                            <h3 className="text-2xl font-bold mb-8 relative z-10">Contact Information</h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Our Branch</h4>
                                        <p className="text-slate-300 text-sm font-bold mb-1">BNB Worldwide Pvt. Ltd.</p>
                                        <p className="text-slate-300 text-sm leading-relaxed">210/2, S/F, Commercial Flats, District Centre, Janakpuri, New Delhi, Delhi, India, 110058</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <Phone size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Call Us</h4>
                                        <p className="text-slate-300 text-sm">+91 92663 35550</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <Mail size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white mb-1">Email Us</h4>
                                        <p className="text-slate-300 text-sm">info@logisticdekho.com</p>
                                    </div>
                                </div>
                            </div>
                            
                            <a
                                href="https://wa.me/919266335550"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#25D366]/20"
                            >
                                <MessageCircle size={20} />
                                Chat on WhatsApp
                            </a>
                        </div>

                        {/* FAQs Sidebar Style */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                            <h3 className="text-xl font-bold text-slate-900 mb-6">Common Questions</h3>
                            <div className="space-y-4">
                                {faqs.slice(0, 4).map((faq, index) => (
                                    <div key={index} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full flex items-start justify-between text-left group focus:outline-none gap-4"
                                        >
                                            <span className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{faq.question}</span>
                                            {openFaq === index
                                                ? <ChevronUp className="text-blue-600 shrink-0 mt-0.5" size={16} />
                                                : <ChevronDown className="text-slate-400 shrink-0 mt-0.5 group-hover:text-blue-600 transition-colors" size={16} />}
                                        </button>
                                        {openFaq === index && (
                                            <div className="text-slate-600 text-sm pt-3 leading-relaxed">
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
            
        </div>
    );
};

export default Contact;
