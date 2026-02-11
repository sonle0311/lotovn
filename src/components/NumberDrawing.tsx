"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatNumberVietnamese } from "@/lib/gameLogic";
import { Volume2, VolumeX } from "lucide-react";
import { useState, memo, useMemo } from "react";

interface NumberDrawingProps {
    currentNumber: number | null;
    drawnNumbers: number[];
}

const NumberDrawing = memo(function NumberDrawing({ currentNumber, drawnNumbers }: NumberDrawingProps) {
    const [isMuted, setIsMuted] = useState(false);
    const reversedNumbers = useMemo(() => [...drawnNumbers].reverse(), [drawnNumbers]);

    return (
        <div className="glass-card p-3 sm:p-6 flex flex-col items-center justify-center min-h-[180px] sm:min-h-[300px] border-yellow-500/30 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="flex justify-between w-full mb-2 sm:mb-4 px-2 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60">Đang xổ số</h3>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white/20 hover:text-white transition-colors"
                    aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
            </div>

            <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-4 sm:mb-6 z-10">
                <div className="absolute inset-0 border-4 sm:border-8 border-yellow-600 rounded-full flex items-center justify-center bg-red-950 shadow-2xl relative overflow-hidden">
                    {/* Inner texture */}
                    <div className="absolute inset-0 viet-pattern opacity-10 pointer-events-none" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentNumber}
                            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 1.5, opacity: 0, rotate: 45 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="text-5xl sm:text-7xl font-black text-yellow-500 font-serif drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                        >
                            <span className="font-variant-numeric-tabular-nums">
                                {currentNumber !== null ? (currentNumber < 10 ? `0${currentNumber}` : currentNumber) : "--"}
                            </span>
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
                        className="text-lg sm:text-xl font-black text-yellow-400 text-center italic mb-4 sm:mb-6 drop-shadow-md z-10"
                    >
                        "{formatNumberVietnamese(currentNumber).split(' – ')[0]}"
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Gần đây</span>
                    <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center max-h-20 overflow-y-auto pr-1 custom-scrollbar">
                    {reversedNumbers.map((num, i) => (
                        <motion.div
                            key={`${num}-${i}`}
                            initial={i === 0 ? { scale: 0, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`
                                w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-[10px] sm:text-xs font-black
                                ${i === 0
                                    ? "bg-yellow-500 border-white text-red-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] z-10"
                                    : "bg-white/5 border-white/10 text-white/40"}
                            `}
                        >
                            <span className="font-variant-numeric-tabular-nums">
                                {num < 10 ? `0${num}` : num}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default NumberDrawing;
