import React, { useEffect } from 'react';

const DownloadApp = () => {
    useEffect(() => {
        const ua = navigator.userAgent;
        const isAndroid = /Android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        if (isAndroid) {
            // Android Intent natively checks if app is installed. If yes, opens it. If no, opens Play Store.
            window.location.replace(
                "intent://#Intent;package=com.logosticdekhoapp.app;scheme=https;end;"
            );
        } else if (isIOS) {
            // Try to open the app via a custom scheme (assuming logisticsscanner://)
            // If it fails after 1.5 seconds, redirect to App Store
            window.location.replace("logisticsscanner://");
            setTimeout(() => {
                window.location.replace("https://apps.apple.com/us/app/logisticsscanner-freight-cha/id6749311566");
            }, 1500);
        } else {
            window.location.replace("/");
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 font-bold animate-pulse text-[#0066FF]">Redirecting to App Store...</p>
            </div>
        </div>
    );
};

export default DownloadApp;
