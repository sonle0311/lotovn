"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { LotoTicket } from "@/lib/gameLogic";

interface LotoCardProps {
    ticket: LotoTicket;
    drawnNumbers: Set<number>;
    currentNumber: number | null;
    markedNumbers: Set<number>;
    onMark: (num: number, isDrawn: boolean) => void;
}

interface LotoCellProps {
    num: number | null;
    isDrawn: boolean;
    isMarked: boolean;
    isCurrent: boolean;
    onMark: (num: number, isDrawn: boolean) => void;
}

const LotoCell = memo(function LotoCell({ num, isDrawn, isMarked, isCurrent, onMark }: LotoCellProps) {
    if (num === null) return <div className="loto-cell empty" />;

    return (
        <motion.div
            whileTap={{ scale: 0.9, rotate: -2 }}
            onClick={() => onMark(num, isDrawn)}
            className={`
                loto-cell cursor-pointer
                ${isMarked ? "matched" : ""}
                ${isCurrent ? "active" : ""}
            `}
        >
            <span className={`relative z-10 font-black italic font-impact tracking-tighter font-variant-numeric-tabular-nums ${isCurrent ? "text-white" : "text-black"}`}>
                {num < 10 ? `0${num}` : num}
                {/* Marking hint for drawn but not marked */}
                {isDrawn && !isMarked && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />
                )}
            </span>
            {isMarked && <div className="matched-symbol" />}
        </motion.div>
    );
});

const LotoCard = memo(function LotoCard({ ticket, drawnNumbers, currentNumber, markedNumbers, onMark }: LotoCardProps) {
    if (!ticket) return null;

    return (
        <div className="w-full max-w-xl mx-auto px-1 sm:px-4">
            <div
                className="paper-ticket w-full border-[2px] sm:border-[4px] border-black rounded-xl sm:rounded-2xl shadow-2xl relative overflow-hidden transition-all"
                style={{ backgroundColor: ticket.color }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 blur-3xl pointer-events-none" />

                {/* Main Ticket Header */}
                <div className="relative z-10 flex justify-between items-center py-2 sm:py-3 px-3 sm:px-4 border-b-[2px] sm:border-b-[3px] border-black/80 bg-black/5">
                    <div className="flex flex-col">
                        <span className="text-[8px] sm:text-[10px] font-black text-black/60 uppercase tracking-[0.2em] mb-0.5 sm:mb-1">PREMIUM LOTO VIỆT NAM</span>
                        <h2 className="text-xl sm:text-3xl font-black text-black uppercase leading-none tracking-tighter">
                            LÔ TÔ <span className="text-red-800">TẾT</span>
                        </h2>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] sm:text-[10px] font-black text-black/60 mb-0.5 uppercase tracking-wider">MÃ PHIẾU</span>
                        <span className="text-xl sm:text-3xl font-black text-red-800 font-impact tracking-normal drop-shadow-sm">{ticket.id.toUpperCase()}</span>
                    </div>
                </div>

                <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 relative z-10">
                    {ticket.frames.map((frame, frameIndex) => (
                        <div
                            key={`${ticket.id}-frame-${frameIndex}`}
                            className="bg-black/5 p-1 sm:p-2 rounded-lg sm:rounded-xl border-2 border-black/20"
                        >
                            <div className="space-y-1">
                                {frame.map((row, rowIndex) => (
                                    <div key={rowIndex} className="loto-grid">
                                        {row.map((num, colIndex) => (
                                            <LotoCell
                                                key={`${rowIndex}-${colIndex}`}
                                                num={num}
                                                isDrawn={num !== null && drawnNumbers.has(num)}
                                                isMarked={num !== null && markedNumbers.has(num)}
                                                isCurrent={num !== null && num === currentNumber && !markedNumbers.has(num)}
                                                onMark={onMark}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="py-2 sm:py-3 px-3 sm:px-4 border-t-[2px] sm:border-t-[3px] border-black/80 bg-black/5 flex justify-between items-center relative z-10">
                    <span className="text-[7px] sm:text-[9px] font-black text-black/40 uppercase tracking-widest font-mono">ID: {ticket.id} • LotoTet Premium</span>
                    <div className="flex gap-2 sm:gap-4 grayscale opacity-40">
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full border-2 border-black"></div>
                        <div className="w-3 h-3 sm:w-5 sm:h-5 bg-red-800 rounded-sm border-2 border-black rotate-12"></div>
                        <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full border-2 border-black"></div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default LotoCard;
