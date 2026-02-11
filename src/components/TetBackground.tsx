"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function TetBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Mesh Gradient Base */}
            <div className="absolute inset-0 bg-red-950">
                <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(circle_at_20%_20%,#7f1d1d_0%,transparent_50%),radial-gradient(circle_at_80%_80%,#991b1b_0%,transparent_50%),radial-gradient(circle_at_50%_50%,#450a0a_0%,transparent_100%)]" />
            </div>

            {/* Traditional Pattern Overlay */}
            <div className="absolute inset-0 viet-pattern opacity-[0.03]" />

            {/* Animated Lanterns */}
            <div className="absolute top-0 left-0 w-full h-full">
                <Lantern position={{ top: "5%", left: "10%" }} size={80} delay={0} />
                <Lantern position={{ top: "2%", left: "25%" }} size={60} delay={1.5} />
                <Lantern position={{ top: "8%", left: "85%" }} size={70} delay={0.5} />
                <Lantern position={{ top: "4%", left: "70%" }} size={90} delay={2} />
            </div>

            {/* Floating Petals */}
            <Petals />

            {/* Vignette */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
        </div>
    );
}

function Lantern({ position, size, delay }: { position: any; size: number; delay: number }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <motion.div
            style={{ ...position, width: size, height: size * 1.2 }}
            className="absolute"
            animate={{
                rotate: [-3, 3, -3],
                x: [-2, 2, -2],
            }}
            transition={{
                duration: mounted ? 4 + Math.random() * 2 : 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
        >
            {/* String */}
            <div className="absolute top-[-20%] left-1/2 w-[1px] h-[20%] bg-yellow-600/50" />

            {/* Lantern Body */}
            <div className="w-full h-full bg-linear-to-b from-red-600 to-red-800 rounded-[40%_40%_45%_45%] border border-yellow-500/30 relative shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                {/* Horizontal Ribs */}
                <div className="absolute top-[20%] left-0 w-full h-[1px] bg-yellow-500/20" />
                <div className="absolute top-[50%] left-0 w-full h-[1px] bg-yellow-500/20" />
                <div className="absolute top-[80%] left-0 w-full h-[1px] bg-yellow-500/20" />

                {/* Vertical Glow */}
                <div className="absolute left-1/2 top-0 w-[40%] h-full -translate-x-1/2 bg-white/5 blur-sm rounded-full" />
            </div>

            {/* Tassels */}
            <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 flex gap-[2px]">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-[2px] h-4 bg-yellow-600/60 rounded-full"
                        animate={{ rotate: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: delay + i * 0.1 }}
                    />
                ))}
            </div>
        </motion.div>
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
