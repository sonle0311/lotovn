"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useGameRoom } from "@/lib/useGameRoom";
import { checkRowWin, checkFullCardWin, getCardWaitingNumbers } from "@/lib/gameLogic";
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
    const [lastWaitingSignature, setLastWaitingSignature] = useState<string>("");
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
    const waitingNumbers = useMemo(() => {
        if (gameStatus !== 'playing' || !myTicket) return [];
        const nums = new Set<number>();
        myTicket.frames.forEach(frame => {
            getCardWaitingNumbers(frame, markedNumbers).forEach(n => nums.add(n));
        });
        return Array.from(nums);
    }, [myTicket, markedNumbers, gameStatus]);

    const isWaitingKinh = waitingNumbers.length > 0;

    const FUNNY_PHRASES = [
        "Tim đập thình thịch, chỉ chờ hàng {info}!",
        "Hồi hộp quá, {info} ơi hiện thân đi nào!",
        "Mồ hôi hột rơi lã chã, hóng hàng {info} quá xá!",
        "Chỉ một bước nữa thôi là thành tỉ phú, gọi tên hàng {info}!",
        "Hàng {info} mà ra là vang danh thiên hạ luôn!",
        "Thần tài gõ cửa hàng {info} rồi, chuẩn bị chưa?",
    ];

    const OPPONENT_PHRASES = [
        "Tay này đang rình hàng {info}, chặn nó lại anh em ơi!",
        "Bái phục, {name} sắp Kinh với hàng {info} rồi kìa!",
        "Cẩn thận nha, {name} đang hóng hàng {info} cháy máy!",
        "Đừng để con số hàng {info} xuất hiện, {name} sắp hốt bạc rồi!",
        "Áp lực quá, {name} đang chờ hàng {info} tỏa sáng!",
    ];

    useEffect(() => {
        const signature = waitingNumbers.join(",");

        if (isWaitingKinh && signature !== lastWaitingSignature) {
            declareWaitingKinh(true, waitingNumbers);
            setLastWaitingSignature(signature);

            // Local toast for better feel
            const waitingInfo = waitingNumbers.map(n => {
                const head = Math.floor(n / 10);
                return `${head}x`;
            }).join(", ");

            const randomPhrase = FUNNY_PHRASES[Math.floor(Math.random() * FUNNY_PHRASES.length)]
                .replace("{info}", waitingInfo);

            toast.warning(randomPhrase, {
                duration: 5000,
                icon: '🔥',
                id: `my-waiting-kinh` // Prevent local spam
            });
        } else if (!isWaitingKinh && lastWaitingSignature !== "") {
            setLastWaitingSignature("");
        }
    }, [isWaitingKinh, lastWaitingSignature, declareWaitingKinh, waitingNumbers, FUNNY_PHRASES]);

    useEffect(() => {
        if (gameStatus === 'waiting' || gameStatus === 'ended') {
            setHasDeclaredWin(false);
            setLastWaitingSignature("");
        }
    }, [gameStatus]);

    // Memoized win condition check for button highlighting
    const canKinh = useMemo(() => {
        if (!myTicket || gameStatus !== 'playing') return false;
        return myTicket.frames.some(frame => {
            const isFullWin = checkFullCardWin(frame, markedNumbers);
            const isAnyRowWin = frame.some(row => checkRowWin(row, markedNumbers));
            return isFullWin || isAnyRowWin;
        });
    }, [myTicket, markedNumbers, gameStatus]);

    const handleKinh = () => {
        if (!myTicket || hasDeclaredWin) return;

        if (canKinh) {
            declareWin();
            setHasDeclaredWin(true);
            toast.success("Chúc mừng! Bạn đã Kinh thành công!");
        } else {
            toast.error("Bạn chưa đủ số để Kinh đâu nha! Kiểm tra lại phiếu đi nào.");
        }
    };

    // Confetti effect when someone wins & Toast for Waiting Kinh
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

    useEffect(() => {
        if (waitingKinhPlayer && waitingKinhPlayer.name !== playerName) {
            const waitingInfo = waitingKinhPlayer.waitingNumbers?.map(n => {
                const head = Math.floor(n / 10);
                return `${head}x`;
            }).join(", ") || "";

            const randomPhrase = OPPONENT_PHRASES[Math.floor(Math.random() * OPPONENT_PHRASES.length)]
                .replace("{info}", waitingInfo)
                .replace("{name}", waitingKinhPlayer.name);

            toast.warning(
                <div className="flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-2 text-red-950">
                        <BellRing size={16} className="animate-bounce" />
                        {waitingKinhPlayer.name} CHỜ KINH!
                    </span>
                    <span className="text-xs text-red-900/70 italic">
                        {randomPhrase}
                    </span>
                </div>,
                {
                    duration: 4000,
                    id: `waiting-kinh-${waitingKinhPlayer.name}` // CRITICAL: Prevent duplicate toasts for same player
                }
            );
        }
    }, [waitingKinhPlayer, playerName, OPPONENT_PHRASES]);

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

                {/* Floating Current Number Badge - Always visible when playing */}
                <AnimatePresence>
                    {gameStatus === 'playing' && currentNumber !== null && (
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className="fixed top-24 right-4 z-[60] pointer-events-none"
                        >
                            <div className="bg-red-900 shadow-[0_0_30px_rgba(245,158,11,0.3)] border-2 border-yellow-500 p-2 sm:p-4 rounded-full flex flex-col items-center justify-center min-w-[70px] sm:min-w-[90px] aspect-square transform hover:scale-105 transition-transform duration-300 pointer-events-auto">
                                <span className="text-[10px] font-black uppercase text-yellow-500/70 tracking-widest leading-none mb-1">Số mới</span>
                                <span className="text-3xl sm:text-4xl font-black text-yellow-500 leading-none drop-shadow-glow">
                                    {currentNumber < 10 ? `0${currentNumber}` : currentNumber}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1600px] mx-auto w-full p-2 sm:p-6 pb-24 relative z-10">
                {/* Mobile Tabs - Persistent at the top of content */}
                <div className="lg:hidden mb-4 w-full flex bg-black/40 p-1 rounded-xl backdrop-blur-md border border-white/10 shadow-lg sticky top-[72px] z-40">
                    {(['game', 'players', 'chat'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                                ? "bg-yellow-500 text-red-950 shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
                                : "text-white/40"
                                }`}
                        >
                            {tab === 'game' ? "Xổ số" : tab === 'players' ? "Bạn chơi" : "Chat"}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

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

                        {/* Number Status (Lồng cầu) - ONLY show for Host or on LG screens if host */}
                        {isHost && (
                            <div className={`${activeTab === 'chat' ? "hidden" : "flex"} lg:flex flex-col gap-4 sm:gap-6`}>
                                <NumberDrawing currentNumber={currentNumber} drawnNumbers={drawnNumbers} />
                                {/* Player List (Hidden on mobile tab Game, shown on mobile tab Players) */}
                                <div className="hidden lg:block h-full">
                                    <PlayerList players={players} />
                                </div>
                            </div>
                        )}
                        {!isHost && (
                            <div className="hidden lg:block h-full">
                                <PlayerList players={players} />
                            </div>
                        )}
                    </div>

                    {/* 2. Main Center Area: Loto Ticket */}
                    <div className={`${activeTab === 'game' ? "flex" : "hidden lg:flex"} lg:col-span-6 flex-col items-center gap-3 sm:gap-6 order-1 lg:order-2`}>
                        {/* Status Overlays - REMOVED for Toast approach as requested */}

                        {myTicket && (
                            <div className="w-full flex-1 flex flex-col items-center gap-3 sm:gap-6 max-w-[680px]">
                                <div className="w-full overflow-x-auto pb-1 scrollbar-none flex justify-center">
                                    <LotoCard
                                        ticket={myTicket}
                                        drawnNumbers={drawnNumbersSet}
                                        currentNumber={currentNumber}
                                        markedNumbers={markedNumbers}
                                        onMark={toggleMark}
                                    />
                                </div>

                                {/* Mobile Condensed Chat - Show at bottom of game tab */}
                                <div className="lg:hidden w-full h-[200px] mt-2 mb-24">
                                    <ChatBox
                                        messages={messages.slice(-5)}
                                        onSendMessage={sendMessage}
                                        playerName={playerName}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Right Sidebar: Chat - Show full chat on mobile if chat tab is active, or persistent on desktop */}
                    <div className={`${activeTab === 'chat' ? "block" : "hidden lg:block"} lg:col-span-3 order-3 h-[500px] lg:h-auto`}>
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
                </div>
            </main>

            {/* Docked Kinh Button */}
            <AnimatePresence>
                {gameStatus === 'playing' && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 sm:bottom-10 left-0 right-0 z-[100] px-4 flex justify-center pointer-events-none"
                    >
                        <motion.button
                            whileHover={canKinh ? { scale: 1.05 } : {}}
                            whileTap={canKinh ? { scale: 0.95 } : {}}
                            onClick={handleKinh}
                            className={`w-full max-w-sm py-5 rounded-2xl text-2xl font-black italic tracking-tighter transition-all duration-500 pointer-events-auto shadow-2xl
                                ${canKinh
                                    ? "bg-yellow-500 text-red-950 shadow-[0_0_40px_rgba(245,158,11,0.6),0_8px_0_#92400e] animate-pulse border-2 border-white/60"
                                    : "bg-red-900/60 text-white/40 border border-white/10 cursor-not-allowed backdrop-blur-xl"}`}
                        >
                            KINH!
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Winner Modal */}
            <AnimatePresence>
                {
                    gameStatus === 'ended' && winner && (
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
                    )
                }
            </AnimatePresence >
        </div >
    );
}
