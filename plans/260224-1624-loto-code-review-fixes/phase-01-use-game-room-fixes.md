# Phase 01: useGameRoom Hook Fixes

**Context:** [← plan.md](./plan.md)
**Dependencies:** None

## Parallelization Info
- **Can run concurrently with:** Phase 02, Phase 03
- **Must wait for:** Nothing
- **Must complete before:** Nothing

## Overview
- **Date:** 260224-1624
- **Description:** Fix 8 issues in `src/lib/useGameRoom.ts`
- **Priority:** Critical + High + Medium
- **Status:** ✅ Done
- **Review:** ⏳ Pending

## File Ownership (EXCLUSIVE)
- `src/lib/useGameRoom.ts` ← ONLY this phase touches this file

## Issues to Fix (Priority Order)

### [CRITICAL] Export MAX_PLAYERS
- Line 16: Add `export` to `const MAX_PLAYERS = 20`
- Required by Phase 02 to import instead of redeclaring with TDZ bug

### [HIGH] isRoomFull never resets
- Line 173-175: Change `if (playerList.length >= MAX_PLAYERS) { setIsRoomFull(true); }`
- To: `setIsRoomFull(playerList.length >= MAX_PLAYERS);`
- Remove the `if` wrapper entirely

### [HIGH] Action callbacks use stale `isHost` state
- Lines 356, 386, 488: Replace `if (!isHost) return;` with `if (!isHostRef.current) return;`
- Affects: `startGame`, `drawNumber`, `resetGame`
- Also remove `isHost` from dependency arrays of these useCallbacks

### [HIGH] 4x duplicate reset logic → extract helper
- Create `const applyGameReset = useCallback(...)` before `startGame`
- Consolidate the 5 setState calls repeated in `startGame` (line 359-365), `game_start` handler (line 208-213), `game_reset` handler (line 222-228), `resetGame` (line 495-502)
- Helper signature: `applyGameReset(clearMessages = false)`

### [MEDIUM] waiting_kinh timeout leaks on unmount
- Line 251: `setTimeout(() => setWaitingKinhPlayer(null), 5000)` — no cleanup
- Add `const waitingKinhTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
- Replace with: `waitingKinhTimerRef.current = setTimeout(...)`
- Clear in channel useEffect cleanup: `if (waitingKinhTimerRef.current) clearTimeout(waitingKinhTimerRef.current);`

### [MEDIUM] Dead `ticket_changed` broadcast
- Lines 513-517: Remove the `channelRef.current?.send(...)` block in `regenerateTicket`
- No handler registered for this event anywhere

### [MEDIUM] presenceToPlayers `any` casts
- Line 45: Replace `(a: any, b: any)` with properly typed sort
- Add `type PresenceEntry = Record<string, unknown>;`
- Replace cast at line 52 with typed variable

### [LOW] String.substr deprecated
- Line 422: `.toString(36).substr(2, 9)` → `.toString(36).substring(2, 11)`

## Implementation Steps
1. Add `export` to `MAX_PLAYERS` constant
2. Fix `isRoomFull` setter to be unconditional (remove if-wrapper)
3. Replace `if (!isHost)` guards with `if (!isHostRef.current)` in all 3 action callbacks
4. Extract `applyGameReset` helper, refactor 4 call sites
5. Add `waitingKinhTimerRef`, replace setTimeout with ref-tracked version, add cleanup
6. Remove dead `ticket_changed` broadcast block
7. Add `PresenceEntry` type, remove `any` in presenceToPlayers sort
8. Fix `.substr` → `.substring`

## Success Criteria
- [x] `MAX_PLAYERS` exported
- [x] `isRoomFull` resets when players leave (set unconditionally)
- [x] Action callbacks use `isHostRef.current` guard
- [x] No duplicate reset setState blocks (single `applyGameReset`)
- [x] No setTimeout leak (uses ref + cleanup)
- [x] No `ticket_changed` broadcast
- [x] No `any` in `presenceToPlayers` sort params
- [x] `.substr` replaced with `.substring`

## Conflict Prevention
- This phase ONLY modifies `src/lib/useGameRoom.ts`
- Phase 02 only reads the exported `MAX_PLAYERS` — no write conflict
- Phase 03 does not touch this file at all

## Risk Assessment
- Low: `applyGameReset` refactor touches many lines but logic is identical
- Low: Removing `ticket_changed` broadcast is safe (no registered handler)
- Note: `isHost` security (client URL spoof) is a fundamental architecture limitation — NOT fixable without Supabase DB backend. Document in code comment only.
