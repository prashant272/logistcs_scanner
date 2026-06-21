import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled up to given distance
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top coordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        }
    }, []);

    return (
        <div className="fixed bottom-[5.5rem] right-8 z-50">
            {isVisible && (
                <button 
                    onClick={scrollToTop} 
                    className="bg-[#0066FF] hover:bg-[#0B1E43] text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg shadow-[#0066FF]/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={24} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
};

export default ScrollToTopButton;
