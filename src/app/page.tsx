"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Play, Users, Trophy } from "lucide-react";
import { motion } from "framer-motion";

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
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-24 overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 viet-pattern pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md text-center"
      >
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl mb-4 border-4 border-red-800"
          >
            <Trophy className="w-16 h-16 text-red-900" />
          </motion.div>
          <h1 className="text-6xl font-black text-yellow-500 drop-shadow-lg tracking-widest mb-2 font-serif">
            LÔ TÔ TẾT
          </h1>
          <p className="text-yellow-200/80 font-medium tracking-[0.2em] text-sm uppercase">
            Hội Vui Truyền Thống - Kết Nối Bạn Bè
          </p>
        </div>

        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-yellow-500/80">Tên Của Bạn</label>
              <input
                type="text"
                placeholder="Nhập tên..."
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError("");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-white placeholder:text-white/20"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-yellow-500/80">Mã Phòng</label>
              <input
                type="text"
                placeholder="Nhập mã phòng để tham gia..."
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  setError("");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all text-white placeholder:text-white/20"
              />
            </div>

            {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="submit"
                className="btn-primary"
              >
                <Users className="w-5 h-5" />
                Vào Phòng
              </button>

              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">HOẶC</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleCreate}
                className="btn-secondary"
              >
                <Play className="w-5 h-5" />
                Tạo Phòng Mới
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-white/40">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold">Free</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold">Realtime</span>
          </div>
        </div>
      </motion.div>

      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-red-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-500/10 blur-3xl rounded-full" />
    </main>
  );
}
