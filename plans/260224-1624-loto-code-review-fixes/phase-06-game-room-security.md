# Phase 06: Game Room Security
**File:** `src/lib/useGameRoom.ts`
**Action:** MODIFY
**Status:** Pending
**Depends on:** Phase 04 complete (`room-service.ts` exists)

## Changes Overview
1. Import `getRoomHost` from room-service
2. Remove URL-based `isHost` initialization
3. Add DB-based host resolution on mount
4. Replace `declareWin` with `win_request` broadcast
5. Add `win_request` handler (host validates)
6. Add `win_rejected` handler (requester gets toast feedback)
7. Replace `player_win` handler with `game_end` handler
8. Include `game_end` in sync_state payload for late joiners

---

## Change 1: Add Import

**Location:** Top of file, after existing imports (after line 6)

**Add:**
```typescript
import { getRoomHost } from './room-service';
```

---

## Change 2: Remove URL-Based isHost Initialization

**Remove lines 90-94:**
```typescript
    // Initial host check from URL
    const isHostInitial = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('host') === 'true';
    const [isHost, setIsHost] = useState(isHostInitial);
    const isHostRef = useRef(isHostInitial);
```

**Replace with:**
```typescript
    // Host resolved from DB, default false until fetched
    const [isHost, setIsHost] = useState(false);
    const isHostRef = useRef(false);
```

---

## Change 3: Remove URL-Based isHost useEffect

**Remove lines 104-114:**
```typescript
    // Fix isHost after client hydration
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostParam = new URLSearchParams(window.location.search).get('host') === 'true';
            if (hostParam && !isHost) {
                setIsHost(true);
                isHostRef.current = true;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
```

**Replace with:**
```typescript
    // Resolve host from DB on mount
    useEffect(() => {
        let cancelled = false;
        getRoomHost(roomId).then((hostName) => {
            if (cancelled) return;
            const amHost = hostName === playerName;
            setIsHost(amHost);
            isHostRef.current = amHost;
        });
        return () => { cancelled = true; };
    }, [roomId, playerName]);
```

### Design Notes
- `cancelled` flag prevents state update after unmount
- If room not in DB (legacy room or DB error), `hostName` is null -> `isHost` stays false
- Host migration (existing `host_change` handler) still works independently of DB

---

## Change 4: Replace `player_win` Handler with `win_request` + `game_end` Handlers

### 4a: Remove the `player_win` handler

**Remove (lines 247-251 in the channel subscription chain):**
```typescript
            .on('broadcast', { event: 'player_win' }, ({ payload }) => {
                setWinner(payload.winner as WinnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            })
```

### 4b: Add `win_request` handler (host validates)

**Add in its place (in the same position in the channel chain):**
```typescript
            .on('broadcast', { event: 'win_request' }, ({ payload }) => {
                // Only the host validates win requests
                if (!isHostRef.current) return;

                const request = payload as {
                    name: string;
                    isHost: boolean;
                    ticket: LotoTicket;
                    markedNumbers: number[];
                };

                // Validate: every marked number must be in drawnNumbers
                const hostDrawnSet = new Set(drawnNumbersRef.current);
                const validMarks = request.markedNumbers.every(n => hostDrawnSet.has(n));

                if (!validMarks) {
                    channel.send({
                        type: 'broadcast',
                        event: 'win_rejected',
                        payload: { name: request.name, reason: 'invalid_marks' },
                    });
                    return;
                }

                // Validate: check actual win condition on ticket
                const markedSet = new Set(request.markedNumbers);
                const hasWin = request.ticket.frames.some(frame => {
                    const isFullWin = checkFullCardWin(frame, markedSet);
                    const isAnyRowWin = frame.some(row => checkRowWin(row, markedSet));
                    return isFullWin || isAnyRowWin;
                });

                if (!hasWin) {
                    channel.send({
                        type: 'broadcast',
                        event: 'win_rejected',
                        payload: { name: request.name, reason: 'no_win_condition' },
                    });
                    return;
                }

                // Valid win! Broadcast game_end to all
                const winnerData: WinnerData = {
                    name: request.name,
                    isHost: request.isHost,
                    ticket: request.ticket,
                    markedNumbers: request.markedNumbers,
                };
                channel.send({
                    type: 'broadcast',
                    event: 'game_end',
                    payload: { winner: winnerData },
                });

                // Local update for host (broadcast doesn't echo to sender)
                setWinner(winnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            })
```

