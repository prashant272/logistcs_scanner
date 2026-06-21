import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    return (
        <a
            href="https://wa.me/918595254163"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3"
        >
            <div className="bg-white text-black px-4 py-2 rounded-lg shadow-xl font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 backdrop-blur-md border border-white/20">
                Chat With Us Instantly
            </div>
            <div className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce cursor-pointer">
                <MessageCircle size={32} />
            </div>
        </a>
    );
};

export default WhatsAppButton;
