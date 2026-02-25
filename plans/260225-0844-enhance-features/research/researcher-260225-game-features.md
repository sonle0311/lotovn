# Research: Auto-mark, Number Pool UI, Score Tracking & Ticket Persistence

**Date**: 2025-02-25
**Codebase**: Next.js 15 + Supabase Realtime, React 18+
**Scope**: Vietnamese Lô Tô web game enhancements

---

## Topic 1: Auto-mark Pattern with Manual-mark Merge

### React Pattern Overview
**Current state**: `markedNumbers` is manual-only (`toggleMark()` in useGameRoom.ts, line 540-551).

**Auto-mark + Manual merge strategy**:
```typescript
// Add to useGameRoom.ts state
const [autoMarkEnabled, setAutoMarkEnabled] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('loto-auto-mark') === 'true';
  }
  return false;
});

// Persist preference
useEffect(() => {
  localStorage.setItem('loto-auto-mark', String(autoMarkEnabled));
}, [autoMarkEnabled]);

// Auto-mark effect: when new number drawn, mark if enabled
useEffect(() => {
  if (!autoMarkEnabled || !myTicket || gameStatus !== 'playing') return;

  setMarkedNumbers(prev => {
    const next = new Set(prev);
    myTicket.frames.forEach(frame => {
      frame.forEach(row => {
        row.forEach(num => {
          if (num !== null && drawnNumbers.includes(num) && !prev.has(num)) {
            next.add(num);
          }
        });
      });
    });
    return next;
  });
}, [drawnNumbers, autoMarkEnabled, myTicket, gameStatus]);
```

**Set operation merge** (avoid conflicts):
- Use `Set.prototype` for O(1) lookups
- Auto-mark **only adds** drawn numbers to marked set
- Manual toggle still works: toggle can remove auto-marked numbers
- No double-marking risk (Set deduplicates naturally)

### localStorage Key Structure
```
'loto-auto-mark' → boolean (true/false)
'loto-ticket-{roomId}' → existing, preserved
```

---

## Topic 2: Number Pool Grid Visualization

### Layout Design for 90 Numbers
**Target**: 9-column layout (1-9, 10-19...80-90), mobile-compact

```typescript
// NumberPool.tsx component
interface NumberPoolProps {
  drawnNumbers: number[];
  allNumbers?: number[]; // default: 1-90
}

const NumberPool = ({ drawnNumbers, allNumbers = Array.from({length:90}, (_,i)=>i+1) }) => {
  const drawnSet = new Set(drawnNumbers);

  // Grid: 10 rows (0-9, 10-19...80-89), 9 cols
  const columns = Array.from({ length: 9 }, (_, col) =>
    Array.from({ length: 10 }, (_, row) => col * 10 + row + 1)
  );

  return (
    <div className="grid gap-0.5 p-2 bg-black/5 rounded-lg"
         style={{ gridTemplateColumns: 'repeat(9, minmax(24px, 1fr))' }}>
      {allNumbers.map(num => {
        const isDrawn = drawnSet.has(num);
        return (
          <div
            key={num}
            className={`
              w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center
              text-[10px] sm:text-xs font-bold rounded-sm
              transition-all duration-200
              ${isDrawn
                ? 'bg-red-500 text-white shadow-md scale-105'
                : 'bg-white border border-gray-300 text-gray-700'
              }
            `}
            title={`${num < 10 ? '0' : ''}${num}`}
          >
            {num < 10 ? '0' : ''}{num % 10 === 0 ? 90 : num % 10}
          </div>
        );
      })}
    </div>
  );
};
```

**Mobile optimization**:
- Flex-wrap or CSS grid with `minmax()` for responsiveness
- Cell size: 24px (mobile) → 32px (desktop)
- Gap: 2px (prevents grid bloat)
- Color contrast: white → red (high accessibility)
- "Density" ≈ 9 cols fits mobile 375px width

### Compact variant
```css
.number-pool {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0.125rem; /* ultra-tight for mobile */
  font-size: clamp(0.625rem, 2vw, 0.875rem);
}

.number-cell {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}
```

---

## Topic 3: localStorage Win Counter Per Session

