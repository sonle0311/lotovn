# Phase 04: Game Features + Integration

**Parent**: [plan.md](./plan.md) | **Research**: [game-features](./research/researcher-260225-game-features.md)
**Date**: 260225 | **Priority**: HIGH | **Status**: completed | **Review**: completed
**Dependencies**: Phase 01, 02, 03 (Group B -- runs after Group A)

---

## Overview

Integration phase touching shared files `useGameRoom.ts` and `page.tsx`. Adds 4 game features (auto-mark, keep-ticket, session score, URL sharing) and wires Phase 01-03 outputs into game UI.

## Key Insights

- `useGameRoom.ts` return object (L575-598) is the sole data contract for `page.tsx`
- `markedNumbers` is a `Set<number>` (L98); auto-mark adds to it, manual toggle still removes
- `regenerateTicket()` (L569-573) only works in `waiting` state; keep-ticket overrides this
- `copyRoomCode()` in page.tsx (L216-219) currently copies just `roomId`
- "Giu Ve Cu" button at L396-403 is `disabled` -- needs wiring to keep-ticket pref
- `game_end` event (L284-288) sets winner; increment score counter here
- PlayerList.tsx (57 lines) can show win count badge next to player name

## Requirements

**Auto-mark Toggle:**
- `autoMarkEnabled` boolean, persisted in `localStorage('loto-auto-mark')`
- When enabled + number drawn: auto-add matching ticket numbers to `markedNumbers`
- Manual toggle can still remove auto-marked numbers
- Exposed from hook: `{ autoMarkEnabled, toggleAutoMark }`

**Keep Ticket:**
- `keepTicketPref` boolean, persisted in `localStorage('loto-keep-ticket')`
- When true: `regenerateTicket()` becomes no-op
- New `forceRegenerateTicket()` always generates new ticket
- Exposed: `{ keepTicketPref, toggleKeepTicket, forceRegenerateTicket }`

**Session Score:**
- localStorage key: `loto-session-{roomId}-{playerName}` -> `{ wins: number }`
- Increment on `game_end` when `winner.name === playerName`
- Exposed: `{ sessionWins }`
- Show in PlayerList or page header

**URL Sharing:**
- `copyRoomCode()` copies `${origin}/room/${roomId}` (full URL without name param)
- Toast message updated to show URL was copied

## Architecture

### useGameRoom.ts Additions

```typescript
// New state (add after L98 markedNumbers):
const [autoMarkEnabled, setAutoMarkEnabled] = useState(() =>
  typeof window !== "undefined" && localStorage.getItem("loto-auto-mark") === "true"
);
const [keepTicketPref, setKeepTicketPref] = useState(() =>
  typeof window !== "undefined" && localStorage.getItem("loto-keep-ticket") === "true"
);
const [sessionWins, setSessionWins] = useState(0);

// New effects:
// 1. Persist autoMarkEnabled to localStorage
// 2. Persist keepTicketPref to localStorage
// 3. Auto-mark effect: on drawnNumbers change, add matching ticket numbers
// 4. Load sessionWins from localStorage on mount
// 5. Increment sessionWins on game_end when winner === self

// Modified functions:
// regenerateTicket: skip if keepTicketPref === true
// New: forceRegenerateTicket (always regenerates)
// New: toggleAutoMark, toggleKeepTicket

// Updated return object adds:
// autoMarkEnabled, toggleAutoMark,
// keepTicketPref, toggleKeepTicket, forceRegenerateTicket,
// sessionWins
```

### page.tsx Integration Points

```
1. Import NumberPoolGrid from Phase 02
2. Import useSoundSystem playWinFanfare for win effect
3. Add auto-mark toggle UI in ticket header area
4. Wire "Giu Ve Cu" button to keepTicketPref
5. Wire "Doi Ve Moi" to forceRegenerateTicket
6. Update copyRoomCode to copy full URL
7. Place NumberPoolGrid in sidebar (desktop) and game tab (mobile)
8. Show sessionWins badge in header or PlayerList
```

### Data Flow

```
drawnNumbers change -> autoMarkEnabled check -> setMarkedNumbers(prev => merge)
game_end event -> winner.name === playerName -> incrementSessionWins()
"Giu Ve Cu" click -> toggleKeepTicket(true)
"Doi Ve Moi" click -> forceRegenerateTicket()
Share button -> copy full URL
```

## Related Code Files

| File | Role | Key Lines |
|------|------|-----------|
| `src/lib/useGameRoom.ts` | MODIFY -- add features | L98 (markedNumbers), L540-551 (toggleMark), L569-573 (regenerateTicket), L575-598 (return) |
| `src/app/room/[roomId]/page.tsx` | MODIFY -- wire UI | L41-63 (destructuring), L216-219 (copyRoomCode), L329-434 (grid layout), L386-405 (ticket buttons) |
| `src/components/PlayerList.tsx` | MODIFY -- win badge | L20-51 (player row) |
| `src/components/number-pool-grid.tsx` | IMPORT from Phase 02 | -- |

