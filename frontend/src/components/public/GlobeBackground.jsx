import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const GlobeBackground = () => {
    const globeRef = useRef();
    const [arcsData, setArcsData] = useState([]);
    const [markersData, setMarkersData] = useState([]);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    useEffect(() => {
        // Generate random data for arcs and markers
        const N = 25; // More arcs as requested
        const arcs = [];
        const markers = [];
        
        for (let i = 0; i < N; i++) {
            const startLat = (Math.random() - 0.5) * 160;
            const startLng = (Math.random() - 0.5) * 360;
            const endLat = (Math.random() - 0.5) * 160;
            const endLng = (Math.random() - 0.5) * 360;
            
            arcs.push({
                startLat,
                startLng,
                endLat,
                endLng,
                color: ['#0066FF', '#FFB400'] // Blue to Yellow gradient for arc
            });
            
            markers.push({
                lat: endLat,
                lng: endLng,
                icon: '👤'
            });
        }
        
        setArcsData(arcs);
        setMarkersData(markers);

        // Manual smooth rotation for perfect 360 spin
        let animationFrameId;
        let lng = 0;
        
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = false; 
            globeRef.current.controls().enableZoom = false; 
        }

        const animateRotation = () => {
            if (globeRef.current) {
                lng += 0.03; // Extremely slow and subtle horizontal rotation (SeaRates style)
                globeRef.current.pointOfView({ lat: 15, lng: lng, altitude: 2.2 }, 0);
            }
            animationFrameId = requestAnimationFrame(animateRotation);
        };
        
        // Start animation after initialization
        setTimeout(animateRotation, 500);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-end overflow-hidden z-0 opacity-90" style={{ transform: 'scale(1.15) translateX(10%)' }}>
            {/* Position globe to the right side and scale it up to look like SeaRates */}
            <Globe
                ref={globeRef}
                backgroundColor="rgba(0,0,0,0)" // Transparent background
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                atmosphereColor="#00b2fe"
                atmosphereAltitude={0.15}
                
                // Arcs config
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.3}
                arcDashGap={2}
                arcDashInitialGap={() => Math.random() * 5}
                arcDashAnimateTime={4500} // Slow motion arcs
                arcStroke={0.5}
                
                // Markers (HTML Elements for icons)
                htmlElementsData={markersData}
                htmlElement={d => {
                    const el = document.createElement('div');
                    el.innerHTML = d.icon;
                    el.style.fontSize = '16px'; // Proper size for emoji
                    el.style.color = '#333';
                    el.style.backgroundColor = 'white';
                    el.style.borderRadius = '50%';
                    el.style.width = '24px';
                    el.style.height = '24px';
                    el.style.boxShadow = '0px 2px 8px rgba(0,0,0,0.3)';
                    el.style.display = 'flex';
                    el.style.justifyContent = 'center';
                    el.style.alignItems = 'center';
                    el.style.transform = 'translate(-50%, -50%)';
                    return el;
                }}
                
                // Sizing (approximate viewport width)
                width={dimensions.width > 768 ? dimensions.width * 0.7 : dimensions.width}
                height={dimensions.height}
            />
        </div>
    );
};

export default GlobeBackground;
