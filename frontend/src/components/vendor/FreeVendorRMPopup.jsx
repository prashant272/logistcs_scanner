import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, User as UserIcon } from 'lucide-react';

const FreeVendorRMPopup = ({ user }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if the vendor is a "free" vendor
        // Assuming a free vendor means no active plan or plan name contains "free"
        const isFree = !user?.activePlan || (user?.activePlan?.name && user.activePlan.name.toLowerCase().includes('free'));
        
        // Show popup if they are free
        if (isFree) {
            // Small delay to make it feel natural
            const timer = setTimeout(() => {
                setShow(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleClose = () => {
        setShow(false);
    };

    if (!show) return null;

    const rm = user?.assignedRM;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100">
                
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Graphic */}
                <div className="bg-gradient-to-br from-blue-500 to-[#0066FF] p-6 pt-8 relative overflow-hidden text-center text-white">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-1">Hello, Partner!</h2>
                        <p className="text-blue-100 text-sm font-medium">We're here to help you grow your business.</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium text-center">
                        If you want to know more about available enquiries or are having trouble accepting new enquiries, please contact your Relationship Manager (RM).
                    </p>

                    {rm ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <UserIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your RM</p>
                                    <p className="text-sm font-black text-slate-800">{rm.name || 'Not Assigned'}</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60">
                                {rm.mobile && (
                                    <a href={`tel:${rm.mobile}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                                        <Phone size={14} className="text-slate-400" />
                                        {rm.mobile}
                                    </a>
                                )}
                                {rm.email && (
                                    <a href={`mailto:${rm.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium">
                                        <Mail size={14} className="text-slate-400" />
                                        {rm.email}
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                            <p className="text-sm font-medium text-slate-600">
                                You don't have an RM assigned yet. Please contact support.
                            </p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleClose}
                        className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
                    >
                        Okay, I got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FreeVendorRMPopup;
