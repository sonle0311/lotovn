"use client";

import { memo } from "react";
import type { GameMode } from "@/lib/gameLogic";
import { GAME_MODE_LABELS } from "@/lib/gameLogic";

interface GameModeSelectorProps {
    currentMode: GameMode;
    onSelect: (mode: GameMode) => void;
    disabled?: boolean;
}

const MODES: GameMode[] = ['row', 'full', 'two_rows', 'corners'];

const MODE_ICONS: Record<GameMode, string> = {
    row: '➖',
    full: '🃏',
    two_rows: '〰️',
    corners: '🔲',
};

const GameModeSelector = memo(function GameModeSelector({ currentMode, onSelect, disabled }: GameModeSelectorProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {MODES.map(mode => {
                const isActive = mode === currentMode;
                return (
                    <button
                        key={mode}
                        onClick={() => !disabled && onSelect(mode)}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive
                            ? "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                            : disabled
                                ? "border-white/5 bg-white/5 text-white/20 cursor-not-allowed"
                                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                            }`}
                        title={GAME_MODE_LABELS[mode]}
                    >
                        <span>{MODE_ICONS[mode]}</span>
                        <span>{GAME_MODE_LABELS[mode]}</span>
                    </button>
                );
            })}
        </div>
    );
});

export default GameModeSelector;
