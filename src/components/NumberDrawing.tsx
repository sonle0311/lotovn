"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatNumberVietnamese } from "@/lib/gameLogic";
import { Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface NumberDrawingProps {
    currentNumber: number | null;
    drawnNumbers: number[];
}

export default function NumberDrawing({ currentNumber, drawnNumbers }: NumberDrawingProps) {
    const [isMuted, setIsMuted] = useState(false);

    return (
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[300px] border-yellow-500/30">
            <div className="flex justify-between w-full mb-4 px-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500/60">Đang xổ số</h3>
                <button onClick={() => setIsMuted(!isMuted)} className="text-white/20 hover:text-white transition-colors">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
            </div>

            <div className="relative w-48 h-48 mb-6">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl animate-pulse rounded-full" />

                <div className="absolute inset-0 border-8 border-yellow-600 rounded-full flex items-center justify-center bg-red-950 shadow-inner">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentNumber}
                            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 1.5, opacity: 0, rotate: 180 }}
                            className="text-7xl font-black text-yellow-500 font-serif"
                        >
                            {currentNumber !== null ? (currentNumber < 10 ? `0${currentNumber}` : currentNumber) : "--"}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {currentNumber !== null && (
                    <motion.div
                        key={currentNumber}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-yellow-200 text-center italic mb-8"
                    >
                        "{formatNumberVietnamese(currentNumber).split(' – ')[0]}"
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lịch sử</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                    {drawnNumbers.slice().reverse().map((num, i) => (
                        <motion.div
                            key={`${num}-${i}`}
                            initial={i === 0 ? { scale: 0, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`
                                w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold
                                ${i === 0
                                    ? "bg-yellow-500 border-white text-red-900 shadow-[0_0_10px_rgba(245,158,11,0.5)] z-10"
                                    : "bg-white/10 border-white/10 text-white/60"}
                            `}
                        >
                            {num < 10 ? `0${num}` : num}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
