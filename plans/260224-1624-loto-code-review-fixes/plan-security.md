# Plan: Security Architecture Fixes
**Date:** 260224-1624
**Status:** Pending
**Priority:** Critical
**Parent plan:** [plan.md](./plan.md)

## Summary
Two security vulnerabilities allow: (1) any user to spoof host role via URL param, (2) any player to fake a win by broadcasting arbitrary marked numbers. Fix both using a Supabase `rooms` DB table for host authority and host-side win validation via broadcast events.

## Threat Model

### Issue 1: isHost URL Spoof
- **Vector:** Navigate to `/room/ABC?host=true` -> instant host privileges
- **Impact:** Unauthorized game control (start/draw/reset), host migration hijack
- **Root cause:** `isHost` derived from `window.location.search` (line 91 of useGameRoom.ts)
- **Fix:** DB-backed host identity via `rooms` table lookup

### Issue 2: declareWin No Server Validation
- **Vector:** Broadcast `player_win` with fabricated `markedNumbers` array
- **Impact:** Win without playing; all clients accept unconditionally (line 247-251)
- **Root cause:** No validation of `markedNumbers` against `drawnNumbers`
- **Fix:** Two-phase win: client sends `win_request`, host validates, host broadcasts `game_end`

## Architecture Decision

### Why DB table (not Edge Function)?
- Project constraint: no Edge Functions, anon key only
- `rooms` table is minimal overhead (one INSERT per room creation, one SELECT per join)
- RLS provides sufficient access control for party game context

### Why host validates (not server)?
- No server-side logic available (no Edge Functions)
- Host has authoritative `drawnNumbersRef.current` state
- Acceptable trust model: host is room creator, party game context

### Win Validation Flow (Issue 2)
```
Player clicks KINH! -> broadcasts `win_request` (ticket + markedNumbers)
                            |
                     Host receives `win_request`
                            |
                     Host runs checkRowWin/checkFullCardWin
                     against drawnNumbersRef.current
                            |
               Valid?  -----+------ Invalid?
                |                      |
         Host broadcasts          Host broadcasts
         `game_end`               `win_rejected`
         (winner data)            (reason)
                |                      |
         All clients:             Requester:
         setWinner()              toast error
         setGameStatus('ended')
```

## Dependency Graph
```
Phase 04 (roomService.ts - NEW) ──┐
                                   ├── PARALLEL
Phase 05 (page.tsx)              ──┘
                                   |
                                   v SEQUENTIAL (Phase 04 must exist)
Phase 06 (useGameRoom.ts)       ──┘
```

## File Ownership Matrix
| File | Phase | Action |
|------|-------|--------|
| `src/lib/room-service.ts` | Phase 04 | CREATE |
| `src/app/page.tsx` | Phase 05 | MODIFY |
| `src/lib/useGameRoom.ts` | Phase 06 | MODIFY |

## SQL Migration (run in Supabase Dashboard)
Documented in Phase 04. Must be run BEFORE deploying code changes.

## Phases
| # | Phase | Status | Depends On | File |
|---|-------|--------|------------|------|
| 04 | [Room Service](./phase-04-room-service.md) | Pending | SQL migration | room-service.ts (NEW) |
| 05 | [Landing Page Security](./phase-05-landing-page-security.md) | Pending | None | page.tsx |
| 06 | [Game Room Security](./phase-06-game-room-security.md) | Pending | Phase 04 complete | useGameRoom.ts |

## Execution Order
1. Run SQL migration in Supabase Dashboard (prerequisite)
2. Phase 04 + Phase 05 in PARALLEL
3. Phase 06 SEQUENTIAL after Phase 04

## Constraints
- No Edge Functions, no service_role key
- Supabase anon key only (client-side)
- Party game -> host_name is sufficient authority (not cryptographic)
- Preserve all existing gameplay behavior (start, draw, reset, chat, presence, host migration)
- Keep files under 200 lines per development rules
- Use kebab-case for new file names

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Race condition: two users create room with same ID simultaneously | `ON CONFLICT DO NOTHING` + SELECT after INSERT to verify |
| Host leaves mid-validation of `win_request` | Existing host migration handles this; new host inherits `drawnNumbersRef` |
| Player name collision (two "Minh" in same room) | Pre-existing issue, out of scope for this plan |
| RLS too permissive (anon INSERT) | Acceptable for party game; room_id is random 5-char, ephemeral |

## Unresolved Questions
None. All design decisions finalized.