### 4c: Add `game_end` handler (all non-host clients)

**Add immediately after `win_request` handler:**
```typescript
            .on('broadcast', { event: 'game_end' }, ({ payload }) => {
                setWinner(payload.winner as WinnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            })
```

### 4d: Add `win_rejected` handler (feedback for requester)

**Add immediately after `game_end` handler:**
```typescript
            .on('broadcast', { event: 'win_rejected' }, ({ payload }) => {
                if (payload.name === playerName) {
                    // Will be handled by the consuming component (toast)
                    console.warn('Win request rejected:', payload.reason);
                }
            })
```

**Note:** The toast for rejection is handled by the room page component. The hook just logs. We add a `winRejected` state for the page to consume.

---

## Change 5: Replace `declareWin` Implementation

**Remove (lines 437-453):**
```typescript
    const declareWin = useCallback(() => {
        if (!myTicket) return;
        const winnerData: WinnerData = {
            name: playerName,
            isHost,
            ticket: myTicket,
            markedNumbers: Array.from(markedNumbers),
        };
        channelRef.current?.send({
            type: 'broadcast',
            event: 'player_win',
            payload: { winner: winnerData },
        });
        setWinner(winnerData);
        setGameStatus('ended');
        gameStatusRef.current = 'ended';
    }, [playerName, isHost, myTicket, markedNumbers]);
```

**Replace with:**
```typescript
    const declareWin = useCallback(() => {
        if (!myTicket) return;
        channelRef.current?.send({
            type: 'broadcast',
            event: 'win_request',
            payload: {
                name: playerName,
                isHost: isHostRef.current,
                ticket: myTicket,
                markedNumbers: Array.from(markedNumbers),
            },
        });

        // If I am the host, validate locally (broadcast doesn't echo)
        if (isHostRef.current) {
            const hostDrawnSet = new Set(drawnNumbersRef.current);
            const validMarks = Array.from(markedNumbers).every(n => hostDrawnSet.has(n));
            const markedSet = markedNumbers;
            const hasWin = myTicket.frames.some(frame => {
                const isFullWin = checkFullCardWin(frame, markedSet);
                const isAnyRowWin = frame.some(row => checkRowWin(row, markedSet));
                return isFullWin || isAnyRowWin;
            });

            if (validMarks && hasWin) {
                const winnerData: WinnerData = {
                    name: playerName,
                    isHost: true,
                    ticket: myTicket,
                    markedNumbers: Array.from(markedNumbers),
                };
                channelRef.current?.send({
                    type: 'broadcast',
                    event: 'game_end',
                    payload: { winner: winnerData },
                });
                setWinner(winnerData);
                setGameStatus('ended');
                gameStatusRef.current = 'ended';
            }
        }
    }, [playerName, myTicket, markedNumbers]);
```

