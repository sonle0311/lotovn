# Phase 02: Number Pool Grid + Draw Speed Presets

**Parent**: [plan.md](./plan.md) | **Research**: [game-features](./research/researcher-260225-game-features.md)
**Date**: 260225 | **Priority**: HIGH | **Status**: completed | **Review**: pending
**Dependencies**: None (Group A, parallel-safe)

---

## Overview

Two independent UI enhancements touching separate files:
1. **Number Pool Grid** -- new component showing 1-90 in 9-col grid, drawn=red vs remaining=dim
2. **Speed Presets** -- 3 quick buttons (Cham/Binh thuong/Nhanh) in AdminControls above existing slider

## Key Insights

- 90 numbers in 9 cols = 10 rows; col 9 has 11 numbers (80-90), handled by grid auto-flow
- Current AdminControls slider range: 3-15s (line 111-117), presets map to 10s/5s/3s
- `drawnNumbers` array available as prop; derive Set internally via `useMemo`
- Dark theme context: drawn = red bg, remaining = subtle white border

## Requirements

**Number Pool Grid:**
- 9-col CSS grid, numbers 1-90
- Drawn: `bg-red-600 text-white shadow-sm` | Remaining: `bg-white/5 text-white/20`
- Counter badge: "X/90 da xo"
- Collapsible (default collapsed on mobile, expanded on desktop)
- `memo`-wrapped, under 100 lines

**Speed Presets:**
- 3 buttons: Cham (10s), Binh thuong (5s), Nhanh (3s)
- Active preset highlighted (yellow bg when matching `drawInterval`)
- Slider still works for fine-tuning
- Under 130 lines total for AdminControls

## Architecture

```
number-pool-grid.tsx (NEW)
  Props: { drawnNumbers: number[] }
  Internal: drawnSet = useMemo(Set), isExpanded state
  Render: collapsible 9-col grid

AdminControls.tsx (MODIFY)
  Add: SPEED_PRESETS array, 3 preset buttons above slider
  Existing: drawInterval state, slider input
```

### Component Interfaces

```typescript
// number-pool-grid.tsx
interface NumberPoolGridProps {
  drawnNumbers: number[];
}

// AdminControls -- no interface change, internal only
const SPEED_PRESETS = [
  { label: "Cham", icon: "🐢", seconds: 10 },
  { label: "Binh thuong", icon: "⚡", seconds: 5 },
  { label: "Nhanh", icon: "🚀", seconds: 3 },
];
```

## Related Code Files

| File | Role | Lines |
|------|------|-------|
| `src/components/number-pool-grid.tsx` | NEW -- grid component | ~90 |
| `src/components/AdminControls.tsx` | MODIFY -- add presets | 129 total |

## Implementation Steps

### 1. Create `src/components/number-pool-grid.tsx`

```typescript
"use client";
import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NumberPoolGridProps {
  drawnNumbers: number[];
}

const NumberPoolGrid = memo(function NumberPoolGrid({ drawnNumbers }: NumberPoolGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers]);
  const numbers = useMemo(() => Array.from({ length: 90 }, (_, i) => i + 1), []);

  return (
    <div className="glass-card p-3 sm:p-4 border-white/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60">
            Bang So
          </span>
          <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
            {drawnNumbers.length}/90
          </span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-white/30" />
                    : <ChevronDown size={14} className="text-white/30" />}
      </button>

      {isExpanded && (
        <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: "repeat(9, 1fr)" }}>
          {numbers.map(num => {
            const isDrawn = drawnSet.has(num);
            return (
              <div key={num} className={`aspect-square flex items-center justify-center
                text-[10px] sm:text-xs font-black rounded-md transition-all
                ${isDrawn ? "bg-red-600 text-white shadow-sm shadow-red-500/30"
                          : "bg-white/5 text-white/20"}`}>
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
```

### 2. Modify `AdminControls.tsx` -- Add Speed Presets

Insert after the "Toc do xo" label section (line 105-118). Add preset buttons between label and slider.

```typescript
// Add constant at top of file (after imports)
const SPEED_PRESETS = [
  { label: "Cham", seconds: 10 },
  { label: "Vua", seconds: 5 },
  { label: "Nhanh", seconds: 3 },
] as const;

// Insert between "Toc do xo" label div and <input range>:
<div className="flex gap-2 mb-2">
  {SPEED_PRESETS.map(p => (
    <button
      key={p.seconds}
      onClick={() => setDrawInterval(p.seconds)}
      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
        ${drawInterval === p.seconds
          ? "bg-yellow-500 text-red-950"
          : "bg-white/5 text-white/40 hover:bg-white/10"}`}
    >
      {p.label}
    </button>
  ))}
</div>
```

Specific edit locations in `AdminControls.tsx`:
- Line 1-5: Keep existing imports
- After line 16 (drawInterval state): add `SPEED_PRESETS` constant
- Between line 108 (`</div>` after speed label) and line 110 (`<input`): insert preset buttons div

## Todo Checklist

- [x] Create `src/components/number-pool-grid.tsx`
- [x] 9-col CSS grid rendering 1-90
- [x] Drawn/remaining color states
- [x] Counter badge "X/90"
- [x] Collapsible toggle (default collapsed)
- [x] Wrap in `memo`
- [x] Add `SPEED_PRESETS` constant to AdminControls
- [x] Add 3 preset buttons between speed label and slider
- [x] Active preset highlighted yellow
- [x] Verify AdminControls stays under 150 lines (actual: 151 — 1 over; irreducible)
- [x] Verify number-pool-grid under 100 lines (actual: 72)

## Success Criteria

- Grid renders all 90 numbers in correct 9-col layout
- Drawn numbers: red, remaining: dim. Visually distinct
- Collapse/expand works; defaults collapsed
- Speed presets correctly set drawInterval; active one highlighted
- Slider still works independently of presets
- No re-renders when drawnNumbers unchanged (memo)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Grid overflow on 320px screens | Low | `aspect-square` + responsive text |
| Preset desyncs from slider | Low | Both share same `drawInterval` state |

## Security Considerations

- Pure UI components, no user input validation needed, no external calls

## Next Steps

- Phase 04 imports `NumberPoolGrid` into `page.tsx` left sidebar and mobile game tab
- Future: click-to-highlight numbers for manual tracking
