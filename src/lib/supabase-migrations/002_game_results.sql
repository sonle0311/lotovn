-- Migration 002: Game Results for Leaderboard
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS game_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    winner_name TEXT NOT NULL,
    game_mode TEXT DEFAULT 'row',
    drawn_count INT NOT NULL,
    played_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_results_winner ON game_results(winner_name);
CREATE INDEX IF NOT EXISTS idx_game_results_played ON game_results(played_at DESC);

-- RLS
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_game_results" ON game_results
    FOR SELECT USING (true);

-- Only allow inserts, no updates/deletes
CREATE POLICY "insert_game_results" ON game_results
    FOR INSERT WITH CHECK (true);
