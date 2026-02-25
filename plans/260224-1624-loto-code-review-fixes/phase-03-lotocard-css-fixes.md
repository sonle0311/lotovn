# Phase 03: LotoCard + CSS Fixes

**Context:** [← plan.md](./plan.md)
**Dependencies:** None

## Parallelization Info
- **Can run concurrently with:** Phase 01, Phase 02
- **Must wait for:** Nothing
- **Must complete before:** Nothing

## Overview
- **Date:** 260224-1624
- **Description:** Fix 4 issues across `LotoCard.tsx` and `globals.css`
- **Priority:** High + Medium
- **Status:** ✅ Done
- **Review:** ⏳ Pending

## File Ownership (EXCLUSIVE)
- `src/components/LotoCard.tsx` ← ONLY this phase
- `src/app/globals.css` ← ONLY this phase

## Issues to Fix (Priority Order)

### [HIGH] Invalid className `font-variant-numeric-tabular-nums`
- **File:** `LotoCard.tsx` line 38
- This is a CSS property name used as a Tailwind class — does nothing
- Fix: Replace with Tailwind utility `tabular-nums`
- Change: `font-variant-numeric-tabular-nums` → `tabular-nums`

### [HIGH] Unstable row/cell keys (only rowIndex)
- **File:** `LotoCard.tsx` lines 85, 88
- `key={rowIndex}` at row level — shared across all frames (all have rows 0,1,2)
- `key={\`${rowIndex}-${colIndex}\`}` at cell level — same issue
- Fix row key (line 85):
  `key={rowIndex}` → `key={\`${ticket.id}-f${frameIndex}-r${rowIndex}\`}`
- Fix cell key (line 88):
  `key={\`${rowIndex}-${colIndex}\`}` → `key={\`${ticket.id}-f${frameIndex}-r${rowIndex}-c${colIndex}\`}`

### [MEDIUM] circle-pop keyframe missing rotate → visual snap
- **File:** `globals.css` lines 125-135 + line 122
- Both `from` and `to` in `@keyframes circle-pop` lack `rotate(-10deg)`, causing snap at end
- Also: no `forwards` fill-mode, so circle reverts on completion
- Fix keyframes:
  ```css
  @keyframes circle-pop {
    from { transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1)   rotate(-10deg); opacity: 1; }
  }
  ```
- Fix `.matched-symbol` animation declaration (line 122):
  `animation: circle-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;`

### [MEDIUM] `!important` in `.loto-cell.active` blocks overrides
- **File:** `globals.css` lines 95-97
- `.loto-cell.active` uses `background: #dc2626 !important` and `color: #fff !important`
- `.active` already appears after `.matched` in source order — cascade handles priority
- Also add combined selector for explicit clarity:
  ```css
  .loto-cell.active,
  .loto-cell.matched.active {
    background: #dc2626;
    color: #fff;
    z-index: 10;
    box-shadow: 0 0 30px rgba(220, 38, 38, 0.7), inset 0 0 10px rgba(255, 255, 255, 0.4);
    transform: scale(1.05);
  }
  ```
- Remove the original `.loto-cell.active { ... !important }` block

## Implementation Steps

### LotoCard.tsx
1. Line 38: Replace `font-variant-numeric-tabular-nums` with `tabular-nums`
2. Line 85: Replace `key={rowIndex}` with `` key={`${ticket.id}-f${frameIndex}-r${rowIndex}`} ``
3. Line 88: Replace `` key={`${rowIndex}-${colIndex}`} `` with `` key={`${ticket.id}-f${frameIndex}-r${rowIndex}-c${colIndex}`} ``

### globals.css
4. Lines 125-135: Update `@keyframes circle-pop` to include `rotate(-10deg)` in both from/to
5. Line 122: Add `forwards` to `.matched-symbol` animation shorthand
6. Lines 94-101: Replace `.loto-cell.active { ...!important }` block with combined selector without `!important`

## Success Criteria
- [ ] `tabular-nums` class on number span in LotoCell
- [ ] Row keys include frameIndex + ticket.id
- [ ] Cell keys include frameIndex + ticket.id
- [ ] `circle-pop` keyframes include rotate in both from/to
- [ ] `.matched-symbol` has `forwards` fill-mode
- [ ] No `!important` in `.loto-cell.active` styles
- [ ] `.loto-cell.matched.active` combined selector present

## Conflict Prevention
- This phase ONLY modifies `LotoCard.tsx` and `globals.css`
- Phase 01 and Phase 02 do not touch these files

## Risk Assessment
- Low: All changes are targeted 1-5 line edits
- Low: Removing `!important` is safe — cascade order already handles specificity
- Low: Adding `rotate(-10deg)` to keyframes matches existing static value exactly
