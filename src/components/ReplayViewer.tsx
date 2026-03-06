"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { History, Play, Pause, SkipForward, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface GameHistoryEntry {
    id: string;
    room_id: string;
    drawn_numbers: number[];
    winner_name: string | null;
    game_mode: string;
    duration_seconds: number | null;
    played_at: string;
}

interface ReplayViewerProps {
    history: GameHistoryEntry[];
}

const ReplayViewer = memo(function ReplayViewer({ history }: ReplayViewerProps) {
    const [selectedGame, setSelectedGame] = useState<GameHistoryEntry | null>(null);
    const [replayIndex, setReplayIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const reset = useCallback(() => {
        setReplayIndex(0);
        setIsPlaying(false);
    }, []);

    useEffect(() => {
        if (!isPlaying || !selectedGame) return;
        if (replayIndex >= selectedGame.drawn_numbers.length) {
            setIsPlaying(false);
            return;
        }
        const timer = setTimeout(() => setReplayIndex(p => p + 1), 800);
        return () => clearTimeout(timer);
    }, [isPlaying, replayIndex, selectedGame]);

    if (history.length === 0) {
        return (
            <div className="glass-card p-4 border-white/5 text-center">
                <History size={24} className="mx-auto mb-2 text-white/20" />
                <p className="text-xs text-white/40">Chưa có lịch sử</p>
            </div>
        );
    }

    if (selectedGame) {
        const visibleNumbers = selectedGame.drawn_numbers.slice(0, replayIndex);
        return (
            <div className="glass-card border-white/5 overflow-hidden">
                <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-yellow-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">
                            Replay {replayIndex}/{selectedGame.drawn_numbers.length}
                        </span>
                    </div>
                    <button onClick={() => { setSelectedGame(null); reset(); }}
                        className="text-xs text-white/40 hover:text-white">
                        ✕ Đóng
                    </button>
                </div>
                <div className="p-3">
                    {/* Controls */}
                    <div className="flex gap-2 mb-3 justify-center">
                        <button onClick={() => setIsPlaying(!isPlaying)}
                            className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 text-xs font-bold flex items-center gap-1">
                            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                            {isPlaying ? "Dừng" : "Phát"}
                        </button>
                        <button onClick={() => setReplayIndex(p => Math.min(p + 1, selectedGame.drawn_numbers.length))}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold flex items-center gap-1">
                            <SkipForward size={12} /> Tiến
                        </button>
                        <button onClick={reset}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-bold">
                            Reset
                        </button>
                    </div>
                    {/* Number grid */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {visibleNumbers.map((num, i) => (
                            <motion.span
                                key={`${num}-${i}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${i === visibleNumbers.length - 1
                                    ? "bg-yellow-500 text-red-950 border-yellow-400"
                                    : "bg-white/5 text-white/60 border-white/10"
                                    }`}
                            >
                                {num < 10 ? `0${num}` : num}
                            </motion.span>
                        ))}
                    </div>
                    {replayIndex >= selectedGame.drawn_numbers.length && selectedGame.winner_name && (
                        <p className="text-center text-sm font-bold text-yellow-400 mt-3">
                            🏆 Người thắng: {selectedGame.winner_name}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card border-white/5 overflow-hidden">
            <div className="bg-white/5 p-2 sm:p-3 flex items-center gap-2 border-b border-white/10">
                <History size={16} className="text-yellow-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">Lịch Sử</h3>
            </div>
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {history.map((game, i) => (
                    <button
                        key={game.id}
                        onClick={() => { setSelectedGame(game); reset(); }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                    >
                        <div>
                            <p className="text-xs font-bold text-white/70">
                                Ván {history.length - i}
                                {game.winner_name && <span className="text-yellow-500 ml-1.5">🏆 {game.winner_name}</span>}
                            </p>
                            <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                {game.drawn_numbers.length} số đã rút
                            </p>
                        </div>
                        <Play size={14} className="text-white/30" />
                    </button>
                ))}
            </div>
        </div>
    );
});

export default ReplayViewer;
export type { GameHistoryEntry };
