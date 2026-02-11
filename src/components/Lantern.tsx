"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LanternProps {
    position: { top?: string; left?: string; right?: string; bottom?: string };
    size: number;
    delay: number;
}

export default function Lantern({ position, size, delay }: LanternProps) {
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
            <div className="w-full h-full bg-linear-to-b from-red-600 to-red-800 rounded-[40%_40%_45%_45%] border border-yellow-500/30 relative shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                {/* Horizontal Ribs */}
                <div className="absolute top-[20%] left-0 w-full h-[1px] bg-yellow-500/20" />
                <div className="absolute top-[50%] left-0 w-full h-[1px] bg-yellow-500/20" />
                <div className="absolute top-[80%] left-0 w-full h-[1px] bg-yellow-500/20" />

                {/* Vertical Glow */}
                <div className="absolute left-1/2 top-0 w-[40%] h-full -translate-x-1/2 bg-white/10 blur-sm rounded-full" />
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
