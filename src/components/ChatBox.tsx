"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { ChatMessage } from "@/lib/useGameRoom";
import { motion, AnimatePresence } from "framer-motion";

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    playerName: string;
}

export default function ChatBox({ messages, onSendMessage, playerName }: ChatBoxProps) {
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
        <div className="glass-card flex flex-col h-[400px] border-white/5 overflow-hidden">
            <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/10">
                <MessageSquare size={16} className="text-yellow-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-yellow-500/80">Trò chuyện</h3>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
            >
                <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                        const isMe = msg.senderName === playerName;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <span className="text-[10px] font-bold text-white/40 mb-1 px-1">{msg.senderName}</span>
                                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${isMe
                                        ? "bg-yellow-600 text-white rounded-tr-none"
                                        : "bg-white/10 text-white/90 rounded-tl-none"
                                    }`}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-yellow-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={!text.trim()}
                    className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors disabled:opacity-50"
                >
                    <Send size={16} className="text-red-950" />
                </button>
            </form>
        </div>
    );
}