### Structure & Keys
```typescript
interface GameSession {
  roomId: string;
  playerName: string;
  wins: number;
  gameStartedAt: number;
}

// Storage key
const SESSION_KEY = `loto-session-${roomId}-${playerName}`;

// Initialize on room join
const initSession = (roomId: string, playerName: string) => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (!existing) {
    const session: GameSession = {
      roomId,
      playerName,
      wins: 0,
      gameStartedAt: Date.now()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

// Increment on win
const recordWin = () => {
  const session = JSON.parse(
    localStorage.getItem(SESSION_KEY) || '{}'
  ) as GameSession;
  session.wins++;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// On game_end broadcast (useGameRoom.ts line 284-288)
useEffect(() => {
  if (winner && gameStatus === 'ended') {
    if (winner.name === playerName) {
      recordWin();
    }
  }
}, [winner, gameStatus, playerName]);
```

### Reset Strategy
**Option A: Per-round persistence** (recommended)
- `recordWin()` increments counter, stays across rounds
- Win counter visible in UI: "Wins this session: X"
- Only cleared when player leaves room

**Option B: Full game reset clears counter**
```typescript
// In applyGameReset() useGameRoom.ts line 159-167
const clearSessionIfReset = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};
```

---

## Topic 4: Keep Ticket Across Rounds

### Current Flow Problem
- `resetGame()` calls `applyGameReset(true)` (clears markedNumbers)
- Ticket is **not** cleared (stored in `loto-ticket-{roomId}` localStorage)
- **Issue**: `regenerateTicket()` prompts user every round

### Solution: "Keep Ticket" Flag + Smart Prompt

```typescript
// Add to useGameRoom.ts
const [keepTicketPref, setKeepTicketPref] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('loto-keep-ticket') === 'true';
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('loto-keep-ticket', String(keepTicketPref));
}, [keepTicketPref]);

// Modify regenerateTicket with flag check
const regenerateTicket = useCallback(() => {
  if (gameStatusRef.current !== 'waiting') return;

  // Skip prompt if user prefers to keep ticket
  if (keepTicketPref) return;

  const newTicket = generateTicket();
  setMyTicket(newTicket);
}, [keepTicketPref]);

// Add explicit action for user-triggered regeneration
const forceRegenerateTicket = useCallback(() => {
  const newTicket = generateTicket();
  setMyTicket(newTicket);
}, []);
```

### Game Reset Behavior
```typescript
// resetGame() in useGameRoom.ts (line 553-567)
const resetGame = useCallback(() => {
  if (!isHostRef.current) return;

  // Broadcast reset (clears drawnNumbers, markedNumbers, winner state)
  channelRef.current?.send({ type: 'broadcast', event: 'game_reset', payload: {} });

  // applyGameReset(true) clears messages, leaves ticket intact
  setGameStatus('waiting');
  gameStatusRef.current = 'waiting';
  applyGameReset(true);

  // Ticket is PRESERVED (not cleared)
  // markedNumbers cleared by applyGameReset → clean slate next round

  trackPresence({ status: 'waiting' });
}, [applyGameReset, trackPresence]);
```

### UI: Keep Ticket Toggle
```typescript
// In room settings/menu
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={keepTicketPref}
    onChange={(e) => setKeepTicketPref(e.target.checked)}
    className="w-4 h-4"
  />
  <span className="text-sm">Keep this ticket for next round</span>
</label>

<button onClick={forceRegenerateTicket} className="btn-secondary">
  Get New Ticket (discard current)
</button>
```

---

## Summary Table

| Topic | Implementation | Key Storage | Conflict Resolution |
|-------|---|---|---|
| **Auto-mark** | useEffect on drawnNumbers, Set merge | `loto-auto-mark` bool | Set dedup, manual can remove auto-marks |
| **Number Pool UI** | 9-col grid, CSS grid/flex layout | None (compute from drawnNumbers) | Color: red=drawn, white=remaining |
| **Win Score** | Increment on game_end event, JSON session | `loto-session-{roomId}-{playerName}` | Persists until room exit or manual clear |
| **Keep Ticket** | Skip regenerate prompt if flag=true | `loto-keep-ticket` bool | markedNumbers always cleared on reset |

---

## Unresolved Questions
- Should keep-ticket preference be per-room or global?
- Should win counter expire after session timeout (e.g., 30min idle)?
- Auto-mark performance: batch Set updates or per-number?
- Number pool grid: show only 1-90 or custom pool?
