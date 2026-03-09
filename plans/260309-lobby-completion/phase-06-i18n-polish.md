# Phase 06: i18n + Polish
Status: ⬜ Pending
Dependencies: Phase 02, 04

## Objective
Thêm translation keys mới cho các tính năng lobby, AdminControls. Polish UX nhỏ.

## Tasks
1. [ ] Thêm i18n keys cho:
   - `admin.room_settings` / 'Room Settings'
   - `admin.public_toggle` / 'Public lobby'
   - `admin.room_name` / 'Room name'  
   - `lobby.status_waiting` / 'Waiting'
   - `lobby.status_playing` / 'In game'
   - `lobby.room_full` / 'Full'
   - `lobby.view_all` / 'View all'
2. [ ] AdminControls: dùng t() cho labels
3. [ ] Lobby page: dùng t() cho status badges

## Files to Modify
- `src/lib/i18n.ts` — thêm keys
- `src/lib/i18n.test.ts` — update test
- `src/components/AdminControls.tsx` — dùng t()
- `src/app/lobby/page.tsx` — dùng t()

---
Next Phase: phase-07-testing.md
