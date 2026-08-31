-- Migration 006: Host claim RPC + tighten insert policies for results/history
-- Run in Supabase Dashboard -> SQL Editor after 005_host_identity.sql

-- 1) Allow elected successor to claim host_user_id when original host left.
-- Client still elects deterministically; this persists authority for RLS updates.
CREATE OR REPLACE FUNCTION claim_room_host(p_room_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned text := upper(regexp_replace(coalesce(p_room_id, ''), '[^A-Z0-9]', '', 'gi'));
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL OR cleaned = '' THEN
    RETURN false;
  END IF;

  UPDATE rooms
  SET host_user_id = caller
  WHERE room_id = cleaned
    AND host_user_id IS DISTINCT FROM caller;

  RETURN EXISTS (
    SELECT 1 FROM rooms WHERE room_id = cleaned AND host_user_id = caller
  );
END;
$$;

REVOKE ALL ON FUNCTION claim_room_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_room_host(text) TO authenticated, anon;

-- 2) game_results: require authenticated identity (blocks fully open anon spam)
DROP POLICY IF EXISTS "insert_game_results" ON game_results;
DROP POLICY IF EXISTS "insert_game_results_auth" ON game_results;
CREATE POLICY "insert_game_results_auth" ON game_results
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3) game_history: same auth gate
DROP POLICY IF EXISTS "insert_game_history" ON game_history;
DROP POLICY IF EXISTS "insert_game_history_auth" ON game_history;
CREATE POLICY "insert_game_history_auth" ON game_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
