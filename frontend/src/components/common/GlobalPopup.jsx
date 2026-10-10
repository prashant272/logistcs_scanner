import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const GlobalPopup = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [popups, setPopups] = useState([]);
    const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Exclude admin routes from showing popups
        if (location.pathname.startsWith('/admin')) {
            setIsVisible(false);
            return;
        }

        const fetchActivePopups = async () => {
            try {
                // Determine role (customer, vendor, or empty for guest)
                let role = '';
                if (user?.role === 'customer' || user?.role === 'vendor') {
                    role = user.role;
                }

                const res = await api.get(`/popups/active?role=${role}&path=${encodeURIComponent(location.pathname)}`);
                const activePopups = res.data || [];

                // Filter out popups that are "once" and have already been seen
                const seenPopups = JSON.parse(localStorage.getItem('seen_popups') || '[]');
                
                const popupsToShow = activePopups.filter(popup => {
                    if (popup.frequency === 'always') return true;
                    if (popup.frequency === 'once' && !seenPopups.includes(popup._id)) return true;
                    return false;
                });

                if (popupsToShow.length > 0) {
                    setPopups(popupsToShow);
                    setCurrentPopupIndex(0);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('Error fetching active popups:', error);
            }
        };

        // Small delay to allow page render before showing popup
        const timer = setTimeout(() => {
            fetchActivePopups();
        }, 1500);

        return () => clearTimeout(timer);
    }, [location.pathname, user]);

    const handleClose = () => {
        if (!popups[currentPopupIndex]) return;
        
        const popup = popups[currentPopupIndex];
        
        // Mark as seen if it's "once" frequency
        if (popup.frequency === 'once') {
            const seenPopups = JSON.parse(localStorage.getItem('seen_popups') || '[]');
            if (!seenPopups.includes(popup._id)) {
                seenPopups.push(popup._id);
                localStorage.setItem('seen_popups', JSON.stringify(seenPopups));
            }
        }

        // Show next popup if there are multiple
        if (currentPopupIndex < popups.length - 1) {
            setCurrentPopupIndex(prev => prev + 1);
        } else {
            setIsVisible(false);
            setTimeout(() => setPopups([]), 300); // clear after animation
        }
    };

    if (!isVisible || popups.length === 0) return null;

    const popup = popups[currentPopupIndex];

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-xl md:w-auto md:min-w-[400px] overflow-hidden shadow-2xl relative animate-scaleUp flex flex-col max-h-[90vh]">
                
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-md"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Image Section */}
                {popup.imageUrl && (
                    <div className="w-full flex-shrink-0 bg-slate-100 relative border-b border-slate-200">
                        <img 
                            src={popup.imageUrl} 
                            alt={popup.title} 
                            className="w-full max-h-[55vh] object-contain mx-auto"
                            style={{ display: 'block' }}
                        />
                    </div>
                )}

                {/* Content Section */}
                <div className="p-6 sm:p-8 text-center bg-white flex-1 overflow-y-auto">
                    {popup.title && (
                        <h2 
                            className="text-2xl sm:text-3xl font-black mb-3 tracking-tight capitalize"
                            style={{ color: '#0f172a' }}
                        >
                            {popup.title}
                        </h2>
                    )}
                    
                    {popup.content && (
                        <div 
                            className="text-sm sm:text-base leading-relaxed mb-6 font-medium max-w-md mx-auto"
                            style={{ color: '#475569' }}
                        >
                            {popup.content}
                        </div>
                    )}
                    
                    <div className="mt-2">
                        {popup.buttonLink ? (
                            <a 
                                href={popup.buttonLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleClose}
                                className="inline-block w-full sm:w-auto min-w-[200px] bg-[#0066FF] hover:bg-[#0052cc] text-white py-3.5 px-8 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-[#0066FF]/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {popup.buttonText || 'Got It'}
                            </a>
                        ) : (
                            <button 
                                onClick={handleClose}
                                className="w-full sm:w-auto min-w-[200px] bg-[#0066FF] hover:bg-[#0052cc] text-white py-3.5 px-8 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-[#0066FF]/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {popup.buttonText || 'Got It'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPopup;
