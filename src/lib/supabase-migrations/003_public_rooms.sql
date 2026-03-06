-- Migration 003: Public Rooms for Lobby
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS player_count INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'row';

CREATE INDEX IF NOT EXISTS idx_rooms_public ON rooms(is_public, created_at DESC) WHERE is_public = true;
