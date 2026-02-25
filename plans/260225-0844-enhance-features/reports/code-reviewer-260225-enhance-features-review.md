# Code Review Summary

## Scope
- **Files reviewed**: 9 (3 new, 6 modified)
  - `src/lib/use-sound-system.ts` (NEW)
  - `src/components/number-pool-grid.tsx` (NEW)
  - `src/app/manifest.ts` (NEW)
  - `src/components/NumberDrawing.tsx`
  - `src/components/AdminControls.tsx`
  - `src/app/layout.tsx`
  - `src/lib/useGameRoom.ts`
  - `src/app/room/[roomId]/page.tsx`
  - `src/components/PlayerList.tsx`
- **Lines analyzed**: ~1 050
- **Review focus**: Phase 01-04 enhancement additions from git diff
- **Build status**: `next build` passes; `tsc --noEmit` exits 0 (no type errors)
- **Updated plans**: `plans/260225-0844-enhance-features/plan.md`, `phase-04-game-features-integration.md`

---

## Overall Assessment

Code quality is high. The implementation faithfully follows the plan spec, is SSR-safe throughout, and ships zero new npm dependencies as required. TypeScript is strict (no `any` except the justified `webkitAudioContext` cast and `Record<string,unknown>` for untyped Supabase Presence payloads). Three actionable issues: one HIGH (AudioContext leak), two MEDIUM (DRY violation and IIFE in JSX), and a handful of LOW items. No security or data-loss issues found.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `use-sound-system.ts` lines 13-34: AudioContext is never closed (memory/resource leak)

**Problem**: `audioCtxRef.current` is created once and stored in a ref. When the component unmounts (user navigates away), `AudioContext` is never closed. Browsers cap the number of concurrent `AudioContext` instances (Chrome: 6). In a SPA where users move between lobby and room, this will silently fail after 6 navigations.

**Fix**: Add a cleanup in a `useEffect` that closes the context on unmount:
```typescript
useEffect(() => {
  return () => {
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  };
}, []);
```

---

## Medium Priority Improvements

### M1 — `AdminControls.tsx` lines 29-35 and 94-98: draw-number logic duplicated

**Problem**: The "pick a random available number" block (`allNumbers filter -> drawnSet -> available[randomIndex]`) appears verbatim in both the auto-draw `useEffect` and the manual draw button `onClick`. Any change to the pool algorithm (e.g. seeded RNG, weighted distribution) must be updated in both places.

**Fix**: Extract a local helper once above the component:
```typescript
function pickRandomAvailable(drawnNumbers: number[]): number | null {
  const drawnSet = new Set(drawnNumbers);
  const available = Array.from({ length: 90 }, (_, i) => i + 1).filter(n => !drawnSet.has(n));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}
```
Then call `pickRandomAvailable(drawnNumbers)` in both places.

### M2 — `room/[roomId]/page.tsx` lines 554-623: IIFE in JSX for draw history section

**Problem**: The winning-number detection and animation-variant definitions inside `{(() => { ... })()}` execute on every render and define two plain-object constants (`containerVariants`, `itemVariants`) inline. This bypasses React's reconciliation hinting, makes the JSX tree harder to read, and forces fresh object creation each render.

**Fix**: Extract to a dedicated `DrawHistory` component or at minimum hoist `containerVariants`/`itemVariants` outside the component to module scope (they are static):
```typescript
// module-level constants (static, never change)
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1 } };
```
And lift the `winningNumbers` computation into a `useMemo`.

---

## Low Priority Suggestions

### L1 — `use-sound-system.ts` line 54: `onvoiceschanged` assignment clobbers other hooks

`speechSynthesis.onvoiceschanged` is a single global slot. If `useSoundSystem` is mounted twice (unlikely now but possible), the second assignment silently drops the first. Use `addEventListener("voiceschanged", pick)` / `removeEventListener` instead:
```typescript
speechSynthesis.addEventListener("voiceschanged", pick);
return () => speechSynthesis.removeEventListener("voiceschanged", pick);
```

### L2 — `PlayerList.tsx` line 30: `player.name[0]` can throw on empty string

`presenceToPlayers` sets `id` and `name` to `(p.name as string) || ''`. If `name` is `""`, `player.name[0]` is `undefined`, rendering nothing silently. Add a guard:
```typescript
{player.name?.[0] ?? "?"}
```

### L3 — `useGameRoom.ts` lines 337-342 and 352-358: session-win localStorage write duplicated

Identical `setSessionWins` + `localStorage.setItem` block appears in the `win_request` host handler and the `game_end` non-host handler. Extract to `incrementSessionWins()` helper function defined with `useCallback` or a plain inner function.

### L4 — `room/[roomId]/page.tsx` line 224: `window.location` unguarded

`copyRoomCode` is called only from a `onClick` handler, so it is effectively safe (no SSR execution path). However, wrapping in `if (typeof window !== "undefined")` matches the existing SSR guard style in the codebase and future-proofs against server actions.

### L5 — `AdminControls.tsx`: `onDraw` in `useEffect` dependency causes potential extra draw on fast re-render

`onDraw` is listed as a dep of the auto-draw effect. If the parent re-renders and passes a new `onDraw` reference (not memoized via `useCallback` in `useGameRoom`), the effect re-fires. Inspection confirms `drawNumber` in `useGameRoom` IS wrapped in `useCallback([])`, so this is safe now but fragile. A `useRef` stable-ref pattern would be more defensive.

### L6 — `number-pool-grid.tsx` line 18: `numbers` `useMemo` with empty deps is equivalent to a module constant

