"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublicRooms } from "@/lib/game-service";
import { GAME_MODE_LABELS, type GameMode } from "@/lib/gameLogic";
import { Users, Play, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";
import { t, getLocale } from "@/lib/i18n";

interface PublicRoom {
    room_id: string;
    host_name: string;
    display_name: string | null;
    player_count: number;
    game_mode: string;
    created_at: string;
}

export default function LobbyPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<PublicRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [playerName, setPlayerName] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => { getLocale(); }, []);

    const fetchRooms = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await getPublicRooms();
            setRooms(data as PublicRoom[]);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRooms(); }, []);

    const joinRoom = (roomId: string) => {
        const cleanName = playerName.replace(/['"`;\\<>{}]/g, '').trim().slice(0, 20);
        if (!cleanName) return;
        router.push(`/room/${roomId}?name=${encodeURIComponent(cleanName)}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-yellow-900 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-yellow-400">🏠 {t('lobby.title')}</h1>
                        <p className="text-xs text-white/40">{t('landing.public_rooms')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchRooms}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                        >
                            <Home size={16} />
                        </button>
                    </div>
                </div>

                {/* Name input */}
                <div className="glass-card p-4 border-white/5 mb-4">
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder={t('landing.name_placeholder')}
                        maxLength={20}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                </div>

                {/* Room list */}
                <div className="space-y-3">
                    {loading && (
                        <div className="glass-card p-8 border-white/5 text-center">
                            <p className="text-sm text-white/40 animate-pulse">{t('game.waiting')}...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="glass-card p-8 border-white/5 text-center">
                            <p className="text-sm text-red-400">Failed to load rooms</p>
                            <button onClick={fetchRooms} className="mt-2 text-xs text-yellow-500 underline">Retry</button>
                        </div>
                    )}

                    {!loading && !error && rooms.length === 0 && (
                        <div className="glass-card p-8 border-white/5 text-center">
                            <Users size={32} className="mx-auto mb-3 text-white/20" />
                            <p className="text-sm text-white/40">{t('lobby.empty')}</p>
                        </div>
                    )}

                    {rooms.map((room, i) => (
                        <motion.div
                            key={room.room_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card border-white/5 p-4 flex items-center justify-between gap-4"
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
                                    <span className="flex items-center gap-1 text-[10px] text-white/40">
                                        <Users size={10} />
                                        {room.player_count}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => joinRoom(room.room_id)}
                                disabled={!playerName.trim()}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/10 disabled:text-white/20 text-red-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                            >
                                <Play size={14} />
                                {t('lobby.join')}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
