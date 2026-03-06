"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/room-service";
import { Play, Users, Star, Globe } from "lucide-react";
import { motion } from "framer-motion";
import LandingBackground from "@/components/LandingBackground";
import ShopeeAffiliateCTA from "@/components/ShopeeAffiliateCTA";
import { AdsterraBanner } from "@/components/AdsterraBanner";
import WalletBadge from "@/components/WalletBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLocale } from "@/lib/i18n";

export default function LandingPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // SSR-safe: force re-render after locale read from localStorage
  const [, setLocaleReady] = useState(false);

  useEffect(() => {
    getLocale(); // sync currentLocale from localStorage
    setLocaleReady(true);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError(t('landing.err_name'));
      return;
    }
    if (!roomId.trim()) {
      setError(t('landing.err_room'));
      return;
    }
    router.push(`/room/${roomId}?name=${encodeURIComponent(playerName.trim())}`);
  };

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError(t('landing.err_name'));
      return;
    }
    const arr = new Uint8Array(5);
    crypto.getRandomValues(arr);
    const newRoomId = Array.from(arr, b => b.toString(36)).join('').substring(0, 8).toUpperCase();
    const trimmedName = playerName.trim();

    setIsCreating(true);
    try {
      await createRoom(newRoomId, trimmedName);
      router.push(`/room/${newRoomId}?name=${encodeURIComponent(trimmedName)}`);
    } catch {
      setError(t('landing.err_create'));
    } finally {
      setIsCreating(false);
    }
  };

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LotoVN - Lô Tô Việt Nam Online",
    description: "Chơi Lô Tô online đa người chơi phong cách lễ hội Việt Nam. Tạo phòng, mời bạn bè, quay số trực tiếp — miễn phí!",
    url: "https://lotovn.vercel.app",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    inLanguage: "vi",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="relative flex min-h-dvh flex-col items-center justify-center p-4 overflow-hidden bg-red-950 font-sans selection:bg-yellow-500/30">
        <LandingBackground />

        {/* Sovereignty Badge - Fixed Top Center (Responsive) */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 md:top-6 w-max max-w-[90vw]"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-red-800/90 hover:bg-red-800 backdrop-blur-sm rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(220,38,38,0.5)] group transition-all hover:scale-105 cursor-default whitespace-nowrap">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider drop-shadow-md truncate">
              Hoàng Sa & Trường Sa là của <span className="text-yellow-400 font-black">Việt Nam</span>
            </span>
          </div>
        </motion.div>

        {/* Main Container - Focused & Centralized */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

          {/* Left Column: Hero Visuals & Title */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6">

            {/* Logo / Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Premium Version 2.0</span>
            </motion.div>

            {/* Typography: Massive & Metallic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative"
            >
              <div className="relative z-30 py-4 px-2">
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-800 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] select-none">
                  LÔ TÔ
                </h1>
                <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] select-none mt-[-0.1em] relative z-10 block">
                  VIỆT NAM
                </span>
                <div className="absolute inset-0 blur-3xl bg-yellow-500/10 -z-10 rounded-full" />
              </div>


            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-yellow-100/60 font-medium text-sm sm:text-base max-w-md tracking-wide"
            >
              {t('landing.hero_desc')} <span className="text-yellow-400 font-bold">{t('landing.hero_cta')}</span>
            </motion.p>
          </div>

          {/* Right Column: Interaction Card (Glassmorphism Pro) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 w-full max-w-md"
          >
            <div
              className="relative p-1 rounded-3xl bg-linear-to-b from-yellow-500/30 to-transparent shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="bg-[#1a0505]/80 rounded-[22px] p-6 sm:p-8 space-y-6 border border-white/5 relative overflow-hidden group">
                {/* Hover Glow Effect */}
                <div className={`absolute -inset-1 bg-linear-to-r from-yellow-500/0 via-yellow-500/10 to-transparent transition-opacity duration-700 pointer-events-none ${isHovering ? 'opacity-100' : 'opacity-0'}`} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="playerName" className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80 ml-1">{t('landing.name_label')}</label>
                    <input
                      id="playerName"
                      type="text"
                      placeholder={t('landing.name_placeholder')}
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(""); }}
                      maxLength={20}
                      aria-label={t('player.name')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 focus:bg-white/10 transition-all text-white placeholder:text-white/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="roomId" className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80 ml-1">{t('landing.room_label')}</label>
                    <input
                      id="roomId"
                      type="text"
                      placeholder={t('landing.room_placeholder')}
                      value={roomId}
                      onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
                      maxLength={10}
                      aria-label={t('room.code')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 focus:bg-white/10 transition-all text-white placeholder:text-white/20 font-bold tracking-widest"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-xs font-bold bg-red-950/50 px-3 py-2 rounded-lg border border-red-500/20">
                    ⚠ {error}
                  </motion.div>
                )}

                <div className="pt-2 flex flex-col gap-3">
                  <button onClick={handleJoin} aria-label={t('room.join')} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl text-[#3b0707] font-black text-lg shadow-[0_8px_20px_rgba(234,179,8,0.3)] hover:shadow-[0_12px_30px_rgba(234,179,8,0.5)] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 group/btn">
                    <Users className="w-5 h-5" />
                    <span>{t('landing.join_btn')}</span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="grow border-t border-white/10"></div>
                    <span className="shrink-0 mx-4 text-white/20 text-[10px] uppercase font-black tracking-widest">{t('landing.or')}</span>
                    <div className="grow border-t border-white/10"></div>
                  </div>

                  <button onClick={handleCreate} disabled={isCreating} aria-label={t('room.create')} className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl text-yellow-500 font-bold text-base hover:bg-white/10 hover:border-yellow-500/50 transition-all flex items-center justify-center gap-2 group/btn2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t('landing.create_btn')}</span>
                  </button>

                  <button onClick={() => router.push('/lobby')} aria-label={t('lobby.title')} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 font-bold text-sm hover:bg-white/10 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{t('landing.public_rooms')}</span>
                  </button>

                  {/* Settings row */}
                  <div className="flex items-center justify-between pt-1">
                    <WalletBadge />
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Shopee affiliate pill — mobile: above footer | desktop: above Adsterra (728x90 at bottom-16) */}
        <div className="absolute bottom-11 lg:bottom-[164px] left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <ShopeeAffiliateCTA variant="landing" />
        </div>

        {/* Adsterra banner — chỉ hiện trên desktop (leaderboard 728x90), desktop only below Shopee pill */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden lg:flex justify-center pointer-events-auto">
          <AdsterraBanner size="leaderboard" />
        </div>

        {/* Footer credit */}
        <footer className="absolute bottom-4 w-full flex flex-col md:flex-row items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-white/20 uppercase tracking-widest md:tracking-[0.3em] pointer-events-none mix-blend-screen px-4 text-center">
          <span>Premium Loto • Tet 2026 Edition</span>
          <span className="hidden md:inline text-yellow-500">•</span>
          <a href="https://www.sonlt.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors cursor-pointer pointer-events-auto flex items-center gap-1">
            Made with <span className="text-red-500 animate-pulse">❤</span> by <span className="font-black text-yellow-500">SonLT</span>
          </a>
        </footer>
      </main>
    </>
  );
}
