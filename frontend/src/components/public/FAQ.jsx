import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const faqs = [
        {
            question: "What is Logistics Scanner?",
            answer: "Logistics Scanner is a global logistics networking platform that connects importers, exporters, manufacturers, traders, and logistics service providers on one platform. Users can search freight rates, post inquiries, and connect with verified logistics partners worldwide."
        },
        {
            question: "How does Logistics Scanner work?",
            answer: "Users can sign up, create their profiles, search shipping and freight rates, post logistics inquiries, and connect with freight forwarders, transporters, customs brokers, and other logistics service providers."
        },
        {
            question: "Who can join Logistics Scanner?",
            answer: "Importers, exporters, freight forwarders, transporters, customs brokers, manufacturers, traders, and logistics companies can join Logistics Scanner and grow their business network."
        },
        {
            question: "What are the benefits of joining Logistics Scanner?",
            answer: "Benefits include:\n• Access to verified logistics inquiries and leads\n• Global logistics networking opportunities\n• Freight rate search and comparison\n• Increased business visibility\n• Direct connections with logistics partners\n• Credit-based inquiry system"
        },
        {
            question: "Is Logistics Scanner a global logistics network?",
            answer: "Yes. Logistics Scanner is a global logistics platform that enables businesses to connect with logistics service providers and customers across multiple countries and trade routes."
        },
        {
            question: "Can I search freight rates on Logistics Scanner?",
            answer: "Yes. Logistics Scanner allows users to search and compare freight rates for their shipping requirements, helping them make informed logistics decisions."
        },
        {
            question: "Can I post my shipping requirements on Logistics Scanner?",
            answer: "Yes. Users can post their shipping inquiries and receive responses from relevant logistics service providers."
        },
        {
            question: "Does Logistics Scanner provide verified business leads?",
            answer: "Yes. Logistics Scanner offers access to verified logistics inquiries and business leads, helping companies generate new business opportunities."
        },
        {
            question: "How can Logistics Scanner help my logistics business grow?",
            answer: "Logistics Scanner helps businesses increase their market reach, generate quality leads, build global partnerships, and connect with potential customers in the logistics industry."
        },
        {
            question: "How do I register on Logistics Scanner?",
            answer: "You can sign up on Logistics Scanner by creating your account, completing your company profile, and immediately start searching rates or posting logistics inquiries."
        },
        {
            question: "Is Logistics Scanner free to join?",
            answer: "Yes, businesses can register on Logistics Scanner and explore the platform. Additional premium features and plans are available to help companies maximize business opportunities."
        },
        {
            question: "How can freight forwarders benefit from Logistics Scanner?",
            answer: "Freight forwarders can receive verified inquiries, connect with importers and exporters, showcase their services, and expand their global business network."
        },
        {
            question: "Can importers and exporters find logistics partners on Logistics Scanner?",
            answer: "Yes. Importers and exporters can easily find freight forwarders, transport companies, customs brokers, and other logistics service providers through Logistics Scanner."
        },
        {
            question: "What types of logistics services are available on Logistics Scanner?",
            answer: "The platform includes services such as international freight forwarding, air freight, sea freight, road transportation, customs clearance, warehousing, and cargo handling."
        },
        {
            question: "Does Logistics Scanner help generate new business leads?",
            answer: "Yes. Logistics Scanner helps businesses generate quality leads by connecting them with companies actively looking for logistics services."
        },
        {
            question: "How do I find shipping rates on Logistics Scanner?",
            answer: "Simply log in to your account, enter your shipment details, and search available freight rates for your shipping requirements."
        },
        {
            question: "Can I receive inquiries from customers through Logistics Scanner?",
            answer: "Yes. Registered logistics service providers can receive inquiries from businesses seeking logistics and shipping solutions."
        },
        {
            question: "Why should I choose Logistics Scanner over other logistics platforms?",
            answer: "Logistics Scanner offers verified leads, global networking opportunities, freight rate search tools, inquiry posting, and a dedicated platform designed specifically for the logistics industry."
        },
        {
            question: "Can I promote my logistics company on Logistics Scanner?",
            answer: "Yes. By creating a complete company profile, your business gains visibility among importers, exporters, and logistics professionals worldwide."
        },
        {
            question: "Does Logistics Scanner support international shipping requirements?",
            answer: "Yes. Logistics Scanner supports both domestic and international shipping requirements across various industries and trade routes."
        },
        {
            question: "How does Logistics Scanner help increase business visibility?",
            answer: "The platform allows companies to showcase their services, receive inquiries, and connect with potential customers, increasing their visibility within the logistics industry."
        },
        {
            question: "Is my company profile visible to global customers?",
            answer: "Yes. Your company profile can be discovered by businesses looking for logistics services from around the world."
        },
        {
            question: "Can transporters and trucking companies join Logistics Scanner?",
            answer: "Yes. Transporters and trucking companies can register, receive inquiries, and connect with businesses requiring transportation services."
        },
        {
            question: "How quickly can I start using Logistics Scanner after registration?",
            answer: "Once you register and complete your company profile, you can immediately search rates, post inquiries, and connect with logistics partners."
        },
        {
            question: "How does Logistics Scanner simplify logistics networking?",
            answer: "Logistics Scanner brings importers, exporters, and logistics service providers together on one platform, making it easier to find partners, exchange inquiries, and grow business relationships globally."
        }
    ];

    const visibleFaqs = showAll ? faqs : faqs.slice(0, 10);

    return (
        <section className="py-10 bg-white  px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-14">
                    <span className="!text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block mb-3">
                        Got Questions?
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black !text-slate-950 tracking-tight uppercase">
                        Logistics Expertise FAQ
                    </h2>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {visibleFaqs.map((faq) => {
                        const originalIndex = faqs.indexOf(faq);
                        const isOpen = activeIndex === originalIndex;
                        return (
                            <div 
                                key={originalIndex} 
                                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.01)] ${
                                    isOpen ? 'border-[#0066FF] shadow-sm' : 'border-slate-200/80 hover:border-[#0066FF]/30'
                                }`}
                            >
                                <button
                                    onClick={() => setActiveIndex(isOpen ? null : originalIndex)}
                                    className="w-full p-5 flex justify-between items-center text-left transition-all hover:bg-slate-50/50 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <HelpCircle className="text-[#0066FF] shrink-0" size={18} />
                                        <span className="!text-slate-900 font-black text-sm transition-colors">
                                            {faq.question}
                                        </span>
                                    </div>
                                    <div className="shrink-0 ml-4">
                                        {isOpen ? (
                                            <Minus className="text-[#0066FF]" size={18} />
                                        ) : (
                                            <Plus className="text-[#0066FF]" size={18} />
                                        )}
                                    </div>
                                </button>
                                
                                <div 
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                        isOpen ? 'max-h-[500px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <p className="!text-slate-600 text-xs font-bold leading-relaxed border-t border-slate-100 pt-4 whitespace-pre-line">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {faqs.length > 10 && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                        >
                            {showAll ? 'View Less' : 'View More'}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FAQ;


