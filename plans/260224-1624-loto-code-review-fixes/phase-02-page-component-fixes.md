# Phase 02: Page Component Fixes

**Context:** [← plan.md](./plan.md)
**Dependencies:** None (parallel with Phase 01, 03)

## Parallelization Info
- **Can run concurrently with:** Phase 01, Phase 03
- **Must wait for:** Nothing (Phase 01 exports MAX_PLAYERS but the import change is local to this file)
- **Must complete before:** Nothing

## Overview
- **Date:** 260224-1624
- **Description:** Fix 8 issues in `src/app/room/[roomId]/page.tsx`
- **Priority:** Critical + High + Medium + Low
- **Status:** ✅ Done
- **Review:** ⏳ Pending

## File Ownership (EXCLUSIVE)
- `src/app/room/[roomId]/page.tsx` ← ONLY this phase touches this file

## Issues to Fix (Priority Order)

### [CRITICAL] MAX_PLAYERS TDZ bug
- Line 96: Remove `const MAX_PLAYERS = 20;`
- Line 4: Add `MAX_PLAYERS` to import from `@/lib/useGameRoom`
  - `import { useGameRoom, WinnerData, MAX_PLAYERS } from "@/lib/useGameRoom";`
- This fixes the TDZ ReferenceError in the useEffect at line 88

### [HIGH] Remove isMounted dead state
- Line 67: Remove `const [isMounted, setIsMounted] = useState(false);`
- Lines 79-83: Remove `setIsMounted(true)` from the useEffect (keep the router.push logic)
- Line 304: Change `{isMounted && isHost && <AdminControls .../>}` → `{isHost && <AdminControls .../>}`

### [HIGH] Extract winner modal IIFEs → useMemo
- Lines 446-602: Remove the outer IIFE wrapper `{(() => { ... })()} `
- Before the `return` statement, add:
  ```tsx
  const winnerMarkedSet = useMemo(
    () => new Set(winner?.markedNumbers ?? []),
    [winner]
  );
  const invalidNumbers = useMemo(
    () => winner?.markedNumbers.filter(n => !drawnNumbersSet.has(n)) ?? [],
    [winner, drawnNumbersSet]
  );
  const isVerified = invalidNumbers.length === 0;
  ```
- In the `<AnimatePresence>` for winner modal, render directly (no outer IIFE)
- For inner IIFE (drawn history, lines 516-585): extract logic as variables inside the modal JSX block
  - Move `winningNumbers`, `reversedHistory`, `containerVariants`, `itemVariants` out of IIFE
  - Render the motion.div directly

### [MEDIUM] Fix gameStatus 'ended' header text
- Line 243: Change ternary from:
  `gameStatus === 'playing' ? "Đang xổ" : "Chờ bắt đầu"`
  To:
  `gameStatus === 'playing' ? "Đang xổ" : gameStatus === 'ended' ? "Kết thúc" : "Chờ bắt đầu"`

### [MEDIUM] Extract duplicate regenerateTicket handlers
- Lines 344-358 and 364-377 have near-identical onClick handlers
- Add before the return:
  ```tsx
  const handleRegenerateTicket = (description: string) => {
    regenerateTicket();
    toast.success("Đã đổi vé mới!", { icon: "🎫", description });
  };
  ```
- Replace both onClick handlers with `() => handleRegenerateTicket("Chúc bạn may mắn!")` and `() => handleRegenerateTicket("Chúc bạn may mắn ván sau!")`

### [MEDIUM] Guard navigator.clipboard
- Line 210: Wrap in try/catch:
  ```tsx
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => toast.info("Đã sao chép mã phòng: " + roomId))
      .catch(() => toast.error("Không thể sao chép. Hãy copy thủ công: " + roomId));
  };
  ```

### [LOW] Remove onClick wrapper
- Line 589: `onClick={() => resetGame()}` → `onClick={resetGame}`

## Implementation Steps
1. Add `MAX_PLAYERS` to import, remove local const declaration
2. Remove `isMounted` state, its setter, and guard in JSX
3. Add `winnerMarkedSet`, `invalidNumbers`, `isVerified` as useMemo before return
4. Replace outer winner modal IIFE with direct JSX block using those memo values
5. Replace inner drawn history IIFE — hoist variables above JSX, render directly
6. Fix gameStatus ternary to handle 'ended' state
7. Extract `handleRegenerateTicket` helper, replace 2 duplicate handlers
8. Wrap clipboard call with `.then`/`.catch`
9. Replace onClick wrapper with direct ref

## Success Criteria
- [ ] No `const MAX_PLAYERS` in page.tsx; imported from useGameRoom
- [ ] No `isMounted` state
- [ ] Winner modal uses `useMemo` values, zero IIFEs in JSX
- [ ] Header shows "Kết thúc" when gameStatus === 'ended'
- [ ] Single `handleRegenerateTicket` function used in both places
- [ ] Clipboard copy has error handling
- [ ] `onClick={resetGame}` (no wrapper)

## Conflict Prevention
- This phase ONLY modifies `src/app/room/[roomId]/page.tsx`
- Phase 01 exports `MAX_PLAYERS` — import here is independent (can declare import even before Phase 01 lands since ts compiler sees it)
- Phase 03 does not touch this file

## Risk Assessment
- Medium: IIFE removal is the largest change — careful with JSX scoping of winner modal variables
- Low: All other fixes are surgical 1-5 line changes
