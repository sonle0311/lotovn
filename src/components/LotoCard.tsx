"use client";

import { motion } from "framer-motion";
import { LotoTicket } from "@/lib/gameLogic";

interface LotoCardProps {
    ticket: LotoTicket;
    drawnNumbers: Set<number>;
    currentNumber: number | null;
    markedNumbers: Set<number>;
    onMark: (num: number, isDrawn: boolean) => void;
}

export default function LotoCard({ ticket, drawnNumbers, currentNumber, markedNumbers, onMark }: LotoCardProps) {
    if (!ticket) return null;

    return (
        <div className="w-full max-w-2xl mx-auto pb-24 px-4 sm:px-0">
            <div
                className="paper-ticket w-full border-[6px] border-black rounded-sm shadow-[15px_15px_0px_rgba(0,0,0,0.2)] relative overflow-hidden"
                style={{ backgroundColor: ticket.color }}
            >
                {/* Vintage Ticket Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none viet-pattern" />

                {/* Main Ticket Header */}
                <div className="relative z-10 flex justify-between items-center py-8 px-10 border-b-[6px] border-black bg-black/5">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black text-black/60 italic uppercase tracking-[0.2em] mb-1">PHƯỜNG LÔ TÔ VIỆT NAM</span>
                        <h2 className="text-4xl font-black text-black uppercase leading-none tracking-tighter">
                            LÔ TÔ <span className="text-red-800">TỔNG HỢP</span>
                        </h2>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[12px] font-black text-black/60 italic mb-1 uppercase tracking-wider">SỐ PHIẾU</span>
                        <span className="text-4xl font-black text-red-800 font-impact tracking-normal drop-shadow-sm">{ticket.id.toUpperCase()}</span>
                    </div>
                </div>

                <div className="p-8 space-y-2 relative z-10">
                    {ticket.frames.map((frame, frameIndex) => (
                        <div
                            key={`${ticket.id}-frame-${frameIndex}`}
                            className="relative"
                        >
                            <div className="bg-white/10 p-1 border-[4px] border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
                                <div className="space-y-1">
                                    {frame.map((row, rowIndex) => (
                                        <div key={rowIndex} className="loto-grid !bg-black/40 !border-0 gap-[3px]">
                                            {row.map((num, colIndex) => {
                                                const isDrawn = num !== null && drawnNumbers.has(num);
                                                const isMarked = num !== null && markedNumbers.has(num);
                                                const isCurrent = num !== null && num === currentNumber;
                                                const isHint = isDrawn && !isMarked;

                                                return (
                                                    <motion.div
                                                        key={`${rowIndex}-${colIndex}`}
                                                        whileHover={num !== null ? { scale: 1.05, zIndex: 10 } : {}}
                                                        onClick={() => num !== null && onMark(num, isDrawn)}
                                                        className={`
                                                            loto-cell relative cursor-pointer font-serif border border-black/10 aspect-square flex items-center justify-center
                                                            ${num === null ? "empty cursor-default opacity-10" : "bg-white"}
                                                            ${isMarked ? "matched !bg-yellow-400" : ""}
                                                            ${isHint ? "active" : ""}
                                                            ${isCurrent ? "!bg-red-600 !text-white z-20 shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-110" : ""}
                                                        `}
                                                    >
                                                        {num !== null ? (
                                                            <span className={`relative z-10 text-3xl font-black italic font-impact tracking-tighter ${isCurrent ? "text-white scale-125" : "text-black"}`}>
                                                                {num < 10 ? `0${num}` : num}
                                                            </span>
                                                        ) : null}

                                                        {/* Traditional Stamp for marked number */}
                                                        {isMarked && !isCurrent && (
                                                            <div className="absolute inset-0 bg-red-600/10 pointer-events-none" />
                                                        )}

                                                        {/* Glow for current number */}
                                                        {isCurrent && (
                                                            <motion.div
                                                                initial={{ opacity: 0.5 }}
                                                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                                                transition={{ repeat: Infinity, duration: 1 }}
                                                                className="absolute inset-0 bg-white/20 pointer-events-none"
                                                            />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="mt-4 py-6 px-10 border-t-[6px] border-black bg-black/5 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-black/70 italic uppercase tracking-wider">CHỨNG NHẬN BỞI PHƯỜNG LÔ TÔ VIỆT NAM</span>
                        <span className="text-[10px] font-bold text-black/50 tracking-widest mt-1">ANTI-GRAVITY PREMIUM LOTO SYSTEM © 2024</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full border-[3px] border-black/40"></div>
                        <div className="w-6 h-6 bg-red-800 rounded-sm border-[3px] border-black shadow-sm transform -rotate-12"></div>
                        <div className="w-6 h-6 rounded-full border-[3px] border-black/40"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
