"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Send, MessageSquare } from "lucide-react";
import { ChatMessage } from "@/lib/useGameRoom";
import { motion, AnimatePresence } from "framer-motion";

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    playerName: string;
}

const ChatBox = memo(function ChatBox({ messages, onSendMessage, playerName }: ChatBoxProps) {
    const [text, setText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSendMessage(text.trim());
            setText("");
        }
    };

    return (
        <div className="glass-card flex flex-col h-full border-white/5 overflow-hidden">
            <div className="bg-white/5 p-3 sm:p-4 flex items-center gap-2 border-b border-white/10 relative z-10">
                <MessageSquare size={16} className="text-yellow-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80">Trò chuyện</h3>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative"
            >
                <div className="absolute inset-0 viet-pattern opacity-5 pointer-events-none" />
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const isMe = msg.senderName === playerName;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex flex-col relative z-10 ${isMe ? "items-end" : "items-start"}`}
                            >
                                <span className="text-[9px] font-black text-white/30 mb-1 px-1 tracking-wider uppercase">{msg.senderName}</span>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[85%] shadow-lg border ${isMe
                                    ? "bg-yellow-600 border-yellow-400 text-red-950 font-bold rounded-tr-none"
                                    : "bg-white/5 border-white/10 text-white/90 rounded-tl-none backdrop-blur-md"
                                    }`}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white/5 flex gap-2 border-t border-white/10 relative z-10">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Gửi tin nhắn..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-white/20"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-10 h-10 bg-yellow-500 rounded-2xl flex items-center justify-center hover:bg-yellow-400 transition-all btn-tactile disabled:opacity-30 shadow-[0_4px_0_#92400e] active:shadow-none"
                >
                    <Send size={16} className="text-red-950 fill-current" />
                </button>
            </form>
        </div>
    );
});

export default ChatBox;
