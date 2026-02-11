"use client";

import { Users, Crown, Circle } from "lucide-react";
import { Player } from "@/lib/useGameRoom";

interface PlayerListProps {
    players: Player[];
}

export default function PlayerList({ players }: PlayerListProps) {
    return (
        <div className="glass-card flex flex-col h-full border-white/5 overflow-hidden">
            <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/10">
                <Users size={16} className="text-yellow-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500/80">Người chơi ({players.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {players.map((player) => (
                    <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-white/20 flex items-center justify-center font-bold text-xs uppercase">
                                    {player.name[0]}
                                </div>
                                {player.isHost && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-lg">
                                        <Crown size={8} className="text-red-900" />
                                    </div>
                                )}
                            </div>
                            <span className={`text-sm font-medium ${player.status === 'won' ? 'text-yellow-500' : 'text-white/80'}`}>
                                {player.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Circle size={8} className={`fill-current ${player.status === 'won' ? 'text-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                    player.status === 'playing' ? 'text-green-500' : 'text-white/20'
                                }`} />
                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">
                                {player.status === 'won' ? 'THẮNG' :
                                    player.status === 'playing' ? 'ĐANG CHƠI' : 'CHỜ'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
