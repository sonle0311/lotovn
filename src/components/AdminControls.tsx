"use client";

import { Play, Pause, RotateCcw, FastForward, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AdminControlsProps {
    onStart: () => void;
    onDraw: (num: number) => void;
    onReset: (keepTicket?: boolean) => void;
    gameStatus: 'waiting' | 'playing' | 'ended';
    drawnNumbers: number[];
}

export default function AdminControls({ onStart, onDraw, onReset, gameStatus, drawnNumbers }: AdminControlsProps) {
    const [autoDraw, setAutoDraw] = useState(false);
    const [drawInterval, setDrawInterval] = useState(5); // seconds
    const [countdown, setCountdown] = useState(0);
    const [keepTicket, setKeepTicket] = useState(false);

    useEffect(() => {
        if (autoDraw && gameStatus === 'playing') {
            if (countdown <= 0) {
                const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
                const drawnSet = new Set(drawnNumbers);
                const available = allNumbers.filter(n => !drawnSet.has(n));

                if (available.length > 0) {
                    const randomIndex = Math.floor(Math.random() * available.length);
                    onDraw(available[randomIndex]);
                    setCountdown(drawInterval);
                } else {
                    setAutoDraw(false);
                }
            } else {
                const timer = setTimeout(() => {
                    setCountdown(prev => prev - 1);
                }, 1000);
                return () => clearTimeout(timer);
            }
        } else if (countdown !== 0) {
            setCountdown(0);
        }
    }, [autoDraw, countdown, gameStatus, drawInterval, onDraw, drawnNumbers]);

    const handleToggleAuto = () => {
        if (!autoDraw) {
            setCountdown(drawInterval);
        }
        setAutoDraw(!autoDraw);
    };

    return (
        <div className="glass-card p-4 sm:p-6 border-yellow-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <Settings size={64} />
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-4 sm:mb-6 flex items-center gap-2">
                <CrownIcon /> Bảng Điều Khiển Host…
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {gameStatus === 'waiting' ? (
                    <button
                        onClick={onStart}
                        className="col-span-2 btn-primary py-4"
                    >
                        <Play size={20} fill="currentColor" /> BẮT ĐẦU GAME
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleToggleAuto}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all btn-tactile ${autoDraw
                                ? "bg-yellow-500 text-red-950 border-yellow-400 shadow-[0_4px_0_#92400e]"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                }`}
                            aria-label={autoDraw ? "Dừng tự động xổ" : "Bắt đầu tự động xổ"}
                        >
                            {autoDraw ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            <span className="text-[9px] font-black uppercase mt-2">
                                {autoDraw ? `Tự động (${countdown}s)` : "Tự động xổ"}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
                                const drawnSet = new Set(drawnNumbers);
                                const available = allNumbers.filter(n => !drawnSet.has(n));
                                if (available.length > 0) {
                                    onDraw(available[Math.floor(Math.random() * available.length)]);
                                }
                            }}
                            disabled={gameStatus === 'ended'}
                            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all btn-tactile disabled:opacity-50"
                            aria-label="Xổ số ngẫu nhiên thủ công"
                        >
                            <FastForward size={20} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase mt-2">Xổ thủ công</span>
                        </button>
                    </>
                )}

                <div className="col-span-2 mt-2 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            setAutoDraw(false);
                            onReset(keepTicket);
                        }}
                        className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                    >
                        <RotateCcw size={12} /> Làm mới game (Reset)
                    </button>
                    <label className="flex items-center gap-2 text-[9px] font-bold text-white/50 hover:text-white/70 transition-colors cursor-pointer justify-center">
                        <input
                            type="checkbox"
                            checked={keepTicket}
                            onChange={(e) => setKeepTicket(e.target.checked)}
                            className="w-3 h-3 accent-yellow-500 cursor-pointer"
                        />
                        <span>Giữ vé cũ (chơi tiếp)</span>
                    </label>
                </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Tốc độ xổ</span>
                    <span className="text-[10px] font-black text-yellow-500">{drawInterval} giây / số</span>
                </div>
                <input
                    type="range"
                    min="3"
                    max="15"
                    value={drawInterval}
                    onChange={(e) => setDrawInterval(parseInt(e.target.value))}
                    className="w-full accent-yellow-500 cursor-pointer"
                />
            </div>
        </div>
    );
}

function CrownIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    );
}
