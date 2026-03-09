# Phase 01: DB Migration Check
Status: ⬜ Pending
Dependencies: None

## Objective
Đảm bảo migration 003_public_rooms.sql đã chạy trên Supabase production, các columns mới tồn tại.

## Tasks
1. [ ] Verify columns tồn tại bằng Supabase query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'`
2. [ ] Nếu thiếu → chạy migration 003 trên Supabase Dashboard SQL Editor

## Files
- `src/lib/supabase-migrations/003_public_rooms.sql` — migration có sẵn

## Columns cần có:
- `is_public` BOOLEAN DEFAULT false
- `display_name` TEXT
- `player_count` INT DEFAULT 0
- `game_mode` TEXT DEFAULT 'row'

---
Next Phase: phase-02-host-toggle.md
