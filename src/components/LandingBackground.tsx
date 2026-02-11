"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Lantern from "./Lantern";

export default function LandingBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#3b0707]">
            {/* 1. Vibrant Mesh Gradient (Brighter & More Festive) */}
            <div className="absolute inset-0 opacity-80">
                <div className="absolute top-[-40%] left-[-40%] w-[180%] h-[180%] bg-[radial-gradient(circle_at_50%_50%,#b91c1c_0%,transparent_50%)] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[10%] right-[-10%] w-[90%] h-[90%] bg-[radial-gradient(circle_at_50%_50%,#dc2626_0%,transparent_60%)] opacity-50 mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_50%_50%,#7f1d1d_0%,transparent_70%)]" />
            </div>

            {/* 2. Noise Texture */}
            <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.svg")' }} />

            {/* 3. Ancient Dong Son Drum Pattern (Increased Visibility) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vmax] h-[140vmax] opacity-[0.08] pointer-events-none text-yellow-500/40">
                <DongSonDrumSVG />
            </div>

            {/* 4. Animated Lanterns (Re-introduced for festive feel) */}
            <div className="absolute top-0 left-0 w-full h-full">
                <Lantern position={{ top: "5%", left: "10%" }} size={80} delay={0} />
                <Lantern position={{ top: "2%", left: "25%" }} size={60} delay={1.5} />
                <Lantern position={{ top: "8%", left: "85%" }} size={70} delay={0.5} />
                <Lantern position={{ top: "4%", left: "70%" }} size={90} delay={2} />
            </div>

            {/* 5. Gold Dust Particles */}
            <GoldDust />

            {/* 6. Vignette for Focus (Slightly softer to let color through) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_100%)]" />
        </div>
    );
}

function DongSonDrumSVG() {
    return (
        <motion.svg
            viewBox="0 0 1000 1000"
            className="w-full h-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        >
            <circle cx="500" cy="500" r="490" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="500" cy="500" r="350" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" />
            <circle cx="500" cy="500" r="200" fill="none" stroke="currentColor" strokeWidth="2" />

            {/* Sun Rays - Center */}
            <path d="M500 500 L500 300 M500 500 L641 359 M500 500 L700 500 M500 500 L641 641 M500 500 L500 700 M500 500 L359 641 M500 500 L300 500 M500 500 L359 359" stroke="currentColor" strokeWidth="4" />

            {/* Birds Circle (Simplified) */}
            {[...Array(8)].map((_, i) => (
                <g key={i} transform={`rotate(${i * 45} 500 500)`}>
                    <path d="M500 100 L510 130 L490 130 Z" fill="currentColor" />
                </g>
            ))}

            {/* Geometric Patterns */}
            {[...Array(12)].map((_, i) => (
                <circle key={i} cx="500" cy="500" r={400 + i * 5} stroke="currentColor" strokeWidth="0.8" opacity={0.6} />
            ))}
        </motion.svg>
    );
}


function GoldDust() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles: any[] = [];
        const particleCount = 80; // Increased count

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3 - 0.1,
                size: Math.random() * 2.5, // Slightly larger
                alpha: Math.random() * 0.6 + 0.2 // Brighter
            });
        }

        let animId: number;

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`; // Amber-400 (Brighter Gold)
                ctx.fill();
            });

            animId = requestAnimationFrame(animate);
        };

        animId = requestAnimationFrame(animate);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none mix-blend-screen opacity-80" />;
}
