"use client";

import { memo } from "react";
import { Users, Crown, Circle } from "lucide-react";
import { Player } from "@/lib/useGameRoom";

interface PlayerListProps {
    players: Player[];
}

const PlayerList = memo(function PlayerList({ players }: PlayerListProps) {
    return (
        <div className="glass-card flex flex-col h-full border-white/5 overflow-hidden min-h-[300px]">
            <div className="bg-white/5 p-3 sm:p-4 flex items-center gap-2 border-b border-white/10">
                <Users size={16} className="text-yellow-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">Hội Viên ({players.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-red-600 to-red-900 border border-white/20 flex items-center justify-center font-black text-xs uppercase shadow-lg text-white">
                                    {player.name[0]}
                                </div>
                                {player.isHost && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full p-1 shadow-xl ring-2 ring-red-950">
                                        <Crown size={8} className="text-red-950 fill-current" />
                                    </div>
                                )}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-tight ${player.status === 'won' ? 'text-yellow-500' : 'text-white/80'}`}>
                                {player.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${player.status === 'won' ? 'bg-yellow-500/20 text-yellow-500' :
                                player.status === 'playing' ? 'bg-green-500/20 text-green-500' :
                                    'bg-white/10 text-white/40'
                                }`}>
                                {player.status === 'won' ? 'KINH!' :
                                    player.status === 'playing' ? 'Đang chơi' : 'Chờ...'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default PlayerList;
