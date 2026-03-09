# Phase 05: Landing → Lobby Navigation
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
Landing page hiện có section "PHÒNG CÔNG KHAI" nhưng chỉ link tĩnh. Cần kết nối thực tế: xem trước vài phòng + link tới /lobby.

## Tasks
1. [ ] Landing page "PHÒNG CÔNG KHAI" section: show 3 phòng mới nhất từ `getPublicRooms()` + link "Xem tất cả →" dẫn tới `/lobby`
2. [ ] Nếu không có phòng nào → hiện "Chưa có phòng nào. Hãy tạo phòng công khai đầu tiên!"

## Files to Modify
- `src/app/page.tsx` — fetch + display public rooms preview

---
Next Phase: phase-06-i18n-polish.md
