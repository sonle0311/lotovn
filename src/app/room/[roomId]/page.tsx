"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useGameRoom } from "@/lib/useGameRoom";
import { checkRowWin, checkFullCardWin, checkCardWaitingKinh } from "@/lib/gameLogic";
import LotoCard from "@/components/LotoCard";
import NumberDrawing from "@/components/NumberDrawing";
import ChatBox from "@/components/ChatBox";
import PlayerList from "@/components/PlayerList";
import AdminControls from "@/components/AdminControls";
import { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Share2, Trophy, BellRing, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function GameRoom() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const playerName = searchParams.get("name") || "";

    const {
        players,
        messages,
        drawnNumbers,
        currentNumber,
        gameStatus,
        myTicket,
        isHost,
        winner,
        waitingKinhPlayer,
        markedNumbers,
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
    } = useGameRoom(roomId, playerName);

    const [hasDeclaredWin, setHasDeclaredWin] = useState(false);
    const [hasDeclaredWaiting, setHasDeclaredWaiting] = useState(false);
    const [activeTab, setActiveTab] = useState<'game' | 'players' | 'chat'>('game');
    const [isMounted, setIsMounted] = useState(false);
    const drawnNumbersSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

    // Set mounted state and redirect if no name
    useEffect(() => {
        setIsMounted(true);
        if (!playerName) {
            router.push("/");
        }
    }, [playerName, router]);

    // Automatic "Chờ Kinh" notification derived from MARKED numbers
    const isWaitingKinh = useMemo(() => {
        if (gameStatus !== 'playing' || !myTicket) return false;
        return myTicket.frames.some(frame => checkCardWaitingKinh(frame, markedNumbers));
    }, [myTicket, markedNumbers, gameStatus]);

    useEffect(() => {
        if (isWaitingKinh && !hasDeclaredWaiting) {
            declareWaitingKinh(true);
            setHasDeclaredWaiting(true);
        }
    }, [isWaitingKinh, hasDeclaredWaiting, declareWaitingKinh]);

    useEffect(() => {
        if (gameStatus === 'waiting' || gameStatus === 'ended') {
            setHasDeclaredWin(false);
            setHasDeclaredWaiting(false);
        }
    }, [gameStatus]);

    const handleKinh = () => {
        if (!myTicket || hasDeclaredWin) return;

        // Final validation: check if any frame satisfies win condition
        const isWin = myTicket.frames.some(frame => {
            const isFullWin = checkFullCardWin(frame, markedNumbers);
            const isAnyRowWin = frame.some(row => checkRowWin(row, markedNumbers));
            return isFullWin || isAnyRowWin;
        });

        if (isWin) {
            declareWin();
            setHasDeclaredWin(true);
            toast.success("Chúc mừng! Bạn đã Kinh thành công!");
        } else {
            toast.error("Bạn chưa đủ số để Kinh đâu nha! Kiểm tra lại phiếu đi nào.");
        }
    };

    // Confetti effect when someone wins
    useEffect(() => {
        if (gameStatus === 'ended' && winner) {
            toast.success(`Người chơi ${winner.name} đã KINH!`);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F59E0B', '#DC2626', '#FFFFFF']
            });
        }
    }, [gameStatus, winner]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        toast.info("Đã sao chép mã phòng: " + roomId);
    };

    if (!playerName) return null;

    return (
        <div className="min-h-screen bg-red-950 text-white relative flex flex-col">
            <div className="fixed inset-0 viet-pattern pointer-events-none opacity-5 animate-pulse" />

            {/* Header */}
            <header className="sticky top-0 w-full glass-panel z-50 px-4 py-3 sm:py-4 border-b border-white/5 shadow-2xl">
                <div className="max-w-7xl mx-auto w-full flex justify-between items-center relative">
                    {/* Left Actions */}
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all btn-tactile border border-white/10"
                            aria-label="Về trang chủ"
                        >
                            <Home size={18} />
                        </button>
                    </div>

                    {/* Center Title and Status */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none sm:pointer-events-auto">
                        <div className="inline-flex flex-col items-center">
                            <h1 className="text-xl sm:text-2xl font-black text-yellow-500 tracking-tighter leading-none mb-1">
                                PHÒNG: {roomId}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${gameStatus === 'playing' ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : "bg-yellow-500"}`} />
                                <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">
                                    {gameStatus === 'playing' ? "Đang xổ" : "Chờ bắt đầu"} • <span className="text-yellow-500/80">{playerName}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyRoomCode}
                            className="bg-white/5 p-2.5 rounded-2xl border border-white/10 text-yellow-500 btn-tactile transition-all"
                            aria-label="Chia sẻ mã phòng"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1600px] mx-auto w-full p-2 sm:p-6 pb-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

                {/* 1. Left Sidebar: Host Controls (if host) + Game Core Info */}
                <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
                    {/* Host Controls Section */}
                    {isMounted && isHost && (
                        <div className="w-full">
                            <AdminControls
                                onStart={startGame}
                                onDraw={drawNumber}
                                onReset={resetGame}
                                gameStatus={gameStatus}
                                drawnNumbers={drawnNumbers}
                            />
                        </div>
                    )}

                    {/* Number Status (Lồng cầu) */}
                    <div className={`${activeTab === 'game' ? "flex" : "hidden lg:flex"} flex-col gap-4 sm:gap-6`}>
                        <NumberDrawing currentNumber={currentNumber} drawnNumbers={drawnNumbers} />
                        {/* Player List (Hidden on mobile tab Game, shown on mobile tab Players) */}
                        <div className="hidden lg:block h-full">
                            <PlayerList players={players} />
                        </div>
                    </div>
                </div>

                {/* 2. Main Center Area: Loto Ticket */}
                <div className={`${activeTab === 'game' ? "flex" : "hidden lg:flex"} lg:col-span-6 flex-col items-center gap-4 sm:gap-8 order-1 lg:order-2`}>
                    {/* Mobile Tabs */}
                    <div className="lg:hidden w-full flex bg-black/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                        {(['game', 'players', 'chat'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                                    ? "bg-yellow-500 text-red-950 shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                                    : "text-white/40 hover:text-white"
                                    }`}
                            >
                                {tab === 'game' ? "Sảnh chơi" : tab === 'players' ? "Số hội viên" : "Hội thoại"}
                            </button>
                        ))}
                    </div>

                    {/* Status Overlays */}
                    <AnimatePresence>
                        {waitingKinhPlayer !== null && winner === null ? (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full bg-linear-to-r from-red-600 to-red-700 border-2 border-yellow-500/50 p-4 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-yellow-500/5 animate-pulse" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <BellRing className="text-yellow-400 animate-bounce" size={24} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">Tín hiệu mới</p>
                                        <p className="font-black text-white text-sm uppercase tracking-tight">
                                            Hội viên <span className="text-yellow-400">{waitingKinhPlayer.name}</span> đang CHỜ KINH!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>

                    {myTicket && (
                        <div className="w-full flex-1 flex flex-col items-center gap-6 sm:gap-8 max-w-[680px]">
                            <LotoCard
                                ticket={myTicket}
                                drawnNumbers={drawnNumbersSet}
                                currentNumber={currentNumber}
                                markedNumbers={markedNumbers}
                                onMark={toggleMark}
                            />

                            {gameStatus === 'playing' ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleKinh}
                                    className="w-full max-w-md btn-primary !py-8 !text-4xl shadow-[0_12px_24px_rgba(0,0,0,0.4),0_8px_0_#92400e] active:shadow-none animate-pulse italic"
                                >
                                    KINH!
                                </motion.button>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* 3. Right Sidebar: Chat */}
                <div className={`${activeTab === 'chat' ? "block" : "hidden lg:block"} lg:col-span-3 order-3 h-[600px] lg:h-auto`}>
                    <ChatBox
                        messages={messages}
                        onSendMessage={sendMessage}
                        playerName={playerName}
                    />
                </div>

                {/* Mobile Player List Tab */}
                <div className={`${activeTab === 'players' ? "block" : "hidden"} lg:hidden order-3`}>
                    <PlayerList players={players} />
                </div>
            </main>

            {/* Winner Modal */}
            <AnimatePresence>
                {gameStatus === 'ended' && winner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-md w-full glass-card p-10 text-center border-yellow-400 shadow-[0_0_100px_rgba(245,158,11,0.3)]"
                        >
                            <Trophy size={80} className="mx-auto mb-6 text-yellow-500 drop-shadow-lg" />
                            <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-2 italic">KINH RỒI!</h2>
                            <p className="text-2xl font-black text-yellow-500 mb-10 tracking-tight uppercase">Chúc mừng {winner.name}!</p>

                            {isHost ? (
                                <button
                                    onClick={() => resetGame()}
                                    className="w-full btn-primary !text-lg !shadow-[0_4px_0_#92400e]"
                                >
                                    <RotateCcw size={20} className="mr-2" /> CHƠI VÁN MỚI
                                </button>
                            ) : (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-white/60 text-sm italic">Đang chờ chủ phòng bắt đầu ván mới...</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
