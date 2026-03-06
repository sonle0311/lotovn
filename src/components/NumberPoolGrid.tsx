"use client";
import { memo, useMemo, useState } from "react"; // useMemo retained for drawnSet
import { ChevronDown, ChevronUp } from "lucide-react";

// Module-level constant — 1-90 never changes, no reason to re-allocate per render
const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1);

interface NumberPoolGridProps {
  drawnNumbers: number[];
}

// Memo-wrapped to avoid re-renders when parent updates unrelated state
const NumberPoolGrid = memo(function NumberPoolGrid({ drawnNumbers }: NumberPoolGridProps) {
  // Default collapsed to save vertical space on mobile
  const [isExpanded, setIsExpanded] = useState(false);

  // Derive Set once per drawnNumbers change for O(1) lookup in render
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);

  return (
    <div className="glass-card p-3 sm:p-4 border-white/5">
      {/* Collapse/expand toggle with counter badge */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between"
        aria-label={isExpanded ? "Thu gọn bảng số" : "Mở bảng số"}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60">
            Bảng Số
          </span>
          {/* Live counter: drawn / total */}
          <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
            {drawnNumbers.length}/90
          </span>
        </div>
        {isExpanded
          ? <ChevronUp size={14} className="text-white/30" />
          : <ChevronDown size={14} className="text-white/30" />}
      </button>

      {/* 9-column grid — only mounted when expanded to avoid layout cost */}
      {isExpanded && (
        <div
          className="grid gap-1 mt-3"
          style={{ gridTemplateColumns: "repeat(9, 1fr)" }}
        >
          {ALL_NUMBERS.map(num => {
            const isDrawn = drawnSet.has(num);
            return (
              <div
                key={num}
                className={`aspect-square flex items-center justify-center
                  text-[9px] sm:text-[11px] font-black rounded-sm transition-all duration-200
                  ${isDrawn
                    ? "bg-red-600 text-white shadow-sm shadow-red-500/30 scale-105"
                    : "bg-white/5 text-white/25 border border-white/10"
                  }`}
                title={`${num < 10 ? "0" : ""}${num}`}
              >
                {num < 10 ? `0${num}` : num}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default NumberPoolGrid;
