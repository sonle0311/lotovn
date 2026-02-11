"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useGameRoom } from "@/lib/useGameRoom";
import { checkRowWin, checkFullCardWin, checkCardChờKinh } from "@/lib/gameLogic";
import LotoCard from "@/components/LotoCard";
import NumberDrawing from "@/components/NumberDrawing";
import ChatBox from "@/components/ChatBox";
import PlayerList from "@/components/PlayerList";
import AdminControls from "@/components/AdminControls";
import { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Share2, Trophy, BellRing } from "lucide-react";
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
    const drawnNumbersSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

    // Redirect if no name
    useEffect(() => {
        if (!playerName) {
            router.push("/");
        }
    }, [playerName, router]);

    // Automatic "Chờ Kinh" notification based on MARKED numbers
    useEffect(() => {
        if (gameStatus === 'playing' && myTicket && !hasDeclaredWaiting) {
            const isWaiting = myTicket.frames.some(frame => checkCardChờKinh(frame, markedNumbers));
            if (isWaiting) {
                declareWaitingKinh(true);
                setHasDeclaredWaiting(true);
            }
        } else if (gameStatus === 'waiting' || gameStatus === 'ended') {
            setHasDeclaredWin(false);
            setHasDeclaredWaiting(false);
        }
    }, [myTicket, markedNumbers, gameStatus, hasDeclaredWaiting, declareWaitingKinh]);

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
        <div className="min-h-screen p-4 md:p-8 relative">
            <div className="absolute inset-0 viet-pattern pointer-events-none opacity-5" />

            {/* Header */}
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 z-10 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Home size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-yellow-500 tracking-tighter">PHÒNG: {roomId}</h1>
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">
                            Đang chơi: {playerName} {isHost && "(HOST)"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={copyRoomCode}
                        className="btn-secondary py-2 px-4 text-xs"
                    >
                        <Share2 size={14} /> Chia sẻ mã
                    </button>
                    <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${gameStatus === 'playing' ? "bg-green-500/20 text-green-500 border border-green-500/50" :
                        gameStatus === 'ended' ? "bg-red-500/20 text-red-500 border border-red-500/50" :
                            "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        }`}>
                        {gameStatus === 'playing' ? "Đang xổ" : gameStatus === 'ended' ? "Kết thúc" : "Chờ bắt đầu"}
                    </div>
                </div>
            </header>

            {/* Main Game Area */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

                {/* Left Column: Drawing & Controls */}
                <div className="lg:col-span-3 space-y-6">
                    <NumberDrawing currentNumber={currentNumber} drawnNumbers={drawnNumbers} />

                    {isHost && (
                        <AdminControls
                            onStart={startGame}
                            onDraw={drawNumber}
                            onReset={resetGame}
                            gameStatus={gameStatus}
                            drawnNumbers={drawnNumbers}
                        />
                    )}

                    <div className="hidden lg:block">
                        <PlayerList players={players} />
                    </div>
                </div>

                {/* Center Column: Loto Card */}
                <div className="lg:col-span-6 flex flex-col items-center gap-6">
                    <AnimatePresence>
                        {waitingKinhPlayer && !winner && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full bg-red-600/90 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-2xl overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse pointer-events-none" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="bg-yellow-500 p-2 rounded-full ring-4 ring-red-900/50">
                                        <BellRing className="text-red-900 animate-bounce" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-yellow-200">Thông báo từ hội</h4>
                                        <p className="font-bold text-white text-sm">
                                            Người chơi <span className="text-yellow-400 underline">{waitingKinhPlayer.name}</span> đang <span className="text-yellow-400">CHỜ KINH</span>!
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-black uppercase bg-red-900 px-2 py-1 rounded-md text-yellow-500">Hồi hộp quá!</span>
                                </div>
                            </motion.div>
                        )}

                        {gameStatus === 'ended' && winner && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full glass-card p-6 bg-yellow-500 text-red-900 text-center relative overflow-hidden"
                            >
                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                                <Trophy size={48} className="mx-auto mb-2" />
                                <h2 className="text-3xl font-black uppercase tracking-tighter">KINH RỒI!</h2>
                                <p className="font-bold text-lg">Chúc mừng <span className="underline">{winner.name}</span> đã thắng!</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 text-xs font-black uppercase underline tracking-widest opacity-60 hover:opacity-100"
                                >
                                    Chơi ván mới
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {myTicket && (
                        <div className="w-full flex flex-col items-center gap-6">
                            <LotoCard
                                ticket={myTicket}
                                drawnNumbers={drawnNumbersSet}
                                currentNumber={currentNumber}
                                markedNumbers={markedNumbers}
                                onMark={toggleMark}
                            />

                            {gameStatus === 'playing' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleKinh}
                                    className="w-full max-w-xs bg-yellow-500 hover:bg-yellow-400 text-red-900 text-2xl font-black py-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] border-b-8 border-yellow-700 active:border-b-2 transition-all animate-pulse"
                                >
                                    KINH!
                                </motion.button>
                            )}
                        </div>
                    )}

                    <div className="w-full lg:hidden">
                        <PlayerList players={players} />
                    </div>
                </div>

                {/* Right Column: Chat */}
                <div className="lg:col-span-3">
                    <ChatBox
                        messages={messages}
                        onSendMessage={sendMessage}
                        playerName={playerName}
                    />
                </div>
            </div>

            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
