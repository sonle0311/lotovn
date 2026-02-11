"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Play, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import TetBackground from "@/components/TetBackground";

export default function LandingPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (!roomId.trim()) {
      setError("Vui lòng nhập mã phòng");
      return;
    }
    router.push(`/room/${roomId}?name=${encodeURIComponent(playerName.trim())}`);
  };

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(playerName.trim())}&host=true`);
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center p-4 sm:p-8 overflow-hidden bg-red-950">
      <TetBackground />

      {/* Floating Decorative Elements - Refined */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 sm:top-20 sm:right-20 pointer-events-none z-10"
      >
        <div className="w-12 h-16 sm:w-20 sm:h-28 bg-red-600 rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.5)] border-2 border-yellow-500/50 flex flex-col items-center justify-center relative backdrop-blur-sm">
          <div className="w-[2px] h-12 bg-linear-to-b from-transparent to-yellow-500/50 absolute -top-12" />
          <span className="text-yellow-500 font-black text-2xl sm:text-4xl italic drop-shadow-lg">Tết</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-20 left-10 sm:bottom-40 sm:left-20 pointer-events-none opacity-40"
      >
        <div className="w-10 h-10 sm:w-16 sm:h-16 border-4 border-yellow-500 rounded-full flex items-center justify-center rotate-45">
          <div className="w-full h-1 bg-yellow-500" />
          <div className="w-1 h-full bg-yellow-500 absolute" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="z-10 w-full max-w-md text-center"
      >
        <div className="mb-6 sm:mb-10 flex flex-col items-center relative z-10">
          <motion.div
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 sm:w-28 sm:h-28 bg-linear-to-b from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] mb-6 border-4 border-red-950 p-1.5"
          >
            <div className="w-full h-full rounded-full border border-red-950/20 flex items-center justify-center bg-red-800">
              <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-yellow-500 drop-shadow-lg" />
            </div>
          </motion.div>

          <div className="space-y-1">
            <h1 className="text-5xl sm:text-7xl font-black text-yellow-500 drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)] tracking-tighter italic mb-1 uppercase">
              LÔ TÔ <span className="text-white drop-shadow-none">TẾT</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-yellow-500/30" />
              <p className="text-yellow-200/50 font-black tracking-[0.4em] text-[9px] sm:text-xs uppercase">
                Hội Vui Truyền Thống…
              </p>
              <div className="h-px w-10 bg-yellow-500/30" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-10 relative border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60 ml-1">Định danh của bạn</label>
              <input
                type="text"
                placeholder="Nhập tên nghệ danh..."
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError("");
                }}
                spellCheck={false}
                autoComplete="off"
                inputMode="text"
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all text-white placeholder:text-white/20 font-bold"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60 ml-1">Mã Hội (Room ID)</label>
              <input
                type="text"
                placeholder="Nhập mã phòng bí mật..."
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  setError("");
                }}
                spellCheck={false}
                autoComplete="off"
                inputMode="text"
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all text-white placeholder:text-white/20 font-bold tracking-widest"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-xs font-black uppercase tracking-wider"
              >
                {error}
              </motion.p>
            )}

            <div className="grid grid-cols-1 gap-4 pt-2">
              <button
                type="submit"
                className="btn-primary group"
              >
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                VÀO HỘI NGAY
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">HOẶC</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <button
                type="button"
                onClick={handleCreate}
                className="btn-secondary group"
              >
                <div className="relative group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Play className="w-5 h-5 relative z-10" fill="currentColor" />
                </div>
                TẠO HỘI MỚI
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white/20">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span className="text-[9px] uppercase tracking-[0.2em] font-black">Chơi Cùng Bạn Bè</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee size={14} />
            <span className="text-[9px] uppercase tracking-[0.2em] font-black">Cảm Hứng Tết Việt</span>
          </div>
        </div>
      </motion.div>

      {/* Footer credit */}
      <footer className="absolute bottom-6 text-[8px] font-black text-white/10 uppercase tracking-[0.5em] pointer-events-none">
        Premium Loto • Tet 2026 Edition
      </footer>
    </main>
  );
}