## Implementation Steps

### Step 1: Add state + effects to `useGameRoom.ts`

**1a. New state declarations** (after L98):
```typescript
const [autoMarkEnabled, setAutoMarkEnabled] = useState(() =>
  typeof window !== "undefined" && localStorage.getItem("loto-auto-mark") === "true"
);
const [keepTicketPref, setKeepTicketPref] = useState(() =>
  typeof window !== "undefined" && localStorage.getItem("loto-keep-ticket") === "true"
);
const [sessionWins, setSessionWins] = useState<number>(() => {
  if (typeof window === "undefined") return 0;
  try {
    const s = localStorage.getItem(`loto-session-${roomId}-${playerName}`);
    return s ? JSON.parse(s).wins || 0 : 0;
  } catch { return 0; }
});
```

**1b. Persistence effects** (after ticket save effect ~L130):
```typescript
useEffect(() => {
  localStorage.setItem("loto-auto-mark", String(autoMarkEnabled));
}, [autoMarkEnabled]);

useEffect(() => {
  localStorage.setItem("loto-keep-ticket", String(keepTicketPref));
}, [keepTicketPref]);
```

**1c. Auto-mark effect** (after persistence effects):
```typescript
useEffect(() => {
  if (!autoMarkEnabled || !myTicket || gameStatusRef.current !== "playing") return;
  setMarkedNumbers(prev => {
    const next = new Set(prev);
    let changed = false;
    myTicket.frames.forEach(frame =>
      frame.forEach(row =>
        row.forEach(num => {
          if (num !== null && drawnNumbers.includes(num) && !prev.has(num)) {
            next.add(num);
            changed = true;
          }
        })
      )
    );
    return changed ? next : prev;
  });
}, [drawnNumbers, autoMarkEnabled, myTicket]);
```

**1d. Session score increment** (inside existing game_end handler, ~L284-288):
After `setWinner(payload.winner)`:
```typescript
if ((payload.winner as WinnerData).name === playerName) {
  setSessionWins(prev => {
    const next = prev + 1;
    localStorage.setItem(`loto-session-${roomId}-${playerName}`, JSON.stringify({ wins: next }));
    return next;
  });
}
```
Same logic in host's local win path (~L279-281).

**1e. Modify `regenerateTicket`** (~L569):
```typescript
const regenerateTicket = useCallback(() => {
  if (gameStatusRef.current !== "waiting") return;
  if (keepTicketPref) return; // skip if keeping ticket
  const newTicket = generateTicket();
  setMyTicket(newTicket);
}, [keepTicketPref]);

const forceRegenerateTicket = useCallback(() => {
  if (gameStatusRef.current !== "waiting") return;
  setMyTicket(generateTicket());
  setKeepTicketPref(false);
}, []);
```

**1f. Toggle functions:**
```typescript
const toggleAutoMark = useCallback(() => setAutoMarkEnabled(p => !p), []);
const toggleKeepTicket = useCallback((val?: boolean) =>
  setKeepTicketPref(p => val !== undefined ? val : !p), []);
```

**1g. Update return object** (~L575):
Add to return: `autoMarkEnabled, toggleAutoMark, keepTicketPref, toggleKeepTicket, forceRegenerateTicket, sessionWins`

### Step 2: Update `page.tsx`

**2a. Destructure new values** (~L41-63):
Add `autoMarkEnabled, toggleAutoMark, keepTicketPref, toggleKeepTicket, forceRegenerateTicket, sessionWins` to destructuring.

**2b. Import NumberPoolGrid:**
```typescript
import NumberPoolGrid from "@/components/number-pool-grid";
```

**2c. Place NumberPoolGrid in left sidebar** (~L347, after NumberDrawing):
```typescript
<NumberPoolGrid drawnNumbers={drawnNumbers} />
```

**2d. Add auto-mark toggle** (above LotoCard, ~L360):
```typescript
<div className="flex items-center justify-between px-2">
  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
    Phieu cua ban
  </span>
  <label className="flex items-center gap-2 cursor-pointer">
    <span className="text-[10px] font-black text-white/30">Tu dong danh</span>
    <div className={`w-8 h-4 rounded-full transition-colors relative ${autoMarkEnabled ? "bg-yellow-500" : "bg-white/10"}`}
         onClick={toggleAutoMark}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${autoMarkEnabled ? "left-4.5" : "left-0.5"}`} />
    </div>
  </label>
