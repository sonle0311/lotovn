"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useGameRoom, WinnerData, MAX_PLAYERS } from "@/lib/useGameRoom";
import { checkRowWin, checkFullCardWin, getCardWaitingNumbers } from "@/lib/gameLogic";
import LotoCard from "@/components/LotoCard";
import NumberDrawing from "@/components/NumberDrawing";
import ChatBox from "@/components/ChatBox";
import PlayerList from "@/components/PlayerList";
import AdminControls from "@/components/AdminControls";
import NumberPoolGrid from "@/components/NumberPoolGrid";
import ShopeeAffiliateCTA from "@/components/ShopeeAffiliateCTA";
import { AdsterraBanner } from "@/components/AdsterraBanner";
import { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Share2, Trophy, BellRing, RotateCcw, Shuffle, Check, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { toast } from "sonner";

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

/** #10: Extracted from IIFE — lịch sử xổ số trong winner modal */
import type { LotoCard as LotoCardType, LotoTicket } from "@/lib/gameLogic";

function DrawHistory({ drawnNumbers, drawnNumbersSet, winnerMarkedSet, winnerTicket }: {
    drawnNumbers: number[];
    drawnNumbersSet: Set<number>;
    winnerMarkedSet: Set<number>;
    winnerTicket: LotoTicket | null;
}) {
    const winningNumbers = useMemo(() => {
        const nums = new Set<number>();
        if (winnerTicket) {
            (winnerTicket.frames as LotoCardType[]).forEach(frame => {
                frame.forEach(row => {
                    if (checkRowWin(row, drawnNumbersSet)) {
                        row.forEach(n => { if (n !== null) nums.add(n); });
                    }
                });
            });
        }
        return nums;
    }, [winnerTicket, drawnNumbersSet]);

    const reversedHistory = useMemo(() => [...drawnNumbers].reverse(), [drawnNumbers]);

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1 } };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2 px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                    Lịch sử xổ số ({drawnNumbers.length} số)
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/50 italic">
                    Mới nhất đầu tiên ↓
                </p>
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-wrap gap-1 justify-center">
                {reversedHistory.map((num, idx) => {
                    const isWinningNum = winningNumbers.has(num);
                    const isMarkedNum = winnerMarkedSet.has(num);
                    return (
                        <motion.span
                            key={`${idx}-${num}`}
                            variants={itemVariants}
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black border transition-all ${isWinningNum
                                ? "bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] z-10 scale-110"
                                : isMarkedNum
                                    ? "bg-green-500/30 border-green-500/50 text-green-300"
                                    : "bg-white/5 border-white/10 text-white/40"
                                }`}
                        >
                            {num < 10 ? `0${num}` : num}
                        </motion.span>
                    );
                })}
            </motion.div>
        </div>
    );
}

export default function GameRoom() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const roomId = params.roomId as string;
    const rawName = searchParams.get("name") || "";
    const playerName = rawName.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F]/g, '').trim().slice(0, 20);

    const {
        players,
        messages,
        drawnNumbers,
        currentNumber,
        gameStatus,
        myTicket,
        isHost,
        winner,
        winRejected,
        waitingKinhPlayer,
        markedNumbers,
        isRoomFull,
        chatCooldown,
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
        regenerateTicket,
        autoMarkEnabled,
        toggleAutoMark,
        keepTicketPref,
        toggleKeepTicket,
        forceRegenerateTicket,
        sessionWins,
    } = useGameRoom(roomId, playerName);

    const [hasDeclaredWin, setHasDeclaredWin] = useState(false);
    const [lastWaitingSignature, setLastWaitingSignature] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'game' | 'players' | 'chat'>('game');
    const drawnNumbersSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

    // Lock body scroll khi winner modal mở — fix double scrollbar
    useEffect(() => {
        const isModalOpen = gameStatus === 'ended' && winner !== null;
        document.body.classList.toggle('no-scroll', isModalOpen);
        return () => document.body.classList.remove('no-scroll');
    }, [gameStatus, winner]);

    // Redirect if no name
    useEffect(() => {
        if (!playerName) {
            router.push("/");
        }
    }, [playerName, router]);

    // Redirect khi phòng đầy
    useEffect(() => {
        if (isRoomFull) {
            toast.error(`Phòng ${roomId} đã đầy (${MAX_PLAYERS}/${MAX_PLAYERS} người)! Đang chuyển hướng...`, {
                duration: 3000,
            });
            const timer = setTimeout(() => router.push("/"), 3000);
            return () => clearTimeout(timer);
        }
    }, [isRoomFull, roomId, router]);

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
    }, [isWaitingKinh, lastWaitingSignature, declareWaitingKinh, waitingNumbers]);

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
            toast.info("Đang gửi yêu cầu Kinh...", { duration: 2000 });
        } else {
            toast.error("Bạn chưa đủ số để Kinh đâu nha! Kiểm tra lại phiếu đi nào.");
        }
    };

    // Show rejection toast if win_request was rejected by host
    useEffect(() => {
        if (winRejected) {
            toast.error("KINH không hợp lệ! Kiểm tra lại phiếu.", { id: "win-rejected" });
        }
    }, [winRejected]);

    // Confetti effect when someone wins & Toast for Waiting Kinh
    useEffect(() => {
        if (gameStatus === 'ended' && winner) {
            // Only show toast for spectators — winner already sees the modal
            if (winner.name !== playerName) {
                toast.success(`Người chơi ${winner.name} đã KINH!`);
            }
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
    }, [waitingKinhPlayer, playerName]);

    const copyRoomCode = () => {
        const url = `${window.location.origin}/room/${roomId}`;
        navigator.clipboard.writeText(url)
            .then(() => toast.info("Đã sao chép link phòng!"))
            .catch(() => toast.error("Không thể sao chép. Link: " + url));
    };

    const winnerMarkedSet = useMemo(
        () => new Set(winner?.markedNumbers ?? []),
        [winner]
    );
    const invalidNumbers = useMemo(
        () => winner?.markedNumbers?.filter(n => !drawnNumbersSet.has(n)) ?? [],
        [winner, drawnNumbersSet]
    );
    const isVerified = invalidNumbers.length === 0;

    const handleRegenerateTicket = (description: string) => {
        regenerateTicket();
        toast.success("Đã đổi vé mới!", { icon: "🎫", description });
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
                                    {gameStatus === 'playing' ? "Đang xổ" : gameStatus === 'ended' ? "Kết thúc" : "Chờ bắt đầu"} • <span className="text-yellow-500/80">{playerName}</span>
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
                                <span
                                    className="text-3xl sm:text-4xl font-black text-yellow-500 leading-none drop-shadow-glow"
                                    aria-live="polite"
                                    aria-atomic="true"
                                    aria-label={`Số mới: ${currentNumber}`}
                                >
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
                <div role="tablist" aria-label="Điều hướng game" className="lg:hidden mb-4 w-full flex bg-black/40 p-1 rounded-xl backdrop-blur-md border border-white/10 shadow-lg sticky top-[65px] z-40">
                    {(['game', 'players', 'chat'] as const).map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
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

                    {/* 1. Left Sidebar: Host Controls + Number Drawing + Player List */}
                    <div className={`lg:col-span-3 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1 ${activeTab === 'players' || activeTab === 'chat' ? "hidden lg:flex" : "flex"}`}>
                        {/* Host Controls Section */}
                        {isHost && (
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

                        {/* Lồng cầu — hiển thị cho TẤT CẢ người chơi */}
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <NumberDrawing currentNumber={currentNumber} drawnNumbers={drawnNumbers} />
                            <NumberPoolGrid drawnNumbers={drawnNumbers} />
                            <div className="hidden lg:block h-full">
                                <PlayerList players={players} currentPlayerName={playerName} sessionWins={sessionWins} />
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Center Area: Loto Ticket */}
                    <div className={`${activeTab === 'game' ? "flex" : "hidden lg:flex"} lg:col-span-6 flex-col items-center gap-3 sm:gap-6 order-1 lg:order-2`}>
                        {/* Status Overlays - REMOVED for Toast approach as requested */}

                        {myTicket && (
                            <div className="w-full flex-1 flex flex-col items-center gap-3 sm:gap-6 max-w-[680px]">
                                {/* Auto-mark toggle */}
                                <div className="flex items-center justify-between w-full px-1">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Phiếu của bạn</span>
                                    <button
                                        onClick={toggleAutoMark}
                                        className="flex items-center gap-2 min-h-[44px] min-w-[44px] justify-end px-1 -mr-1"
                                        aria-label={autoMarkEnabled ? "Tắt tự động đánh" : "Bật tự động đánh"}
                                        aria-pressed={autoMarkEnabled}
                                    >
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Tự động đánh</span>
                                        <div className={`w-10 h-5 rounded-full transition-colors duration-200 relative border ${autoMarkEnabled ? "bg-yellow-500 border-yellow-400" : "bg-white/10 border-white/10"}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${autoMarkEnabled ? "left-[22px]" : "left-0.5"}`} />
                                        </div>
                                    </button>
                                </div>

                                <div className="w-full overflow-x-auto pb-1 scrollbar-hide flex justify-center">
                                    <LotoCard
                                        ticket={myTicket}
                                        drawnNumbers={drawnNumbersSet}
                                        currentNumber={currentNumber}
                                        markedNumbers={markedNumbers}
                                        onMark={toggleMark}
                                    />
                                </div>

                                {/* Nút Đổi Vé - Chỉ hiện khi đang chờ */}
                                {gameStatus === 'waiting' && (
                                    <div className="flex flex-col items-center gap-3">
                                        <button
                                            onClick={() => handleRegenerateTicket("Chúc bạn may mắn!")}
                                            className="px-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-500 font-bold text-sm transition-all flex items-center gap-2 btn-tactile"
                                            aria-label="Đổi vé mới"
                                        >
                                            <Shuffle size={18} className="animate-pulse" />
                                            <span>Đổi Vé</span>
                                        </button>

                                        {/* Shopee affiliate + Adsterra — chỉ hiện khi chờ game bắt đầu */}
                                        <ShopeeAffiliateCTA variant="waiting" />
                                        <AdsterraBanner size="mobile" />
                                    </div>
                                )}

                                {/* Nút Giữ/Đổi Vé - Chỉ hiện khi game kết thúc */}
                                {gameStatus === 'ended' && (
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => { forceRegenerateTicket(); toast.success("Đã đổi vé mới!", { icon: "🎫", description: "Chúc bạn may mắn ván sau!" }); }}
                                            className="px-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-500 font-bold text-sm transition-all flex items-center gap-2 btn-tactile"
                                            aria-label="Đổi vé mới"
                                        >
                                            <Shuffle size={18} />
                                            <span>Đổi Vé Mới</span>
                                        </button>
                                        <button
                                            onClick={() => { toggleKeepTicket(true); toast.success("Giữ vé cho ván sau!", { icon: "🔒" }); }}
                                            className={`px-6 py-2.5 border rounded-xl font-bold text-sm flex items-center gap-2 btn-tactile transition-all
                                                ${keepTicketPref
                                                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                                                    : "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"}`}
                                            aria-label="Giữ vé cũ"
                                        >
                                            <Check size={18} />
                                            <span>{keepTicketPref ? "Đã giữ vé" : "Giữ Vé Cũ"}</span>
                                        </button>
                                    </div>
                                )}

                                {/* Mobile Condensed Chat - Show at bottom of game tab */}
                                <div className="lg:hidden w-full h-[200px] mt-2 mb-32">
                                    <ChatBox
                                        messages={messages.slice(-5)}
                                        onSendMessage={sendMessage}
                                        playerName={playerName}
                                        chatCooldown={chatCooldown}
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
                            chatCooldown={chatCooldown}
                        />
                    </div>

                    {/* Mobile Player List Tab */}
                    <div className={`${activeTab === 'players' ? "block" : "hidden"} lg:hidden order-3`}>
                        <PlayerList players={players} currentPlayerName={playerName} sessionWins={sessionWins} />
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
                                    : "bg-black/50 text-white/40 border-2 border-white/20 cursor-not-allowed backdrop-blur-sm"}`}
                        >
                            {canKinh ? (
                                "KINH!"
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Lock className="w-5 h-5 opacity-60" />
                                    <span>KINH!</span>
                                </span>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Winner Modal — hiển thị phiếu + verify số */}
            <AnimatePresence>
                {gameStatus === 'ended' && winner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-start justify-center px-4 py-6 bg-red-950/90 backdrop-blur-xl overflow-y-auto scrollbar-hide"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-lg w-full glass-card p-5 sm:p-8 text-center border-yellow-400 shadow-[0_0_100px_rgba(245,158,11,0.3)]"
                        >
                            <Trophy size={48} className="mx-auto mb-3 text-yellow-500 drop-shadow-lg" />
                            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter mb-1 italic">KINH RỒI!</h2>
                            <p className="text-lg sm:text-xl font-black text-yellow-500 mb-3 tracking-tight uppercase">Chúc mừng {winner.name}!</p>

                            {/* Verify Badge */}
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black mb-4 ${isVerified
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}>
                                {isVerified ? (
                                    <><ShieldCheck size={16} /> XÁC NHẬN HỢP LỆ</>
                                ) : (
                                    <><ShieldAlert size={16} /> PHÁT HIỆN {invalidNumbers.length} SỐ CHƯA XỔ</>
                                )}
                            </div>

                            {/* Phiếu của người thắng */}
                            {winner.ticket && (
                                <div className="mb-4 -mx-3 sm:-mx-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                                        Phiếu của {winner.name}
                                    </p>
                                    <LotoCard
                                        ticket={winner.ticket}
                                        drawnNumbers={drawnNumbersSet}
                                        currentNumber={null}
                                        markedNumbers={winnerMarkedSet}
                                        readOnly
                                    />
                                </div>
                            )}

                            {/* Số đã đánh */}
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                                    Các số đã đánh ({winner.markedNumbers.length} số)
                                </p>
                                <div className="flex flex-wrap gap-1 justify-center">
                                    {[...winner.markedNumbers].sort((a, b) => a - b).map(num => (
                                        <span
                                            key={num}
                                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-black ${drawnNumbersSet.has(num)
                                                ? "bg-green-500/20 border-green-500/40 text-green-400"
                                                : "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                                                }`}
                                        >
                                            {num < 10 ? `0${num}` : num}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Lịch sử xổ số */}
                            <DrawHistory
                                drawnNumbers={drawnNumbers}
                                drawnNumbersSet={drawnNumbersSet}
                                winnerMarkedSet={winnerMarkedSet}
                                winnerTicket={winner.ticket}
                            />

                            {/* Shopee affiliate CTA — natural pause sau khi thắng */}
                            <div className="mb-3">
                                <ShopeeAffiliateCTA variant="winner" />
                            </div>

                            {isHost ? (
                                <button
                                    onClick={resetGame}
                                    className="w-full btn-primary !text-lg !shadow-[0_4px_0_#92400e]"
                                >
                                    <RotateCcw size={20} className="mr-2" /> CHƠI VÁN MỚI
                                </button>
                            ) : (
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-white/60 text-sm italic">Đang chờ chủ phòng bắt đầu ván mới...</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
