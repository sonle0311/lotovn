-- Migration 001: Rooms — thêm created_at + tighten RLS policies
-- Chạy trên Supabase Dashboard → SQL Editor
-- ⚠️ BACKUP trước khi chạy!

-- 1. Thêm created_at column (nếu chưa có)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Xóa policies cũ (quá mở)
DROP POLICY IF EXISTS "read_rooms" ON rooms;
DROP POLICY IF EXISTS "insert_rooms" ON rooms;

-- 3. Chỉ đọc rooms tạo trong 24h gần nhất
CREATE POLICY "read_recent_rooms" ON rooms FOR SELECT
  USING (created_at > now() - interval '24 hours');

-- 4. Rate limit INSERT: tối đa 100 rooms/giờ globally
CREATE POLICY "throttled_insert" ON rooms FOR INSERT
  WITH CHECK (
    (SELECT count(*) FROM rooms WHERE created_at > now() - interval '1 hour') < 100
  );

-- 5. (Optional) CRON job xóa rooms cũ — setup qua Supabase Dashboard > Extensions > pg_cron
-- SELECT cron.schedule('cleanup-old-rooms', '0 */6 * * *', $$DELETE FROM rooms WHERE created_at < now() - interval '24 hours'$$);
