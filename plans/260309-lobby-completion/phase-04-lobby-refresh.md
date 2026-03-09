# Phase 04: Lobby Auto-Refresh & Room Status
Status: ⬜ Pending
Dependencies: Phase 02, 03

## Objective
Lobby tự động refresh danh sách phòng mỗi 10s. Hiển thị status phòng (waiting/playing) và chặn join phòng đầy.

## Tasks
1. [ ] Auto-refresh: `setInterval(fetchRooms, 10000)` + cleanup trên unmount
2. [ ] Hiển thị game status badge trên room card:
   - 🟢 "Waiting" nếu game chưa bắt đầu
   - 🟡 "Playing" nếu đang xổ
   - Room card nào đang playing → opacity giảm hoặc badge cảnh báo
3. [ ] Room full indicator: nếu `player_count >= 8` → disable nút Join, hiện "Đầy"
4. [ ] Thêm column `game_status` vào rooms table (migration) HOẶC dùng `game_mode` column có sẵn để lưu status

## Files to Modify
- `src/app/lobby/page.tsx` — auto-refresh + status badge + full indicator
- `src/lib/game-service.ts` — thêm field `game_status` vào select (nếu có)
- `src/lib/supabase-migrations/005_room_status.sql` — optional migration

## UI Mockup
```
┌──────────────────────────────────────────┐
│ 🎊 Phòng Tết Năm Rồng                   │
│ Host: Anh Tám  ·  1 hàng  ·  👥 4      │
│ 🟢 Đang chờ                    [VÀO]    │
├──────────────────────────────────────────┤
│ 🏠 Phòng 3X8KMQ                         │
│ Host: Cô Ba  ·  Full card  ·  👥 8      │
│ 🟡 Đang chơi                   [ĐẦY]   │
└──────────────────────────────────────────┘
```

---
Next Phase: phase-05-landing-link.md