### Design Notes
- Non-host: sends `win_request`, waits for host to broadcast `game_end` or `win_rejected`
- Host: sends `win_request` (for consistency), then validates locally and broadcasts `game_end` immediately
- This avoids the host needing to receive their own broadcast (Supabase broadcast doesn't echo to sender)

---

## Change 6: Add `LotoTicket` to Import

The `win_request` handler uses `LotoTicket` type. Verify the import on line 5 already includes it:

```typescript
import { LotoCard, LotoTicket, generateTicket, checkRowWin, checkFullCardWin } from './gameLogic';
```

This is already correct. No change needed.

---

## Change 7: Update `sync_state` Payload (Optional Enhancement)

The existing `sync_state` handler should also include winner state for late joiners during ended games.

**Find the `sync_request` handler (around line 258-269):**
```typescript
            .on('broadcast', { event: 'sync_request' }, () => {
                if (isHostRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sync_state',
                        payload: {
                            drawnNumbers: drawnNumbersRef.current,
                            gameStatus: gameStatusRef.current,
                            currentNumber: currentNumberRef.current
                        }
                    });
                }
            })
```

No change needed here. The sync_state already broadcasts `gameStatus`. Winner data is ephemeral and not needed for late joiners (they will see "ended" status). This is acceptable.

---

## Change 8: Add `winRejected` State (For UI Feedback)

**Add state declaration near other state declarations (after `winner` state, around line 95):**
```typescript
    const [winRejected, setWinRejected] = useState(false);
```

**Update the `win_rejected` handler (from Change 4d) to set this state:**
```typescript
            .on('broadcast', { event: 'win_rejected' }, ({ payload }) => {
                if (payload.name === playerName) {
                    setWinRejected(true);
                    // Auto-reset after 3s so player can retry
                    setTimeout(() => setWinRejected(false), 3000);
                }
            })
```

**Add `winRejected` to the return object (line ~508):**
```typescript
    return {
        players,
        messages,
        drawnNumbers,
        currentNumber,
        gameStatus,
        myTicket,
        isHost,
        winner,
        winRejected,       // <-- ADD THIS
        waitingKinhPlayer,
        markedNumbers,
        isRoomFull,
        chatCooldown,
        startGame,
        drawNumber,
        sendMessage,
        declareWin,
        declareWaitingKinh,
        toggleMark,
        resetGame,
        regenerateTicket,
    };
```

**Reset `winRejected` in `applyGameReset`:**

**Find (line ~158):**
```typescript
    const applyGameReset = useCallback((clearMessages = false) => {
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        if (clearMessages) setMessages([]);
    }, []);
```

**Replace with:**
```typescript
    const applyGameReset = useCallback((clearMessages = false) => {
        setDrawnNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setWinRejected(false);
        setMarkedNumbers(new Set());
        setWaitingKinhPlayer(null);
        if (clearMessages) setMessages([]);
    }, []);
```

---

## Optional: Update Room Page to Use `winRejected`

**File:** `src/app/room/[roomId]/page.tsx` (informational, not required for security fix)

The consuming component can destructure `winRejected` and show a toast:
```typescript
const { /* existing props */, winRejected } = useGameRoom(roomId, playerName);

useEffect(() => {
    if (winRejected) {
        toast.error("KINH khong hop le! Kiem tra lai phieu cua ban.");
    }
}, [winRejected]);
```

This is a UX enhancement and can be done as a follow-up.

---

## Summary of All Broadcast Events After Changes

| Event | Sender | Receiver | Purpose |
|-------|--------|----------|---------|
| `win_request` | Any player | Host only | Request win validation |
| `game_end` | Host only | All clients | Confirmed valid win |
| `win_rejected` | Host only | Requester | Invalid win attempt |
| `game_start` | Host | All | (unchanged) |
| `game_reset` | Host | All | (unchanged) |
| `number_draw` | Host | All | (unchanged) |
| `chat` | Any | All | (unchanged) |
| `waiting_kinh` | Any | All | (unchanged) |
| `host_change` | Auto | All | (unchanged) |
| `sync_request` | Late joiner | Host | (unchanged) |
| `sync_state` | Host | Late joiner | (unchanged) |

## Acceptance Criteria
- [ ] `getRoomHost` imported from `./room-service`
- [ ] URL-based `isHost` completely removed (no reference to `?host=true`)
- [ ] `isHost` resolved from DB on mount via `useEffect`
- [ ] `declareWin` sends `win_request` event (not `player_win`)
- [ ] `win_request` handler: host validates markedNumbers against drawnNumbersRef
- [ ] `win_request` handler: host checks actual win condition (row or full card)
- [ ] `game_end` handler: all clients set winner + ended status
- [ ] `win_rejected` handler: requester gets feedback via state
- [ ] `winRejected` state exposed in return object
- [ ] Host self-win path works (validates locally, broadcasts `game_end`)
- [ ] Compiles without errors (`npm run build` or `npx tsc --noEmit`)

## Testing Checklist
- [ ] Create room as host -> host controls visible after DB lookup resolves
- [ ] Join room as player -> no host controls
- [ ] Navigate to `/room/XYZ?host=true&name=Hacker` -> no host controls (URL spoofing blocked)
- [ ] Normal win flow: mark numbers, click KINH -> host validates -> game_end received by all
- [ ] Fraudulent win: manually broadcast `win_request` with fake marks -> host rejects
- [ ] Host wins: host clicks KINH -> validates locally -> broadcasts game_end
- [ ] Host migration: host leaves -> new host resolves -> new host can validate wins
- [ ] Late joiner: joins mid-game -> sync_request still works correctly
