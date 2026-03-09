# Phase 03: Player Count Sync
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Lobby hiện player_count = 0 cho mọi phòng vì `updateRoomPlayerCount()` tồn tại nhưng KHÔNG ĐƯỢC GỌI từ đâu. Fix bằng cách sync count mỗi khi players array thay đổi.

## Tasks
1. [ ] Trong `useGameRoom.ts`: thêm `useEffect` watch `players.length`, gọi `updateRoomPlayerCount(roomId, players.length)` khi thay đổi
   - Debounce 2s để tránh spam DB
   - Chỉ host gọi (tránh race condition)
2. [ ] Khi game ended hoặc player leave, count tự giảm (đã tự động qua presence)
3. [ ] Khi tất cả player leave (cleanup), set count = 0

## Files to Modify
- `src/lib/useGameRoom.ts` — thêm player count sync effect

## Logic
```
useEffect(() => {
    if (!isHost) return; // chỉ host sync
    const timer = setTimeout(() => {
        updateRoomPlayerCount(roomId, players.length);
    }, 2000); // debounce
    return () => clearTimeout(timer);
}, [players.length, isHost, roomId]);
```

---
Next Phase: phase-04-lobby-refresh.md
