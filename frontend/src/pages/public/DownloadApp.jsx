import React, { useEffect } from 'react';

const DownloadApp = () => {
    useEffect(() => {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        const tryRedirect = () => {
            if (isAndroid) {
                window.location.replace(
                    "intent://#Intent;package=com.logosticdekhoapp.app;scheme=https;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.logosticdekhoapp.app;end;"
                );
            } else if (isIOS) {
                window.location.replace("logisticsscanner://");
                setTimeout(() => {
                    window.location.replace("https://apps.apple.com/us/app/logisticsscanner-freight-cha/id6749311566");
                }, 1500);
            } else {
                window.location.replace("/");
            }
        };

        // Try redirecting automatically
        tryRedirect();
    }, []);

    const handleManualRedirect = () => {
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) {
            window.location.href = "https://play.google.com/store/apps/details?id=com.logosticdekhoapp.app";
        } else if (/iPhone|iPad|iPod/i.test(ua)) {
            window.location.href = "https://apps.apple.com/us/app/logisticsscanner-freight-cha/id6749311566";
        } else {
            window.location.href = "/";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
            <div className="text-center max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="w-16 h-16 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-xl font-black mb-2">Redirecting to App Store...</h2>
                <p className="text-slate-400 text-sm mb-6">If you are not automatically redirected within a few seconds, please click the button below.</p>
                <button 
                    onClick={handleManualRedirect}
                    className="w-full bg-[#0066FF] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                    Download App Now
                </button>
            </div>
        </div>
    );
};

export default DownloadApp;
