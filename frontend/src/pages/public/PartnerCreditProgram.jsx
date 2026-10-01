import React, { useState } from 'react';
import { ArrowRight, Play, CheckCircle2, Globe2, ShieldCheck, CreditCard, Users, FileText, ChevronDown, CheckCircle, Clock, Plane, Ship, Truck, Warehouse, Box, Check, CalendarRange, RefreshCw, BarChart2, TrendingUp, Search, FileSignature, Wallet, BadgeCheck, AlertCircle, Handshake, Network, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const PartnerCreditProgram = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Modal Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organization: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/contact', {
                userType: 'Vendor',
                topic: 'Credit Partner Application',
                name: formData.name,
                organization: formData.organization,
                email: formData.email,
                message: `Phone: ${formData.phone}\n\n${formData.message}`
            });
            setSuccess('Your application has been submitted successfully. We will get back to you soon.');
            setFormData({ name: '', email: '', organization: '', phone: '', message: '' });
            setTimeout(() => {
                setIsModalOpen(false);
                setSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const faqs = [
        { question: "What is the LogisticsScanner Partner Credit Program?", answer: "The Partner Credit Program is designed to give eligible international customers flexible payment terms while ensuring logistics partners get paid securely and on time for approved transactions." },
        { question: "Who can join this program?", answer: "Freight forwarders, NVOCCs, shipping companies, and other verified logistics service providers can apply to join the credit program." },
        { question: "Does this mean I don't have to follow up with customers for payment?", answer: "Yes, LogisticsScanner supports the customer collection and payment process for approved transactions, allowing you to focus on operations." },
        { question: "Is payment guaranteed for every transaction?", answer: "Payment assurance is not an unconditional guarantee. It is subject to credit limit, verification, valid invoices, and agreed commercial terms." },
        { question: "What documents are required for payment?", answer: "You will need to submit a valid invoice, proof of delivery or Bill of Lading, and any other documentation agreed upon in the commercial terms." },
        { question: "How long is the credit period?", answer: "Eligible customers may receive credit terms of up to 30 days based on their approved criteria." },
        { question: "Are there any fees to join the program?", answer: "Please contact our support team to discuss any applicable fees or revenue-sharing models for the credit program." },
        { question: "How can I apply to become a credit partner?", answer: "You can click on the 'Become a Credit Partner' button on this page to submit your application, and our team will get back to you shortly." }
    ];

    return (
        <div className="font-sans text-slate-800 bg-white">
            {/* HERO SECTION */}
            <div className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-white flex items-center min-h-[600px]">
                <div className="absolute inset-0 z-0">
                    <img src="/hero-credit-bg.png" alt="Logistics Background" className="w-full h-full object-cover object-[center_right]" />
                    {/* Gradient fade from left (white) to right (transparent) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent w-full md:w-[75%] lg:w-[65%]"></div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-8">
                            <p className="text-[#0066FF] font-black tracking-wider text-sm mb-3 uppercase">PARTNER CREDIT PROGRAM</p>
                            <h1 className="text-4xl md:text-5xl lg:text-[54px] xl:text-[60px] font-black text-[#0B1E43] leading-[1.1] mb-5">
                                Offer Credit.<br />
                                Win More International<br />
                                Business.<br />
                                <span className="text-[#0066FF]">Grow With Confidence.</span>
                            </h1>
                            <p className="text-base lg:text-lg text-slate-600 mb-8 font-medium max-w-xl leading-relaxed">
                                Give eligible international customers flexible payment terms while you focus on delivering exceptional logistics.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <button onClick={() => setIsModalOpen(true)} className="bg-[#0066FF] hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold text-base lg:text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/30">
                                    Become a Credit Partner <ArrowRight size={20} />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs lg:text-sm font-bold text-[#0B1E43]">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0066FF] text-white rounded-full p-0.5"><Check size={14} strokeWidth={4} /></div>
                                    <span>Up to 30-day credit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0066FF] text-white rounded-full p-0.5"><Check size={14} strokeWidth={4} /></div>
                                    <span>International customer opportunities</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#0066FF] text-white rounded-full p-0.5"><Check size={14} strokeWidth={4} /></div>
                                    <span>Structured payment support</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 relative flex justify-end w-full lg:pr-8 xl:pr-16" style={{ perspective: '1200px' }}>
                            {/* Glassmorphism Card */}
                            <div 
                                className="bg-[#0B1E43]/40 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl w-full max-w-[300px] lg:max-w-[320px] mx-auto lg:mr-0 text-white relative z-20"
                                style={{ transform: 'rotateY(-12deg) rotateX(4deg) translateZ(0)', transformStyle: 'preserve-3d' }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="border border-white/30 p-2.5 rounded-xl bg-white/10 shadow-sm" style={{ transform: 'translateZ(20px)' }}>
                                        {/* Use Calendar icon to match the design */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                                    </div>
                                    <div style={{ transform: 'translateZ(20px)' }}>
                                        <h3 className="font-black text-2xl lg:text-[26px] leading-tight">30 Days<br/><span className="text-base lg:text-lg font-bold">Credit</span></h3>
                                    </div>
                                </div>
                                <div className="space-y-3" style={{ transform: 'translateZ(20px)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 rounded-full p-1 text-white shadow-sm"><Check size={14} strokeWidth={4} /></div>
                                        <span className="font-bold text-[13px] lg:text-[14px]">Approved Customers</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 rounded-full p-1 text-white shadow-sm"><Check size={14} strokeWidth={4} /></div>
                                        <span className="font-bold text-[13px] lg:text-[14px]">Secure Transactions</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-500 rounded-full p-1 text-white shadow-sm"><Check size={14} strokeWidth={4} /></div>
                                        <span className="font-bold text-[13px] lg:text-[14px]">On-time Payment</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VALUE PROPS STRIP */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 -mt-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white px-6 py-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex items-center gap-4">
                        <div className="bg-[#EBF2FF] text-[#0066FF] w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl">
                            {/* Calendar/Check Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                        </div>
                        <div>
                            <h4 className="font-black text-[#0B1E43] text-[15px] mb-0.5 tracking-wide uppercase">30 DAYS</h4>
                            <p className="text-[13px] font-semibold text-slate-500 leading-snug">Up to approved<br/>customer credit</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex items-center gap-4">
                        <div className="bg-[#EBF2FF] text-[#0066FF] w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl">
                            <Globe2 size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="font-black text-[#0B1E43] text-[15px] mb-0.5 tracking-wide uppercase">GLOBAL</h4>
                            <p className="text-[13px] font-semibold text-slate-500 leading-snug">International<br/>customer opportunities</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex items-center gap-4">
                        <div className="bg-[#EBF2FF] text-[#0066FF] w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl">
                            <ShieldCheck size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="font-black text-[#0B1E43] text-[15px] mb-0.5 tracking-wide uppercase">STRUCTURED</h4>
                            <p className="text-[13px] font-semibold text-slate-500 leading-snug">Verified transaction<br/>workflow</p>
                        </div>
                    </div>
                    <div className="bg-white px-6 py-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex items-center gap-4">
                        <div className="bg-[#EBF2FF] text-[#0066FF] w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl">
                            <CreditCard size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="font-black text-[#0B1E43] text-[15px] mb-0.5 tracking-wide uppercase">SUPPORTED</h4>
                            <p className="text-[13px] font-semibold text-slate-500 leading-snug">Payment & collection<br/>support</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPERTISE SECTION */}
            <div className="relative pt-8 pb-12 overflow-hidden bg-white">
                {/* Subtle map background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="max-w-xl">
                            <p className="text-[#0066FF] font-black tracking-wider text-sm mb-4 uppercase">YOUR LOGISTICS EXPERTISE. OUR CREDIT SUPPORT.</p>
                            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black text-[#0B1E43] leading-[1.15] mb-6">
                                International customers often look for flexible payment terms before choosing a logistics partner.
                            </h2>
                            <p className="text-slate-600 font-medium text-[15px] leading-relaxed">
                                With the LogisticsScanner Partner Credit Program, eligible partners can offer customers a structured credit option while LogisticsScanner supports the customer collection and payment process for approved transactions.
                            </p>
                        </div>
                        
                        <div className="relative w-full h-[400px] flex items-center justify-center">
                            {/* Workflow Container */}
                            <div className="relative w-[500px] h-[300px]">
                                {/* Connecting SVG Arrows */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                                    {/* Customer -> Credit Approval */}
                                    <path d="M 120 75 L 210 75" fill="none" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4,4" />
                                    <polygon points="210,75 204,71 204,79" fill="#93C5FD" />
                                    
                                    {/* Credit Approval -> Provide Service */}
                                    <path d="M 290 75 L 380 75" fill="none" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4,4" />
                                    <polygon points="380,75 374,71 374,79" fill="#93C5FD" />

                                    {/* Customer -> Submit Invoice (Curvy) */}
                                    <path d="M 60 115 C 60 170, 110 225, 210 225" fill="none" stroke="#93C5FD" strokeWidth="2" />
                                    <polygon points="210,225 204,221 204,229" fill="#93C5FD" />

                                    {/* Provide Service -> Receive Payment */}
                                    <path d="M 440 115 L 440 175" fill="none" stroke="#93C5FD" strokeWidth="2" />
                                    <polygon points="440,175 436,169 444,169" fill="#93C5FD" />

                                    {/* Submit Invoice -> Receive Payment */}
                                    <path d="M 290 225 L 380 225" fill="none" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4,4" />
                                    <polygon points="380,225 374,221 374,229" fill="#93C5FD" />
                                </svg>

                                {/* 1. Customer Opportunity */}
                                <div className="absolute top-0 left-0 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center w-[120px] h-[115px] z-10 transition-transform hover:scale-105">
                                    <Users size={32} strokeWidth={2.5} className="text-[#0066FF] mb-3" />
                                    <span className="font-bold text-[11px] text-[#0B1E43] text-center leading-tight">Customer<br/>Opportunity</span>
                                </div>

                                {/* 2. Credit Approval */}
                                <div className="absolute top-0 left-[170px] bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center w-[120px] h-[115px] z-10 transition-transform hover:scale-105">
                                    <div className="relative mb-3">
                                        <FileText size={32} strokeWidth={2.5} className="text-[#0066FF]" />
                                        <ShieldCheck size={16} strokeWidth={3} className="text-emerald-500 absolute -bottom-1 -right-2 bg-white rounded-full" />
                                    </div>
                                    <span className="font-bold text-[11px] text-[#0B1E43] text-center leading-tight">Credit<br/>Approval</span>
                                </div>

                                {/* 3. Provide Logistics Service */}
                                <div className="absolute top-0 right-0 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center w-[120px] h-[115px] z-10 transition-transform hover:scale-105">
                                    <Truck size={32} strokeWidth={2.5} className="text-[#0066FF] mb-3" />
                                    <span className="font-bold text-[11px] text-[#0B1E43] text-center leading-tight">Provide<br/>Logistics Service</span>
                                </div>

                                {/* 4. Submit Invoice */}
                                <div className="absolute bottom-0 left-[170px] bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center w-[120px] h-[115px] z-10 transition-transform hover:scale-105">
                                    <FileText size={32} strokeWidth={2.5} className="text-[#0066FF] mb-3" />
                                    <span className="font-bold text-[11px] text-[#0B1E43] text-center leading-tight">Submit<br/>Invoice</span>
                                </div>

                                {/* 5. Receive Payment */}
                                <div className="absolute bottom-0 right-0 bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col items-center justify-center w-[120px] h-[115px] z-10 transition-transform hover:scale-105">
                                    <div className="relative mb-3">
                                        <CreditCard size={32} strokeWidth={2.5} className="text-[#0066FF]" />
                                        <div className="bg-[#0066FF] rounded-full absolute -bottom-1 -right-1 p-0.5">
                                            <Play size={10} className="fill-white text-white ml-0.5" />
                                        </div>
                                    </div>
                                    <span className="font-bold text-[11px] text-[#0B1E43] text-center leading-tight">Receive<br/>Payment</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BENEFITS SECTION */}
            <div className="bg-[#0B1E43] py-12 lg:py-16 relative overflow-hidden">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
                        <div className="max-w-3xl">
                            <p className="text-slate-300 font-bold tracking-widest text-[11px] mb-3 uppercase">WHY BECOME A LOGISTICSSCANNER CREDIT PARTNER?</p>
                            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black leading-tight !text-white">
                                Add payment flexibility. Unlock more business.
                            </h2>
                        </div>
                        <p className="max-w-md text-slate-300 text-[15px] font-medium leading-relaxed">
                            Access international opportunities, offer up to 30-day credit to eligible customers and reduce collection follow-up — while we support the payment process for approved transactions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Benefit Card 1 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <Globe2 size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">01</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Access International<br/>Customers</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">Connect with customers looking for freight services across global markets.</p>
                            </div>
                        </div>
                        
                        {/* Benefit Card 2 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <CalendarRange size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">02</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Offer Up to 30-Day Credit</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">Eligible customers may receive credit terms of up to 30 days, based on approved criteria.</p>
                            </div>
                        </div>

                        {/* Benefit Card 3 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">03</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Payment Support<br/>for Approved Transactions</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">LogisticsScanner supports the applicable payment and collection process.</p>
                            </div>
                        </div>

                        {/* Benefit Card 4 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <RefreshCw size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">04</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Reduce Collection Follow-Up</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">We manage the customer collection side, allowing you to focus more on operations and customer service.</p>
                            </div>
                        </div>

                        {/* Benefit Card 5 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <BarChart2 size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">05</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Improve Customer Conversion</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">Payment flexibility can help you win more B2B customers.</p>
                            </div>
                        </div>

                        {/* Benefit Card 6 */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-5 hover:-translate-y-1 transition-transform">
                            <div className="bg-[#EBF2FF] text-[#0066FF] w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp size={26} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-[#0066FF] font-black text-[13px] tracking-wider mb-1 block">06</span>
                                <h4 className="font-black text-lg text-[#0B1E43] leading-tight mb-2">Expand Your Freight Business</h4>
                                <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">Explore additional international business opportunities through the LogisticsScanner network.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROCESS SECTION */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <div>
                        <p className="text-[#0066FF] font-black tracking-wider text-xs mb-3 uppercase">HOW THE PARTNER CREDIT PROGRAM WORKS</p>
                        <h2 className="text-3xl md:text-4xl font-black text-[#0B1E43] leading-tight">
                            A simple and transparent process
                        </h2>
                    </div>
                    <p className="max-w-sm text-slate-500 text-sm font-medium">
                        From customer opportunity to payment settlement, the workflow is structured and easy to follow.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
                    <div className="absolute top-8 left-10 right-10 h-0.5 bg-slate-200 hidden md:block z-0"></div>
                    
                    {[
                        { num: "01", icon: Users, title: "Receive a Customer Opportunity" },
                        { num: "02", icon: FileText, title: "Credit Assessment" },
                        { num: "03", icon: Box, title: "Customer Places Order" },
                        { num: "04", icon: Truck, title: "Partner Executes Service" },
                        { num: "05", icon: FileText, title: "Submit Invoice & Documents" },
                        { num: "06", icon: CreditCard, title: "Payment Settlement" }
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center text-center relative z-10">
                            <div className="bg-white border-4 border-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-[#0B1E43] mb-4 relative">
                                <span className="absolute -top-2 -left-2 bg-[#0066FF] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">{step.num}</span>
                                <step.icon size={24} />
                            </div>
                            <span className="font-bold text-xs text-[#0B1E43] max-w-[100px]">{step.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* UP TO 30 DAYS BANNER */}
            <div className="relative overflow-hidden w-full h-[280px] lg:h-[320px] flex items-center">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url("/images/banner-bg.png")' }}
                ></div>
                
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-full md:w-[75%]"></div>
                
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full flex justify-between items-center">
                    {/* Left Text Block */}
                    <div className="max-w-xl">
                        <h4 className="text-[#0B1E43] font-black tracking-wider text-base lg:text-lg uppercase mb-0.5">UP TO</h4>
                        <h2 className="text-5xl lg:text-[70px] font-black text-[#0066FF] leading-none mb-1 tracking-tight">30 DAYS</h2>
                        <h3 className="text-2xl lg:text-3xl font-black text-[#0B1E43] mb-3">OF CREDIT</h3>
                        <p className="text-slate-700 font-semibold text-xs lg:text-[13px] leading-relaxed max-w-md">
                            Eligible customers may be approved for a credit period of up to 30 days, subject to LogisticsScanner's assessment, approved credit limit, documentation and program conditions.
                        </p>
                    </div>

                    {/* Right Dial Graphic */}
                    <div className="hidden lg:flex flex-col items-center justify-center mr-8 lg:mr-16 relative">
                        {/* Circular Progress Design */}
                        <div className="relative w-40 h-40 rounded-full border-[10px] border-blue-100/80 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md shadow-xl">
                            {/* Blue Arc (Simulated with absolute positioning or border) */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#0066FF" strokeWidth="10" strokeDasharray="282.6" strokeDashoffset="70" strokeLinecap="round" />
                            </svg>
                            <span className="text-4xl font-black text-[#0B1E43] relative z-10">30</span>
                            <span className="text-base font-black text-[#0B1E43] tracking-widest relative z-10">DAYS</span>
                        </div>
                        <p className="text-[10px] font-bold text-[#0B1E43] text-center mt-2 max-w-[120px] bg-white/60 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
                            Maximum applicable credit period
                        </p>
                    </div>
                </div>
            </div>

            {/* ELIGIBLE PARTNERS */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-16">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                    <div>
                        <p className="text-[#0066FF] font-black tracking-wider text-[11px] mb-2 uppercase">WHO CAN JOIN?</p>
                        <h2 className="text-2xl md:text-3xl font-black text-[#0B1E43] leading-tight">
                            Open to eligible logistics partners
                        </h2>
                    </div>
                    <p className="max-w-lg text-slate-500 text-sm font-semibold">
                        The program is designed for freight forwarders, logistics companies, shipping service providers and other eligible logistics partners.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 xl:gap-5 mb-12">
                    {[
                        { icon: Ship, label: "Freight\nForwarders" },
                        { icon: Box, label: "NVOCCs" },
                        { icon: Ship, label: "Shipping\nCompanies" },
                        { icon: Plane, label: "Air Freight" },
                        { icon: Ship, label: "Sea Freight" },
                        { icon: Truck, label: "Road\nTransport" },
                        { icon: FileText, label: "CHAs" },
                        { icon: Warehouse, label: "Warehousing" },
                        { icon: Network, label: "Multimodal\nLogistics" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 w-[120px] bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] p-4 transition-transform hover:-translate-y-1 cursor-default border border-slate-50">
                            <div className="text-[#0066FF] flex items-center justify-center">
                                <item.icon size={26} strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-bold text-center text-[#0B1E43] whitespace-pre-line leading-tight">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* COMPARISON & WORKFLOW WIDGETS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    {/* Left Box: Your Role vs LogisticsScanner */}
                    <div className="bg-[#F4F8FE] rounded-3xl p-6 md:p-8">
                        <h3 className="text-xl md:text-2xl font-black text-[#0B1E43] mb-1">Your Role vs. LogisticsScanner</h3>
                        <p className="text-slate-500 text-sm font-semibold mb-6">A clear division of responsibilities for a smoother experience.</p>
                        
                        <div className="bg-white rounded-2xl p-2 shadow-sm grid grid-cols-2 gap-2">
                            {/* Column 1 */}
                            <div>
                                <div className="bg-[#4FA4FF] text-white font-bold text-sm text-center py-2.5 rounded-xl mb-2">Your Role</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Search size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Find customer opportunity</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <FileSignature size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Quote and provide service</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Truck size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Execute shipment</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <FileText size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Submit invoice and documents</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Column 2 */}
                            <div>
                                <div className="bg-[#3B82F6] text-white font-bold text-sm text-center py-2.5 rounded-xl mb-2">LogisticsScanner</div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <ShieldCheck size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Support credit eligibility</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Wallet size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Manage applicable collection</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <BadgeCheck size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Verify transaction</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                                        <CheckCircle2 size={16} className="text-[#0066FF] shrink-0" strokeWidth={2.5} />
                                        <span className="text-[11px] md:text-xs font-bold text-[#0B1E43] leading-tight">Process approved payment</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Box: Payment Support workflow */}
                    <div className="bg-[#F4F8FE] rounded-3xl p-6 md:p-8 flex flex-col">
                        <h3 className="text-xl md:text-2xl font-black text-[#0B1E43] mb-1">Payment Support, With Clear Conditions</h3>
                        <p className="text-slate-500 text-sm font-semibold mb-6">Payment for approved transactions is subject to credit limit, verification, valid invoice and agreed commercial terms.</p>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm flex-1 flex flex-col justify-center">
                            <div className="flex items-center justify-between gap-1 mb-6">
                                {[
                                    { icon: Users, label: "Approved\nTransaction" },
                                    { icon: Wallet, label: "Credit\nLimit" },
                                    { icon: ShieldCheck, label: "Verification" },
                                    { icon: FileText, label: "Valid\nInvoice" },
                                    { icon: Handshake, label: "Agreed\nTerms" },
                                    { icon: CreditCard, label: "Payment\nProcessing" }
                                ].map((item, i, arr) => (
                                    <React.Fragment key={i}>
                                        <div className="flex flex-col items-center text-center gap-2 w-16">
                                            <div className="bg-[#EBF2FF] text-[#0066FF] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                                                <item.icon size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[9px] md:text-[10px] font-bold text-[#0B1E43] whitespace-pre-line leading-tight">{item.label}</span>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <ArrowRight size={14} className="text-[#93C5FD] shrink-0 mb-6 hidden md:block" strokeWidth={3} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            
                            <div className="bg-[#FEF2F2] rounded-xl p-3 flex items-center gap-3">
                                <AlertCircle size={18} className="text-[#EF4444] shrink-0" strokeWidth={2.5} />
                                <p className="text-xs font-bold text-[#991B1B]">Payment assurance is not an unconditional payment guarantee.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ SECTION */}
                <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-[#0B1E43] mb-1">Frequently Asked Questions</h2>
                            <p className="text-slate-500 text-sm font-semibold">Find answers to common questions about the LogisticsScanner Partner Credit Program.</p>
                        </div>
                        <button className="text-[#0066FF] font-bold text-sm flex items-center gap-1 hover:underline whitespace-nowrap">
                            View All FAQs <ArrowRight size={16} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border-b border-slate-100 py-3">
                                <button 
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between text-left gap-4 group"
                                >
                                    <span className="font-bold text-sm text-[#0B1E43] flex items-start gap-3 group-hover:text-[#0066FF] transition-colors">
                                        <span className="text-[#0066FF] shrink-0">{i + 1}.</span> 
                                        <span>{faq.question}</span>
                                    </span>
                                    <ChevronDown size={16} strokeWidth={3} className={`text-slate-300 shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-[#0066FF]' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="pl-6 pt-3 pb-2 text-[13px] text-slate-500 font-semibold leading-relaxed">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA FOOTER SECTION */}
            <div className="bg-[#0B1E43] relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/images/cta-bg.png" alt="Logistics Background" className="w-full h-full object-cover object-right opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E43] via-[#0B1E43]/95 to-[#0B1E43]/10"></div>
                </div>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16 relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
                    {/* Left Side: Text */}
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black !text-white leading-tight mb-4">
                            Turn Payment Flexibility Into<br/>Your Next Business Opportunity.
                        </h2>
                        <p className="text-slate-300 text-[14px] font-medium leading-relaxed max-w-xl">
                            Reach international customers, offer flexible credit, deliver your logistics service and get paid according to the program terms.
                        </p>
                    </div>
                    
                    {/* Right Side: Button & Checks */}
                    <div className="flex flex-col items-start gap-5 shrink-0">
                        <button onClick={() => navigate('/auth')} className="bg-white hover:bg-slate-50 text-[#0066FF] px-6 py-3 rounded-lg font-bold text-[15px] flex items-center gap-2 transition-all">
                            Become a Credit Partner <ArrowRight size={18} />
                        </button>
                        
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-bold !text-white">
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} fill="#4FA4FF" color="#0B1E43" className="border border-transparent rounded-full" /> Reach International Customers</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} fill="#4FA4FF" color="#0B1E43" className="border border-transparent rounded-full" /> Offer Flexible Credit</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} fill="#4FA4FF" color="#0B1E43" className="border border-transparent rounded-full" /> Deliver</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} fill="#4FA4FF" color="#0B1E43" className="border border-transparent rounded-full" /> Get Paid</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[#0B1E43]">Apply for Credit Partner</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div className="p-6">
                            {success ? (
                                <div className="text-center py-8">
                                    <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#0B1E43] mb-2">Application Submitted!</h4>
                                    <p className="text-slate-600">{success}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium flex items-start gap-2">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                            <input 
                                                type="email" 
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all"
                                                placeholder="Enter email"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                                            <input 
                                                type="tel" 
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all"
                                                placeholder="Enter phone"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company / Organization <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.organization}
                                            onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all"
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Details (Optional)</label>
                                        <textarea 
                                            rows="3"
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all resize-none"
                                            placeholder="Tell us a bit about your volume or specific requirements..."
                                        ></textarea>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-[#0066FF] hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerCreditProgram;
