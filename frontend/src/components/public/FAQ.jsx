import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqs = [
        {
            question: "How long does delivery typically take?",
            answer: "Domestic express deliveries usually take 24-48 hours. International shipments vary between 3-7 business days depending on the destination and customs clearance."
        },
        {
            question: "Do you provide Cash on Delivery (COD)?",
            answer: "Yes, we provide specialized COD services for e-commerce vendors with one of the fastest remittance cycles in the industry."
        },
        {
            question: "Is specialized fragile packaging available?",
            answer: "Absolutely. We offer elite white-glove handling and reinforced packaging options for delicate items like electronics, glassware, and artwork."
        },
        {
            question: "How can I track my shipment in real-time?",
            answer: "You can track your shipment using the tracking bar on our homepage or by entering your Tracking ID on the 'Track Shipment' page. We also provide auto-updates via SMS and Email."
        },
        {
            question: "What is the maximum weight limit for shipments?",
            answer: "We handle everything from documents (500g) to heavy industrial cargo (1000kg+). For shipments over 50kg, we recommend our specialized Cargo solutions."
        }
    ];

    return (
        <section className="bg-white py-20 px-6 font-sans relative z-10 border-b border-slate-100">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-14">
                    <span className="!text-[#0066FF] text-xs font-black tracking-[0.2em] uppercase block mb-3">
                        Got Questions?
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black !text-slate-950 tracking-tight uppercase">
                        Logistics Expertise FAQ
                    </h2>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = activeIndex === index;
                        return (
                            <div 
                                key={index} 
                                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_5px_15px_rgba(0,0,0,0.01)] ${
                                    isOpen ? 'border-[#0066FF] shadow-sm' : 'border-slate-200/80 hover:border-[#0066FF]/30'
                                }`}
                            >
                                <button
                                    onClick={() => setActiveIndex(isOpen ? null : index)}
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
                                        isOpen ? 'max-h-[250px] opacity-100 p-5 pt-0' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <p className="!text-slate-600 text-xs font-bold leading-relaxed border-t border-slate-100 pt-4">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
