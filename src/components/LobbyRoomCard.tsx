"use client";

import { Users, Play } from "lucide-react";
import { motion } from "framer-motion";
import { GAME_MODE_LABELS, type GameMode } from "@/lib/gameLogic";
import { t } from "@/lib/i18n";

export const MAX_ROOM_PLAYERS = 8;

export interface PublicRoom {
    room_id: string;
    host_name: string;
    display_name: string | null;
    player_count: number;
    game_mode: string;
    created_at: string;
}

interface LobbyRoomCardProps {
    room: PublicRoom;
    index: number;
    canJoin: boolean;
    onJoin: (roomId: string) => void;
}

export default function LobbyRoomCard({ room, index, canJoin, onJoin }: LobbyRoomCardProps) {
    const full = room.player_count >= MAX_ROOM_PLAYERS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card border-white/5 p-4 flex items-center justify-between gap-4 ${full ? "opacity-60" : ""}`}
        >
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                    {room.display_name || `${t('room.title_prefix')} ${room.room_id}`}
                </p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-white/40">
                        {t('player.host')}: {room.host_name}
                    </span>
                    <span className="text-[10px] text-yellow-500/60">
                        {GAME_MODE_LABELS[(room.game_mode || 'row') as GameMode] || room.game_mode}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] ${full ? "text-red-400" : "text-white/40"}`}>
                        <Users size={10} />
                        {room.player_count}/{MAX_ROOM_PLAYERS}
                    </span>
                </div>
            </div>
            <button
                onClick={() => onJoin(room.room_id)}
                disabled={!canJoin || full}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 ${full
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/20 text-red-950"
                    }`}
            >
                <Play size={14} />
                {full ? t('room.full') : t('lobby.join')}
            </button>
        </motion.div>
    );
}
