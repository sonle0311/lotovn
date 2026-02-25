# Plan: LotoVN Code Review Fixes
**Date:** 260224-1624
**Status:** 🟡 Pending
**Priority:** High

## Summary
Fix all issues from parallel code review across 20 items (2 critical, 6 high, 10 medium, 2 low).
All 3 phases are **fully parallel** — zero file overlap.

## Dependency Graph
```
Phase 01 (useGameRoom.ts)  ──┐
Phase 02 (page.tsx)        ──┼── ALL PARALLEL → done
Phase 03 (LotoCard + CSS)  ──┘
```

## Execution Strategy
**Phases 01, 02, 03 → launch simultaneously** (no dependencies, no shared files)

## File Ownership Matrix
| File | Phase |
|------|-------|
| `src/lib/useGameRoom.ts` | Phase 01 |
| `src/app/room/[roomId]/page.tsx` | Phase 02 |
| `src/components/LotoCard.tsx` | Phase 03 |
| `src/app/globals.css` | Phase 03 |

## Phases
| # | Phase | Status | Parallel Group | File |
|---|-------|--------|----------------|------|
| 01 | [useGameRoom Hook Fixes](./phase-01-use-game-room-fixes.md) | ✅ Done | A (parallel) | useGameRoom.ts |
| 02 | [Page Component Fixes](./phase-02-page-component-fixes.md) | ✅ Done | A (parallel) | page.tsx |
| 03 | [LotoCard + CSS Fixes](./phase-03-lotocard-css-fixes.md) | ✅ Done | A (parallel) | LotoCard.tsx, globals.css |

## Security Architecture Fixes (Phases 04-06)
See [plan-security.md](./plan-security.md) for full security plan.

| # | Phase | Status | Depends On | File |
|---|-------|--------|------------|------|
| 04 | [Room Service](./phase-04-room-service.md) | Pending | SQL migration | room-service.ts (NEW) |
| 05 | [Landing Page Security](./phase-05-landing-page-security.md) | Pending | None | page.tsx |
| 06 | [Game Room Security](./phase-06-game-room-security.md) | Pending | Phase 04 | useGameRoom.ts |

**Execution:** Phase 04 + 05 parallel -> Phase 06 sequential

## Issue Count
- Critical: 2 → both fixed in Phase 01+02
- High: 6 → distributed across phases
- Medium: 10 → distributed across phases
- Low: 2 → fixed in Phase 01+02
