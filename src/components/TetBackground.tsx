"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Lantern from "./Lantern";

export default function TetBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Premium Mesh Gradient Base */}
            <div className="absolute inset-0 bg-[#3b0707]">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-40 bg-[radial-gradient(circle_at_20%_20%,#7f1d1d_0%,transparent_50%),radial-gradient(circle_at_80%_80%,#991b1b_0%,transparent_50%),radial-gradient(circle_at_50%_50%,#450a0a_0%,transparent_80%)] animate-pulse" style={{ animationDuration: '8s' }} />

                {/* Noise Texture for Premium Feel */}
                <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("/noise.svg")' }} />
            </div>

            {/* Traditional Pattern Overlay */}
            <div className="absolute inset-0 viet-pattern opacity-[0.03]" />

            {/* Animated Lanterns */}
            <div className="absolute top-0 left-0 w-full h-full">
                <Lantern position={{ top: "4%", left: "8%" }} size={75} delay={0} />
                <Lantern position={{ top: "1%", left: "22%" }} size={55} delay={1.5} />
                <Lantern position={{ top: "6%", left: "82%" }} size={65} delay={0.5} />
                <Lantern position={{ top: "3%", left: "68%" }} size={85} delay={2} />
                <Lantern position={{ top: "15%", left: "92%" }} size={45} delay={3} />
            </div>

            {/* Floating Petals */}
            <Petals />

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
        </div>
    );
}


function Petals() {
    const [petalsData, setPetalsData] = useState<any[]>([]);

    useEffect(() => {
        const newData = [...Array(12)].map((_, i) => ({
            left: Math.random() * 100,
            targetLeft: (Math.random() - 0.5) * 20 + (i * 8),
            duration: 10 + Math.random() * 15,
            delay: Math.random() * 20,
            type: i % 2 === 0 ? "#fbbf24" : "#f472b6",
        }));
        setPetalsData(newData);
    }, []);

    if (petalsData.length === 0) return null;

    return (
        <>
            {petalsData.map((data, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: data.type,
                        left: `${data.left}%`,
                        top: `-5%`,
                    }}
                    animate={{
                        top: "105%",
                        left: `${data.targetLeft}%`,
                        rotate: 360,
                    }}
                    transition={{
                        duration: data.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: data.delay,
                    }}
                />
            ))}
        </>
    );
}
