"use client";

import { Play, Pause, RotateCcw, FastForward, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface AdminControlsProps {
    onStart: () => void;
    onDraw: (num: number) => void;
    onReset: () => void;
    gameStatus: 'waiting' | 'playing' | 'ended';
    drawnNumbers: number[];
}

export default function AdminControls({ onStart, onDraw, onReset, gameStatus, drawnNumbers }: AdminControlsProps) {
    const [autoDraw, setAutoDraw] = useState(false);
    const [drawInterval, setDrawInterval] = useState(5); // seconds
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (autoDraw && gameStatus === 'playing') {
            if (countdown <= 0) {
                const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
                const available = allNumbers.filter(n => !drawnNumbers.includes(n));

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

    // Independent effect to reset countdown if drawnNumbers changes while autoDraw is on
    // This handles manual draws during auto-draw mode
    useEffect(() => {
        if (autoDraw && drawnNumbers.length > 0) {
            // Optional: reset countdown when a number is drawn to keep intervals consistent
            // setCountdown(drawInterval);
        }
    }, [drawnNumbers.length, autoDraw]);

    const handleToggleAuto = () => {
        if (!autoDraw) {
            setCountdown(drawInterval);
        }
        setAutoDraw(!autoDraw);
    };

    return (
        <div className="glass-card p-6 border-yellow-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Settings size={48} />
            </div>

            <h3 className="text-sm font-black uppercase tracking-widest text-yellow-500 mb-6 flex items-center gap-2">
                <CrownIcon /> Bảng Điều Khiển Host
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {gameStatus === 'waiting' ? (
                    <button
                        onClick={onStart}
                        className="col-span-2 btn-primary py-4"
                    >
                        <Play size={20} /> BẮT ĐẦU GAME
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleToggleAuto}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${autoDraw
                                ? "bg-yellow-500 text-red-900 border-yellow-400"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                }`}
                        >
                            {autoDraw ? <Pause size={24} /> : <Play size={24} />}
                            <span className="text-[10px] font-black uppercase mt-2">
                                {autoDraw ? `Tự động (${countdown}s)` : "Tự động xổ"}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
                                const available = allNumbers.filter(n => !drawnNumbers.includes(n));
                                if (available.length > 0) {
                                    onDraw(available[Math.floor(Math.random() * available.length)]);
                                }
                            }}
                            disabled={gameStatus === 'ended'}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            <FastForward size={24} />
                            <span className="text-[10px] font-black uppercase mt-2">Xổ thủ công</span>
                        </button>
                    </>
                )}

                <button
                    onClick={() => {
                        setAutoDraw(false);
                        onReset();
                    }}
                    className="col-span-2 mt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                    <RotateCcw size={12} /> Làm mới game (Reset)
                </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tốc độ xổ</span>
                    <span className="text-xs font-bold text-yellow-500">{drawInterval} giây / số</span>
                </div>
                <input
                    type="range"
                    min="3"
                    max="15"
                    value={drawInterval}
                    onChange={(e) => setDrawInterval(parseInt(e.target.value))}
                    className="w-full accent-yellow-500"
                />
            </div>
        </div>
    );
}

function CrownIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    );
}
