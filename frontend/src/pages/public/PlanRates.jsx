import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Phone, ChevronRight } from 'lucide-react';

const PlanRates = () => {
    return (
        <div className="bg-slate-50 min-h-screen pt-28 pb-20 font-sans">
            <div className="container mx-auto px-6 max-w-5xl">
                <div className="text-center mb-16 relative">
                    {/* Decorative element */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0066FF]/5 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <span className="text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block mb-4">
                        Pricing Options
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-[#0B1E43] tracking-tight uppercase relative z-10">
                        Our Subscription <span className="text-[#0066FF]">Plans</span>
                    </h1>
                    <p className="text-slate-600 mt-6 text-base font-medium max-w-2xl mx-auto relative z-10">
                        Choose the right plan to boost your visibility, get more inquiries, and grow your logistics business globally.
                    </p>
                </div>

                <div className="space-y-16">
                    {/* Table 1: Freight Forwarding */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 relative">
                        {/* Table Header Section */}
                        <div className="bg-slate-50/50 p-6 border-b border-slate-200">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Freight Forwarding Plans
                            </h2>
                        </div>
                        <div className="overflow-x-auto p-2">
                            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Features</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Basic Listing</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Standard Plan</th>
                                        <th className="p-5 font-black text-[#0066FF] w-1/4 uppercase tracking-wider text-xs bg-[#0066FF]/5 rounded-t-xl">Premium Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Visibility</td>
                                        <td className="p-5">Listed under category</td>
                                        <td className="p-5">Featured on top</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Featured + Home page banner</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Inquiries</td>
                                        <td className="p-5">Upto 10 per month</td>
                                        <td className="p-5">Upto 30 per month</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited inquiries</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Rate Uploads</td>
                                        <td className="p-5">10 trade lanes</td>
                                        <td className="p-5">50 trade lanes</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited trade lanes</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Analytics</td>
                                        <td className="p-5">Basic dashboard</td>
                                        <td className="p-5">Advanced stats</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Advanced stats + competitor analysis</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Support</td>
                                        <td className="p-5">Email support</td>
                                        <td className="p-5">Email + phone</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Priority phone support</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Duration</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">1 year</td>
                                    </tr>
                                    <tr>
                                        <td className="p-5 font-black text-[#0B1E43] uppercase tracking-wider">Price (INR)</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹9,999</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹19,999</td>
                                        <td className="p-5 font-black text-[#0066FF] text-xl bg-[#0066FF]/5 rounded-b-xl">₹29,999</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 2: LAND Transport */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 relative">
                        <div className="bg-slate-50/50 p-6 border-b border-slate-200">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                LAND Transport Plans
                            </h2>
                        </div>
                        <div className="overflow-x-auto p-2">
                            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Features</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Basic Listing</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Standard Plan</th>
                                        <th className="p-5 font-black text-[#0066FF] w-1/4 uppercase tracking-wider text-xs bg-[#0066FF]/5 rounded-t-xl">Premium Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Visibility</td>
                                        <td className="p-5">Listed under LAND section</td>
                                        <td className="p-5">Featured in city/corridor search</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Featured + city banner</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Inquiries</td>
                                        <td className="p-5">Upto 20 per month</td>
                                        <td className="p-5">Upto 50 per month</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Route Uploads</td>
                                        <td className="p-5">5 corridors</td>
                                        <td className="p-5">25 corridors</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Analytics</td>
                                        <td className="p-5">Basic</td>
                                        <td className="p-5">Advanced</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Advanced + lead quality report</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Support</td>
                                        <td className="p-5">Email</td>
                                        <td className="p-5">Email + phone</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Priority support</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Duration</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">1 year</td>
                                    </tr>
                                    <tr>
                                        <td className="p-5 font-black text-[#0B1E43] uppercase tracking-wider">Price (INR)</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹7,999</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹14,999</td>
                                        <td className="p-5 font-black text-[#0066FF] text-xl bg-[#0066FF]/5 rounded-b-xl">₹24,999</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 3: Warehousing */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 relative">
                        <div className="bg-slate-50/50 p-6 border-b border-slate-200">
                            <h2 className="text-xl font-black text-[#0B1E43] flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
                                Warehousing Plans
                            </h2>
                        </div>
                        <div className="overflow-x-auto p-2">
                            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Features</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Basic Listing</th>
                                        <th className="p-5 font-black text-[#0B1E43] w-1/4 uppercase tracking-wider text-xs">Standard Plan</th>
                                        <th className="p-5 font-black text-[#0066FF] w-1/4 uppercase tracking-wider text-xs bg-[#0066FF]/5 rounded-t-xl">Premium Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Visibility</td>
                                        <td className="p-5">Listed in directory</td>
                                        <td className="p-5">Featured in region search</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Featured + homepage promo</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Inquiries</td>
                                        <td className="p-5">Upto 15 per month</td>
                                        <td className="p-5">Upto 40 per month</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Locations</td>
                                        <td className="p-5">1 warehouse</td>
                                        <td className="p-5">Upto 5 warehouses</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Unlimited warehouses</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Analytics</td>
                                        <td className="p-5">Basic</td>
                                        <td className="p-5">Advanced</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Advanced + heatmap report</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Support</td>
                                        <td className="p-5">Email</td>
                                        <td className="p-5">Email + phone</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">Priority support</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-bold text-[#0B1E43]">Duration</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5">1 year</td>
                                        <td className="p-5 font-bold text-[#0066FF] bg-[#0066FF]/[0.02]">1 year</td>
                                    </tr>
                                    <tr>
                                        <td className="p-5 font-black text-[#0B1E43] uppercase tracking-wider">Price (INR)</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹5,999</td>
                                        <td className="p-5 font-black text-slate-900 text-lg">₹12,999</td>
                                        <td className="p-5 font-black text-[#0066FF] text-xl bg-[#0066FF]/5 rounded-b-xl">₹22,999</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Call to action */}
                <div className="mt-20 relative bg-white border border-slate-200 rounded-3xl p-10 md:p-14 text-center overflow-hidden shadow-2xl shadow-slate-200/50">
                    <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#0066FF] to-transparent" />
                    
                    <h3 className="text-2xl md:text-3xl font-black text-[#0B1E43] uppercase tracking-tight mb-4">Ready to upgrade your business profile?</h3>
                    <p className="text-slate-600 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
                        Join hundreds of verified logistics providers on our platform. Get more leads, increase visibility, and grow your revenue.
                    </p>
                    <Link to="/contact" className="inline-block bg-[#0066FF] hover:bg-[#0052cc] text-white font-black px-12 py-5 rounded-xl uppercase tracking-widest text-sm transition-all transform hover:-translate-y-1 shadow-xl shadow-[#0066FF]/25">
                        Contact Sales Team
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PlanRates;
