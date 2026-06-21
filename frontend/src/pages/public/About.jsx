import React from 'react';
import { Check } from 'lucide-react';
import GetInTouch from '../../components/common/GetInTouch';

const About = () => {
    return (
        <div className="bg-white min-h-screen pt-20 pb-4 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Who We Are Section */}
            <section className="container mx-auto px-6 py-6 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight leading-tight">
                            Who We <span className="text-[#0091d5]">Are</span>
                        </h1>
                        <div className="space-y-3 text-slate-900 text-sm md:text-base leading-relaxed font-semibold">
                            <p>
                                LogisticsScanner.com is a global logistics networking and lead-generation platform 
                                developed and managed by BNB Worldwide Pvt. Ltd. (formerly BNB Travel Community (OPC) 
                                Private Limited). Our mission is to bridge logistics businesses with trusted global partners 
                                and verified opportunities.
                            </p>
                            <p>
                                We are an online marketplace that links companies with reputable logistics service providers. 
                                If you are a startup business that requires local shipping or an enterprise dealing in 
                                international trades, we provide you with a platform to easily compare services, identify 
                                competitive prices and select the most appropriate logistics provider.
                            </p>
                            <p>
                                We don't have warehouses and transport vehicles like conventional logistics companies. 
                                We offer companies a platform to connect with a large network of logistics providers. 
                                In this manner, companies can make informed decisions and obtain the best prices according 
                                to their needs.
                            </p>
                        </div>
                    </div>
                    <div className="relative pl-0 lg:pl-4">
                        <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex justify-center bg-slate-50">
                            <img 
                                src="/logistics_meeting.png" 
                                alt="Logistics Scanner Team Meeting" 
                                className="w-full object-contain max-h-[350px]"
                            />
                            {/* Blue badge overlay */}
                            <div className="absolute bottom-4 left-4 bg-[#0091d5] text-white py-3 px-6 rounded-xl shadow-lg flex flex-col justify-center min-w-[150px] border border-white/20">
                                <span className="text-2xl md:text-3xl font-black tracking-tight leading-none">5000+</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Deliveries</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Mission & Our Vision/Leadership Section */}
            <section className="bg-slate-50 py-10 border-y border-slate-100">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-black tracking-tight">
                                Our <span className="text-[#0091d5]">Mission</span>
                            </h2>
                            <p className="text-slate-900 text-sm md:text-base leading-relaxed font-semibold">
                                We think that logistics needs to be simple, not stressful. We're here to make it simple 
                                and make shipping faster, smoother, and more transparent. We're here to revolutionize 
                                the way businesses do logistics. We are here to empower businesses and make them have the 
                                best service at the right price.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-black tracking-tight">
                                Our Vision & <span className="text-[#0091d5]">Leadership</span>
                            </h2>
                            <p className="text-slate-900 text-sm md:text-base leading-relaxed font-semibold">
                                LogisticsScanner was founded by Mr. Ashish Pandey (Managing Director) with a vision to 
                                simplify and digitalize global logistics. The platform is owned and managed by BNB Worldwide 
                                Pvt. Ltd. (formerly BNB Travel Community (OPC) Private Limited), ensuring strong corporate 
                                governance and reliability.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Customer Obsession: Your Success, Our Priority Section */}
            <section className="container mx-auto px-6 py-10 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="order-2 lg:order-1 relative pr-0 lg:pr-4">
                        <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex justify-center bg-slate-50">
                            <img 
                                src="/customer_network.png" 
                                alt="Happy Customers with Logistics Scanner" 
                                className="w-full object-contain max-h-[350px]"
                            />
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-4">
                        <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-tight">
                            Customer Obsession: <span className="text-[#0091d5]">Your Success, Our Priority</span>
                        </h2>
                        <p className="text-slate-900 text-sm md:text-base leading-relaxed font-semibold">
                            At <strong>Logistics Scanner</strong>, we prioritize our customers. Every feature we design, 
                            every innovation we introduce, and every service we deliver is crafted with your needs in mind. 
                            We're not just connecting you to logistics providers—we're here to save your time and money.
                        </p>
                        
                        <div className="space-y-3 pt-1">
                            <h3 className="text-base font-bold text-black">Why Choose Us?</h3>
                            
                            <ul className="space-y-2.5">
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        <strong className="text-black font-black">Ease of Digital Experience:</strong> Quickly compare and book logistics services online with a seamless interface.
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        <strong className="text-black font-black">Live Tracking:</strong> Stay updated on your shipments in real-time with our live tracking system.
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        <strong className="text-black font-black">Personalized Solutions:</strong> We tailor our services to meet your unique business logistics needs.
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        <strong className="text-black font-black">24/7 Customer Support:</strong> Our dedicated team is always available to assist you, anytime you need help.
                                    </p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                        <Check size={12} className="stroke-[3]" />
                                    </div>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        <strong className="text-black font-black">Your Success is Our Priority:</strong> We tackle your logistics challenges so you can focus on growing your business.
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Logistics Scanner Section */}
            <section className="bg-slate-50 py-10 border-t border-slate-100">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center max-w-3xl mx-auto mb-8">
                        <h2 className="text-2xl md:text-3xl font-black text-black tracking-tight">
                            Why Logistics <span className="text-[#0091d5]">Scanner?</span>
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                    <Check size={14} className="stroke-[3]" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm md:text-base font-bold text-black">All-in-One Platform</h4>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        No more calling around - Logistics Scanner brings all logistics providers together 
                                        in one place, making it easy to explore your options in seconds.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                    <Check size={14} className="stroke-[3]" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm md:text-base font-bold text-black">Fast & Cost-Effective Shipping</h4>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        Instantly compare prices from multiple carriers and choose the shipping method 
                                        that fits your budget and timeline.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                    <Check size={14} className="stroke-[3]" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm md:text-base font-bold text-black">Real Reviews, Smarter Choices</h4>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        Access genuine customer reviews and ratings to make informed decisions 
                                        with confidence.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-[#0091d5]/15 text-[#0091d5] rounded-full p-1 flex-shrink-0">
                                    <Check size={14} className="stroke-[3]" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm md:text-base font-bold text-black">AI-Powered Matchmaking</h4>
                                    <p className="text-slate-900 text-sm leading-relaxed font-semibold">
                                        Our smart algorithms connect your business with the most suitable logistics 
                                        partners, ensuring efficient and reliable shipping every time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Get In Touch CTA Card Section */}
            <GetInTouch />
        </div>
    );
};

export default About;
