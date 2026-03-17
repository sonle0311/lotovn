"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EMOJI_LIST = ["👏", "🔥", "😭", "🎉", "😱", "💀"] as const;

interface EmojiReactionsProps {
    onReact: (emoji: string) => void;
    incomingReactions: { id: string; emoji: string; senderName: string }[];
}

function getReactionX(id: string, width: number): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }

    const usableWidth = Math.max(width - 60, 1);
    return (hash % usableWidth) + 30;
}

const EmojiReactions = memo(function EmojiReactions({ onReact, incomingReactions }: EmojiReactionsProps) {
    const [lastReactTime, setLastReactTime] = useState(0);
    const [dimensions, setDimensions] = useState(() =>
        typeof window === "undefined"
            ? { w: 400, h: 800 }
            : { w: window.innerWidth, h: window.innerHeight }
    );

    useEffect(() => {
        const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleReact = useCallback((emoji: string) => {
        const now = Date.now();
        if (now - lastReactTime < 1000) return;
        setLastReactTime(now);
        onReact(emoji);
    }, [lastReactTime, onReact]);

    return (
        <>
            <div className="flex gap-1.5">
                {EMOJI_LIST.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-base transition-all hover:scale-110 hover:bg-white/15 active:scale-90 sm:h-9 sm:w-9 sm:text-lg"
                        title={`React ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
                <AnimatePresence>
                    {incomingReactions.map((reaction) => (
                        <motion.div
                            key={reaction.id}
                            initial={{
                                opacity: 1,
                                y: dimensions.h - 100,
                                x: getReactionX(reaction.id, dimensions.w),
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
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/40 px-1.5 py-0.5 text-[8px] font-bold text-white/60">
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
