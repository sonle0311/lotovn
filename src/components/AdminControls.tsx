"use client";

import { Play, Pause, FastForward, Settings, Globe, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { t } from "@/lib/i18n";
import { updateRoomPublic } from "@/lib/game-service";

interface AdminControlsProps {
    onStart: () => void;
    onDraw: (num: number) => void;
    gameStatus: 'waiting' | 'playing' | 'ended';
    drawnNumbers: number[];
    roomId: string;
}

/** Returns a random undrawn number (1-90), or null when all 90 are drawn. */
function pickRandomAvailable(drawnNumbers: number[]): number | null {
    const drawnSet = new Set(drawnNumbers);
    const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(n => !drawnSet.has(n));
    return available.length ? available[Math.floor(Math.random() * available.length)] : null;
}

const SPEED_PRESETS = [
    { label: "Chậm", seconds: 10 },
    { label: "Vừa", seconds: 5 },
    { label: "Nhanh", seconds: 3 },
] as const;

export default function AdminControls({ onStart, onDraw, gameStatus, drawnNumbers, roomId }: AdminControlsProps) {
    const [autoDraw, setAutoDraw] = useState(false);
    const [drawInterval, setDrawInterval] = useState(5);
    const [countdown, setCountdown] = useState(0);
    const [isPublic, setIsPublic] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [savingPublic, setSavingPublic] = useState(false);

    useEffect(() => {
        if (autoDraw && gameStatus === 'playing') {
            if (countdown <= 0) {
                const next = pickRandomAvailable(drawnNumbers);
                if (next !== null) {
                    onDraw(next);
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

    const handleTogglePublic = useCallback(async () => {
        const newVal = !isPublic;
        setIsPublic(newVal);
        setSavingPublic(true);
        await updateRoomPublic(roomId, newVal, displayName || undefined);
        setSavingPublic(false);
    }, [isPublic, roomId, displayName]);

    const handleSaveRoomName = useCallback(async () => {
        if (!displayName.trim()) return;
        setSavingPublic(true);
        await updateRoomPublic(roomId, isPublic, displayName.trim());
        setSavingPublic(false);
    }, [roomId, isPublic, displayName]);

    return (
        <div className="glass-card p-4 sm:p-6 border-yellow-500/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <Settings size={64} />
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-4 sm:mb-6 flex items-center gap-2">
                <CrownIcon /> {t('admin.host_panel')}
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {gameStatus === 'waiting' ? (
                    <button
                        onClick={onStart}
                        className="col-span-2 btn-primary py-4"
                    >
                        <Play size={20} fill="currentColor" /> {t('game.start')}
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
                                {autoDraw ? `${t('admin.auto')} (${countdown}s)` : t('admin.auto_draw')}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const next = pickRandomAvailable(drawnNumbers);
                                if (next !== null) onDraw(next);
                            }}
                            disabled={gameStatus === 'ended'}
                            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all btn-tactile disabled:opacity-50"
                            aria-label="Xổ số ngẫu nhiên thủ công"
                        >
                            <FastForward size={20} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase mt-2">{t('admin.manual_draw')}</span>
                        </button>
                    </>
                )}
            </div>

            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t('admin.draw_speed')}</span>
                    <span className="text-[10px] font-black text-yellow-500">{drawInterval} {t('admin.sec_per_num')}</span>
                </div>
                <div className="flex gap-1.5 mb-2">
                    {SPEED_PRESETS.map(p => (
                        <button
                            key={p.seconds}
                            onClick={() => setDrawInterval(p.seconds)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all btn-tactile
                                ${drawInterval === p.seconds
                                    ? "bg-yellow-500 text-red-950 shadow-[0_2px_0_#92400e]"
                                    : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"}`}
                        >
                            {p.label}
                        </button>
                    ))}
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

            {/* Room Settings — Public toggle + Display name */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{t('admin.room_settings')}</span>

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        {isPublic ? <Globe size={14} className="text-green-400" /> : <Lock size={14} className="text-white/40" />}
                        <span className="text-xs font-bold text-white/70">{t('admin.public_toggle')}</span>
                    </div>
                    <button
                        onClick={handleTogglePublic}
                        disabled={savingPublic}
                        className="relative"
                        aria-label="Toggle public"
                    >
                        <div className={`w-10 h-5 rounded-full transition-colors duration-200 border ${isPublic ? "bg-green-500 border-green-400" : "bg-white/10 border-white/10"}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${isPublic ? "left-[22px]" : "left-0.5"}`} />
                        </div>
                    </button>
                </div>

                {isPublic && (
                    <div className="mt-3 flex gap-2">
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={t('admin.room_name_placeholder')}
                            maxLength={30}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                        />
                        <button
                            onClick={handleSaveRoomName}
                            disabled={savingPublic || !displayName.trim()}
                            className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 text-xs font-bold disabled:opacity-30"
                        >
                            {t('admin.save')}
                        </button>
                    </div>
                )}
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
