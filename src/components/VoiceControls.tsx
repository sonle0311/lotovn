"use client";

import { memo } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

interface VoiceControlsProps {
    isActive: boolean;
    isMuted: boolean;
    peerCount: number;
    onJoin: () => void;
    onLeave: () => void;
    onToggleMic: () => void;
}

const VoiceControls = memo(function VoiceControls({
    isActive, isMuted, peerCount, onJoin, onLeave, onToggleMic
}: VoiceControlsProps) {
    if (!isActive) {
        return (
            <button
                onClick={onJoin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all"
                title="Bật voice chat"
            >
                <Phone size={14} />
                <span className="hidden sm:inline">Voice</span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={onToggleMic}
                className={`p-2 rounded-xl text-xs font-bold transition-all border ${isMuted
                    ? "bg-red-500/20 border-red-500/30 text-red-400"
                    : "bg-green-500/20 border-green-500/30 text-green-400"
                    }`}
                title={isMuted ? "Bật mic" : "Tắt mic"}
            >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
                onClick={onLeave}
                className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 transition-all hover:bg-red-500/20"
                title="Thoát voice"
            >
                <PhoneOff size={14} />
            </button>
            {peerCount > 0 && (
                <span className="text-[10px] text-green-400 font-bold">
                    🎙️ {peerCount}
                </span>
            )}
        </div>
    );
});

export default VoiceControls;
