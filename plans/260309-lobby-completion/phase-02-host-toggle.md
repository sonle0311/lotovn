# Phase 02: Host Public Toggle
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Host có thể toggle phòng public/private + đặt tên hiển thị cho phòng. Đây là **critical gap** — hiện tại host không có cách nào đưa phòng lên lobby.

## Tasks
1. [ ] Thêm section "Cài đặt phòng" vào `AdminControls.tsx` (chỉ host thấy):
   - Toggle switch: Public / Private
   - Input: Tên phòng hiển thị (display_name)
   - Hiện badge trạng thái: "🌐 Public" / "🔒 Private"
2. [ ] Thêm props vào AdminControls: `roomId`, `isPublic`, `onTogglePublic`
3. [ ] Gọi `updateRoomPublic(roomId, isPublic, displayName, gameMode)` khi toggle
4. [ ] Room page: truyền `roomId` + callback xuống AdminControls
5. [ ] Auto-set `is_public = true` trong `createRoom()` khi host tạo phòng (optional, configurable)

## Files to Create/Modify
- `src/components/AdminControls.tsx` — thêm Public toggle + Room name input
- `src/app/room/[roomId]/page.tsx` — pass roomId + callback
- `src/lib/game-service.ts` — updateRoomPublic (đã có)

## UI Mockup
```
┌──────────────────────────────────────┐
│ 👑 Bảng Điều Khiển Host              │
│                                      │
│ [BẮT ĐẦU GAME]                      │
│                                      │
│ ── Tốc độ xổ ──                      │
│ [Chậm] [Vừa] [Nhanh]  5 giây / số   │
│ ═══════════○═══════════              │
│                                      │
│ ── Cài đặt phòng ──   ← MỚI         │
│ 🌐 Công khai lobby    [  ○  ]        │
│ Tên phòng: [Phòng Lô Tô Tết___]     │
└──────────────────────────────────────┘
```

---
Next Phase: phase-03-player-count.md
