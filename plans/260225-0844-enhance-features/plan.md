# LotoVN Enhancement Plan

**Date:** 260225 | **Status:** completed | **No SQL migrations required**

---

## Phases

### Group A -- Parallel (no shared files between phases)

| # | Phase | New/Modified Files | Status |
|---|-------|--------------------|--------|
| 01 | [Sound System](./phase-01-sound-system.md) | NEW `src/lib/use-sound-system.ts`, EDIT `src/components/NumberDrawing.tsx` | completed |
| 02 | [Number Pool + Speed Presets](./phase-02-number-pool-speed-presets.md) | NEW `src/components/number-pool-grid.tsx`, EDIT `src/components/AdminControls.tsx` | completed |
| 03 | [PWA Enhancement](./phase-03-pwa.md) | NEW `src/app/manifest.ts`, EDIT `src/app/layout.tsx`, EDIT `public/manifest.json` | completed |

### Group B -- Sequential (depends on Group A completing)

| # | Phase | New/Modified Files | Status |
|---|-------|--------------------|--------|
| 04 | [Game Features + Integration](./phase-04-game-features-integration.md) | EDIT `src/lib/useGameRoom.ts`, EDIT `src/app/room/[roomId]/page.tsx`, EDIT `src/components/PlayerList.tsx` | completed |

```
Phase 01 (Sound)  ---\
Phase 02 (Pool)   ----+---> Phase 04 (Integration: auto-mark, keep-ticket, score, URL, wiring)
Phase 03 (PWA)    ---/
```

## Feature Map

1. **Sound System** -- Wire non-functional isMuted to TTS (vi-VN) + Web Audio SFX
2. **Number Pool Grid** -- 9-col 1-90 board (drawn=red, remaining=dim)
3. **Draw Speed Presets** -- 3 quick buttons (3s/5s/10s) in AdminControls
4. **PWA** -- Programmatic manifest.ts + apple-web-app metadata
5. **Auto-mark** -- Toggle to auto-add drawn numbers to markedNumbers Set
6. **Keep Ticket** -- Fix disabled "Giu Ve Cu", localStorage preference
7. **Session Score** -- Win counter per room/player in localStorage
8. **URL Sharing** -- Copy full room URL instead of room code only

## Constraints

- Zero new npm packages (Web APIs only)
- Mobile-first (375px baseline)
- Files under 200 lines, kebab-case new filenames
- YAGNI / KISS / DRY

## Research

- [Sound + PWA](./research/researcher-260225-sound-pwa.md)
- [Game Features](./research/researcher-260225-game-features.md)

## Unresolved Questions

- iOS vi-VN voice availability varies by device; fallback to default voice acceptable?
- PNG icon creation for PWA (192x192 + 512x512) is a design task, not code
