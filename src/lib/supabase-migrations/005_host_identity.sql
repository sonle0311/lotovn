-- Migration 005: Secure host identity with auth.uid()
-- Run this in Supabase Dashboard -> SQL Editor

-- 1) Store immutable host identity
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON rooms(host_user_id);

-- 2) Enforce RLS for rooms and rebuild policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_recent_rooms" ON rooms;
DROP POLICY IF EXISTS "throttled_insert" ON rooms;
DROP POLICY IF EXISTS "insert_rooms_with_host_identity" ON rooms;
DROP POLICY IF EXISTS "host_only_update" ON rooms;

-- Keep lobby/read behavior unchanged
CREATE POLICY "read_recent_rooms" ON rooms
  FOR SELECT
  USING (created_at > now() - interval '24 hours');

-- Room creation must bind host_user_id to authenticated user
CREATE POLICY "insert_rooms_with_host_identity" ON rooms
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND host_user_id = auth.uid()
    AND (SELECT count(*) FROM rooms WHERE created_at > now() - interval '1 hour') < 100
  );

-- Only host can mutate room metadata/state
CREATE POLICY "host_only_update" ON rooms
  FOR UPDATE
  USING (host_user_id = auth.uid())
  WITH CHECK (host_user_id = auth.uid());
