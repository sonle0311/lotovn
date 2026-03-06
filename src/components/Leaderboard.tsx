"use client";

import { memo, useEffect, useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { getRoomLeaderboard, type LeaderboardEntry } from "@/lib/game-service";
import { t } from "@/lib/i18n";

interface LeaderboardProps {
    roomId: string;
}

const Leaderboard = memo(function Leaderboard({ roomId }: LeaderboardProps) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRoomLeaderboard(roomId)
            .then(setEntries)
            .finally(() => setLoading(false));
    }, [roomId]);

    if (loading) {
        return (
            <div className="glass-card p-4 border-white/5">
                <p className="text-xs text-white/40 text-center animate-pulse">Đang tải...</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="glass-card p-4 border-white/5 text-center">
                <Trophy size={24} className="mx-auto mb-2 text-yellow-500/40" />
                <p className="text-xs text-white/40">Chưa có kết quả nào</p>
            </div>
        );
    }

    return (
        <div className="glass-card border-white/5 overflow-hidden">
            <div className="bg-white/5 p-2 sm:p-3 flex items-center gap-2 border-b border-white/10">
                <Trophy size={16} className="text-yellow-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">{t('leaderboard.title')}</h3>
            </div>
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {entries.map((entry, i) => (
                    <div
                        key={entry.winner_name}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${i === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
                            i === 1 ? "bg-white/5 border border-white/5" :
                                i === 2 ? "bg-orange-500/5 border border-orange-500/10" :
                                    "border border-transparent"
                            }`}
                    >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? "bg-yellow-500 text-red-950" :
                            i === 1 ? "bg-gray-300 text-gray-700" :
                                i === 2 ? "bg-orange-400 text-orange-900" :
                                    "bg-white/10 text-white/40"
                            }`}>
                            {i + 1}
                        </span>
                        <span className="flex-1 text-xs font-bold text-white/80 truncate">{entry.winner_name}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                            <TrendingUp size={12} />
                            {entry.total_wins}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default Leaderboard;
