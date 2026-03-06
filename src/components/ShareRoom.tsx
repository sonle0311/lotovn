"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, X, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareRoomProps {
    roomId: string;
}

const ShareRoom = memo(function ShareRoom({ roomId }: ShareRoomProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // SSR-safe URL
    const roomUrl = mounted
        ? `${window.location.origin}/room/${roomId}`
        : `/room/${roomId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement("input");
            input.value = roomUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Lô Tô Tết — Phòng ${roomId}`,
                    text: "Vào chơi Lô Tô Tết với tôi nè! 🎊",
                    url: roomUrl,
                });
            } catch {
                /* user cancelled */
            }
        } else {
            setIsOpen(true);
        }
    };

    // Auto-generate QR when dialog opens
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = 200;
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, size - 8, size - 8);

        ctx.fillStyle = "#000";
        ctx.font = "bold 32px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(roomId, size / 2, size / 2 - 20);

        ctx.fillStyle = "#666";
        ctx.font = "11px sans-serif";
        ctx.fillText("lotovn.online", size / 2, size / 2 + 20);

        ctx.fillStyle = "#dc2626";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("🧧 Mã Phòng Lô Tô", size / 2, size / 2 + 50);
    }, [isOpen, roomId]);

    return (
        <>
            <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold hover:bg-white/10 transition-all"
                title="Chia sẻ phòng"
            >
                <Share2 size={14} />
                <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-b from-red-950 to-red-900 border-2 border-yellow-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black text-yellow-400">🧧 Chia Sẻ Phòng</h3>
                                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Room code display */}
                            <div className="bg-black/20 rounded-xl p-4 mb-4 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Mã phòng</p>
                                <p className="text-3xl font-black text-yellow-400 tracking-wider font-mono">{roomId}</p>
                            </div>

                            {/* QR Canvas — auto-generates on open */}
                            <div className="flex justify-center mb-4">
                                <canvas
                                    ref={canvasRef}
                                    className="rounded-xl border-2 border-white/10"
                                    width={200}
                                    height={200}
                                />
                            </div>

                            {/* URL + Copy */}
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={roomUrl}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 font-mono"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-yellow-500 text-red-950 hover:bg-yellow-400"
                                        }`}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

export default ShareRoom;
