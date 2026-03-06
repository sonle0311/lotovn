"use client";

import { memo } from "react";
import { TICKET_THEMES, getThemeById } from "@/lib/ticket-themes";
import type { TicketTheme } from "@/lib/ticket-themes";

interface ThemeSelectorProps {
    currentThemeId: string;
    onSelect: (themeId: string) => void;
}

const ThemeSelector = memo(function ThemeSelector({ currentThemeId, onSelect }: ThemeSelectorProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {TICKET_THEMES.map((theme: TicketTheme) => {
                const isActive = theme.id === currentThemeId;
                return (
                    <button
                        key={theme.id}
                        onClick={() => onSelect(theme.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${isActive
                            ? "border-yellow-400 bg-yellow-400/20 text-yellow-300 scale-105 shadow-lg shadow-yellow-500/20"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20"
                            }`}
                        title={theme.name}
                    >
                        <span>{theme.emoji}</span>
                        <span className="hidden sm:inline">{theme.name}</span>
                    </button>
                );
            })}
        </div>
    );
});

export default ThemeSelector;
