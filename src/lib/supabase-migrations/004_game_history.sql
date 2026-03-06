-- Migration 004: Game History for Replay
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS game_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    drawn_numbers INT[] NOT NULL,
    winner_name TEXT,
    winner_ticket JSONB,
    game_mode TEXT DEFAULT 'row',
    duration_seconds INT,
    player_count INT DEFAULT 0,
    played_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_history_room ON game_history(room_id, played_at DESC);

ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_game_history" ON game_history
    FOR SELECT USING (true);

CREATE POLICY "insert_game_history" ON game_history
    FOR INSERT WITH CHECK (true);
