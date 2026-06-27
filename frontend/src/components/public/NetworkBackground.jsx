import React, { useEffect, useRef } from 'react';

const NetworkBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        let nodes = [];
        let width, height;
        let tick = 0; // For animation time
        let minX = 0;

        // Added more icons: Globe, Handshake, Location, Enquiry/Mail
        const icons = ['✈️', '🚢', '🚛', '📦', '🌍', '🤝', '📍', '✉️'];

        const init = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
            
            // If desktop, keep animation to the right side (avoiding text on left)
            minX = width > 768 ? width * 0.4 : 0;

            // Adjust node count based on screen size
            const nodeCount = Math.floor((width * height) / 25000);
            nodes = [];
            
            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * (width - minX) + minX,
                    y: Math.random() * (height - 100) + 100, // Start below header
                    vx: (Math.random() - 0.5) * 1.0,
                    vy: (Math.random() - 0.5) * 1.0,
                    icon: icons[Math.floor(Math.random() * icons.length)],
                    size: Math.random() * 8 + 16, // 16 to 24px (half of 32-48px)
                    // Random speed phase for data packets
                    packetSpeed: Math.random() * 0.02 + 0.01,
                    packetOffset: Math.random() * Math.PI * 2
                });
            }
        };

        const draw = () => {
            tick++;
            // Clear canvas completely since it's on a light background now
            ctx.clearRect(0, 0, width, height);
            
            // Draw curved connections first (so they are under icons)
            for (let i = 0; i < nodes.length; i++) {
                const p = nodes[i];
                
                for (let j = i + 1; j < nodes.length; j++) {
                    const p2 = nodes[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 200) {
                        const cx = (p.x + p2.x) / 2;
                        const cy = (p.y + p2.y) / 2 - (dist * 0.15); // Offset upwards
                        
                        // Draw Path
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
                        
                        const opacity = 1 - (dist / 200);
                        
                        const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                        gradient.addColorStop(0, `rgba(255, 170, 0, ${Math.max(opacity, 0.1)})`);
                        gradient.addColorStop(1, `rgba(255, 200, 0, ${Math.max(opacity * 0.5, 0.1)})`);
                        
                        ctx.strokeStyle = gradient;
                        ctx.setLineDash([6, 6]);
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.setLineDash([]); 

                        // Draw moving "Enquiry/Goods" packet along the path
                        // Calculate position t from 0 to 1
                        const t = (Math.sin(tick * p.packetSpeed + p.packetOffset) + 1) / 2;
                        
                        // Quadratic Bezier formula
                        const packetX = Math.pow(1 - t, 2) * p.x + 2 * (1 - t) * t * cx + Math.pow(t, 2) * p2.x;
                        const packetY = Math.pow(1 - t, 2) * p.y + 2 * (1 - t) * t * cy + Math.pow(t, 2) * p2.y;

                        ctx.beginPath();
                        ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
                        ctx.fillStyle = '#0066FF'; // Blue dot representing data/enquiry
                        ctx.shadowBlur = 6;
                        ctx.shadowColor = '#0066FF';
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // Update & draw nodes (icons)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < nodes.length; i++) {
                const p = nodes[i];
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges gently, restrict top bound to 100px (header area)
                if (p.x < minX) { p.x = minX; p.vx *= -1; } // Bounce off left text area
                if (p.x > width) { p.x = width; p.vx *= -1; }
                if (p.y < 100) { p.y = 100; p.vy *= -1; } // Bounce below header
                if (p.y > height) { p.y = height; p.vy *= -1; }

                // Draw icon
                ctx.font = `${p.size}px Arial`;
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(p.icon, p.x, p.y);
                ctx.shadowBlur = 0; // Reset shadow
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        init();
        draw();

        const handleResize = () => {
            init();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="w-full h-full absolute inset-0 pointer-events-none"
        />
    );
};

export default NetworkBackground;