`Array.from({ length: 90 }, (_, i) => i + 1)` is pure and static. It should be a module-level `const` to avoid even the trivial hook call overhead:
```typescript
const ALL_NUMBERS = Array.from({ length: 90 }, (_, i) => i + 1); // outside component
```

### L7 — `manifest.ts` lines 18-19: PNG icons may not exist

`/icon-192x192.png` and `/icon-512x512.png` are referenced in the manifest but the plan notes "PNG icon creation is a design task, not code." If these files are absent from `public/`, PWA install will silently degrade. The unresolved question from the plan still applies.

### L8 — `room/[roomId]/page.tsx` line 192: confetti effect fires on every re-render when `gameStatus === 'ended'`

`useEffect([gameStatus, winner])` — if any parent causes `gameStatus` or `winner` to get a new reference while staying `'ended'`/non-null, confetti fires again. A `useRef` guard would prevent repeat firing:
```typescript
const confettiFiredRef = useRef(false);
// in effect:
if (!confettiFiredRef.current) { confetti(...); confettiFiredRef.current = true; }
// reset in applyGameReset
```

---

## Positive Observations

- **SSR safety is thorough**: every `localStorage`, `window`, and `speechSynthesis` access is guarded with `typeof window !== "undefined"` across all files.
- **Type discipline is good**: `webkitAudioContext` uses `window as unknown as { webkitAudioContext }` (double cast) instead of bare `any`; Supabase Presence casts use `Record<string, unknown>` with explicit field coercion.
- **auto-mark re-render optimization** (`changed` flag in `useGameRoom.ts:186-188`): only returns new `Set` when something actually changed — prevents spurious downstream renders. Well done.
- **`drawnSet` in `number-pool-grid.tsx`**: O(1) lookup per cell via `useMemo`-ed Set is correct and efficient for the 90-item grid.
- **Static `SPEED_PRESETS` as `as const`**: immutable, zero-cost at runtime.
- **Presence dedup in `presenceToPlayers`**: priority sort (won > playing > waiting) correctly collapses duplicate sessions per player key.
- **`NumberDrawing` and `PlayerList` wrapped in `memo`**: appropriate since they receive stable primitive/array props.
- **`aria-live="polite" aria-atomic="true"`** on the floating current-number badge: correct approach for announcing draws to screen readers.
- **build output is clean**: 0 TypeScript errors, 0 Next.js warnings, all routes compile.

---

## Recommended Actions

1. **(H1 — do now)** Add `AudioContext.close()` cleanup in `useSoundSystem` to prevent resource exhaustion on SPA navigation.
2. **(M1 — do now)** Extract `pickRandomAvailable` helper in `AdminControls` to eliminate code duplication.
3. **(L1 — next PR)** Replace `onvoiceschanged =` assignment with `addEventListener/removeEventListener` pair.
4. **(M2 — next PR)** Extract IIFE draw-history block into `DrawHistory` component or hoist static animation variants to module scope.
5. **(L3 — next PR)** Extract duplicated session-win increment logic to a shared inner helper.
6. **(L7 — design task)** Generate and commit `/public/icon-192x192.png` and `/public/icon-512x512.png` to complete PWA icon set.
7. **(L6 — minor)** Move the static `numbers` array in `NumberPoolGrid` to module scope.

---

## Metrics

- **Type coverage**: 100% (tsc --noEmit: 0 errors)
- **Build**: passing (next build, no warnings)
- **Linting issues**: not configured (no ESLint run available); no obvious violations detected in review
- **Test coverage**: no tests observed; no regression introduced by changes
- **Files exceeding 200-line constraint**: `useGameRoom.ts` (~689 lines), `page.tsx` (~643 lines) — both flagged as accepted exceptions in the plan's risk table

---

## Task Completeness — Plan Status

All 4 phases are implemented and the build passes. Updating plan statuses below.

**Phase 01 (Sound System)**: COMPLETE — all checklist items done except browser manual test (intentionally deferred).

**Phase 02 (Number Pool + Speed Presets)**: COMPLETE — grid and presets verified in build.

**Phase 03 (PWA)**: COMPLETE — `manifest.ts` and `appleWebApp` metadata added; PNG icons still pending (design task, noted as unresolved).

**Phase 04 (Game Features + Integration)**: COMPLETE — all 16 checklist items implemented:
- `autoMarkEnabled` state + persistence
- auto-mark useEffect with `changed` optimization
- `keepTicketPref` state + persistence
- `regenerateTicket` respects `keepTicketPref`
- `forceRegenerateTicket` added
- `sessionWins` with localStorage init and increment on win (both host and non-host paths)
- `toggleAutoMark`, `toggleKeepTicket` callbacks
- `useGameRoom` return updated
- `NumberPoolGrid` placed in sidebar
- auto-mark toggle UI above ticket
- "Giu Ve Cu" wired to `toggleKeepTicket`
- "Doi Ve Moi" wired to `forceRegenerateTicket`
- `copyRoomCode` copies full URL
- win badge in `PlayerList`
- `currentPlayerName` + `sessionWins` passed to `PlayerList`

**Deferred (by plan decision)**: `playWinFanfare` wiring skipped intentionally per Phase 04 spec ("skip win fanfare wiring in Phase 04 to avoid complexity").

---

## Unresolved Questions

1. iOS vi-VN voice availability (carried over from plan) — fallback to device default is acceptable.
2. PNG icons for PWA (192x192, 512x512) still missing from `public/` — needs design/asset work before PWA install is fully functional.
3. `confetti` re-fire guard (L8 above) — low risk currently since `winner` object reference only changes once per round, but worth monitoring.