</div>
```

**2e. Wire "Giu Ve Cu" button** (~L396-403):
Replace `disabled` button:
```typescript
<button
  onClick={() => toggleKeepTicket(true)}
  className={`px-6 py-2.5 border rounded-xl font-bold text-sm flex items-center gap-2 btn-tactile transition-all
    ${keepTicketPref
      ? "bg-green-500/20 border-green-500/50 text-green-400"
      : "bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"}`}
>
  <Check size={18} />
  <span>{keepTicketPref ? "Da giu ve" : "Giu Ve Cu"}</span>
</button>
```

Change "Doi Ve Moi" button to call `forceRegenerateTicket()` instead of `regenerateTicket()`.

**2f. Update copyRoomCode** (~L216-219):
```typescript
const copyRoomCode = () => {
  const url = `${window.location.origin}/room/${roomId}`;
  navigator.clipboard.writeText(url)
    .then(() => toast.info("Da sao chep link phong!"))
    .catch(() => toast.error("Khong the sao chep. Link: " + url));
};
```

**2g. Wire playWinFanfare** (~L173-185, win confetti effect):
Import `useSoundSystem` or pass `playWinFanfare` from sound system. Since NumberDrawing owns the hook, alternative: lift `isMuted` state to page level OR create a second hook instance. Simplest: add `playWinFanfare` call inside `NumberDrawing` via a new `isWinner` prop, or just let the confetti effect be sufficient for Phase 04 and add win sound in future.

**Recommendation**: Skip win fanfare wiring in Phase 04 to avoid complexity. The draw beep from Phase 01 already provides audio feedback. Win fanfare can be a follow-up task.

### Step 3: Update `PlayerList.tsx` -- Win Badge

**3a. Add `currentPlayerName` and `sessionWins` props:**
```typescript
interface PlayerListProps {
  players: Player[];
  currentPlayerName?: string;
  sessionWins?: number;
}
```

**3b. Show win count next to own name** (inside player row ~L36-38):
```typescript
{player.name === currentPlayerName && sessionWins ? (
  <span className="text-[8px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full ml-1">
    {sessionWins}W
  </span>
) : null}
```

**3c. Pass props from page.tsx:**
```typescript
<PlayerList players={players} currentPlayerName={playerName} sessionWins={sessionWins} />
```

## Todo Checklist

- [ ] Add `autoMarkEnabled` state + localStorage persistence to useGameRoom
- [ ] Add auto-mark useEffect (merge drawn numbers into markedNumbers)
- [ ] Add `keepTicketPref` state + localStorage persistence
- [ ] Modify `regenerateTicket` to respect keepTicketPref
- [ ] Add `forceRegenerateTicket` function
- [ ] Add `sessionWins` state with localStorage init
- [ ] Increment sessionWins on game_end (both host and non-host paths)
- [ ] Add toggle functions: `toggleAutoMark`, `toggleKeepTicket`
- [ ] Update useGameRoom return object
- [ ] Import + place `NumberPoolGrid` in page.tsx sidebar
- [ ] Add auto-mark toggle UI above ticket
- [ ] Wire "Giu Ve Cu" button to `toggleKeepTicket`
- [ ] Wire "Doi Ve Moi" to `forceRegenerateTicket`
- [ ] Update `copyRoomCode` to copy full URL
- [ ] Add win badge to PlayerList
- [ ] Pass `currentPlayerName` + `sessionWins` to PlayerList

## Success Criteria

- Auto-mark: drawn numbers auto-added to markedNumbers when enabled
- Auto-mark toggle persists across page reloads
- Manual mark/unmark still works when auto-mark is on
- Keep ticket: "Giu Ve Cu" preserves ticket across rounds
- Force regenerate always works regardless of keep-ticket pref
- Session wins increments correctly; displays in PlayerList
- Share button copies full room URL
- NumberPoolGrid visible in sidebar (desktop) and game tab (mobile)

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| useGameRoom.ts exceeds 200 lines | High | Accept ~650-700 lines; extracting sub-hooks adds complexity without benefit |
| Auto-mark re-render storm | Medium | Only update Set if actually changed (check `changed` flag) |
| localStorage quota exceeded | Very Low | Small JSON values; no concern |
| page.tsx exceeds 200 lines | High | Already 616 lines; focus on minimal additions |

## Security Considerations

- All data is client-side localStorage; no server writes
- Auto-mark operates on local ticket data only
- Session score is self-reported (cosmetic only, no competitive implications)
- URL sharing exposes room ID but not player name

## Next Steps

- Win fanfare sound wiring (deferred -- can be separate PR)
- Auto-mark visual indicator (pulsing border on auto-marked cells)
- Session score reset button in settings
