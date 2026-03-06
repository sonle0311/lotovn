"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_LIST = ["👏", "🔥", "😭", "🎉", "😱", "💀"] as const;

interface EmojiReactionsProps {
    onReact: (emoji: string) => void;
    incomingReactions: { id: string; emoji: string; senderName: string }[];
}

const EmojiReactions = memo(function EmojiReactions({ onReact, incomingReactions }: EmojiReactionsProps) {
    const [lastReactTime, setLastReactTime] = useState(0);
    const [dimensions, setDimensions] = useState({ w: 400, h: 800 });

    // SSR-safe: read window dimensions only after mount
    useEffect(() => {
        setDimensions({ w: window.innerWidth, h: window.innerHeight });
        const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleReact = useCallback((emoji: string) => {
        const now = Date.now();
        if (now - lastReactTime < 1000) return;
        setLastReactTime(now);
        onReact(emoji);
    }, [lastReactTime, onReact]);

    return (
        <>
            {/* Emoji picker bar */}
            <div className="flex gap-1.5">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base sm:text-lg hover:bg-white/15 hover:scale-110 active:scale-90 transition-all"
                        title={`React ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Floating emoji animations */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                    {incomingReactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{
                                opacity: 1,
                                y: dimensions.h - 100,
                                x: Math.random() * (dimensions.w - 60) + 30,
                                scale: 0.5,
                            }}
                            animate={{
                                opacity: 0,
                                y: dimensions.h * 0.3,
                                scale: 1.5,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute text-4xl"
                        >
                            {reaction.emoji}
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/60 whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-full">
                                {reaction.senderName}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
});

export default EmojiReactions;
export type { EmojiReactionsProps };
