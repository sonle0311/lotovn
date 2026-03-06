"use client";

import { memo, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SoundControlProps {
    isMuted: boolean;
    onToggleMute: () => void;
}

const SoundControl = memo(function SoundControl({ isMuted, onToggleMute }: SoundControlProps) {
    return (
        <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${isMuted
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span className="hidden sm:inline">{isMuted ? "Tắt tiếng" : "Có tiếng"}</span>
        </button>
    );
});

export default SoundControl;
