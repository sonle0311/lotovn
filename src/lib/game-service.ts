import { supabase } from './supabaseClient';

/**
 * Save game result for leaderboard tracking.
 */
export async function saveGameResult(
    roomId: string,
    winnerName: string,
    drawnCount: number,
    gameMode: string = 'row'
): Promise<void> {
    const { error } = await supabase.from('game_results').insert({
        room_id: roomId,
        winner_name: winnerName,
        drawn_count: drawnCount,
        game_mode: gameMode,
    });
    if (error) console.error('Failed to save game result:', error);
}

export interface LeaderboardEntry {
    winner_name: string;
    total_wins: number;
    avg_drawn: number;
}

/**
 * Fetch top players by total wins.
 */
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: limit });

    if (error || !data) {
        // Fallback: basic query when RPC not available
        const { data: fallback } = await supabase
            .from('game_results')
            .select('winner_name')
            .order('played_at', { ascending: false })
            .limit(500);

        if (!fallback) return [];

        // Aggregate client-side
        const map = new Map<string, { wins: number; drawn: number[] }>();
        for (const r of fallback as { winner_name: string }[]) {
            const entry = map.get(r.winner_name) || { wins: 0, drawn: [] };
            entry.wins++;
            map.set(r.winner_name, entry);
        }
        return Array.from(map.entries())
            .map(([name, stats]) => ({
                winner_name: name,
                total_wins: stats.wins,
                avg_drawn: 0,
            }))
            .sort((a, b) => b.total_wins - a.total_wins)
            .slice(0, limit);
    }

    return data;
}

/**
 * Fetch room-specific leaderboard.
 */
export async function getRoomLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
    const { data } = await supabase
        .from('game_results')
        .select('winner_name, drawn_count')
        .eq('room_id', roomId)
        .order('played_at', { ascending: false })
        .limit(100);

    if (!data) return [];

    const map = new Map<string, { wins: number; drawn: number[] }>();
    for (const r of data) {
        const entry = map.get(r.winner_name) || { wins: 0, drawn: [] };
        entry.wins++;
        entry.drawn.push(r.drawn_count);
        map.set(r.winner_name, entry);
    }

    return Array.from(map.entries())
        .map(([name, stats]) => ({
            winner_name: name,
            total_wins: stats.wins,
            avg_drawn: Math.round(stats.drawn.reduce((a, b) => a + b, 0) / stats.drawn.length),
        }))
        .sort((a, b) => b.total_wins - a.total_wins);
}

/**
 * Fetch public rooms that are still waiting for players.
 */
export async function getPublicRooms() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
        .from('rooms')
        .select('room_id, host_name, display_name, player_count, game_mode, created_at')
        .eq('is_public', true)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(20);

    return data ?? [];
}

/**
 * Update room public visibility and metadata.
 */
export async function updateRoomPublic(
    roomId: string,
    isPublic: boolean,
    displayName?: string,
    gameMode?: string
): Promise<void> {
    const updates: Record<string, unknown> = { is_public: isPublic };
    if (displayName !== undefined) updates.display_name = displayName;
    if (gameMode !== undefined) updates.game_mode = gameMode;

    const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('room_id', roomId);

    if (error) console.error('Failed to update room:', error);
}

/**
 * Update player count for a room.
 */
export async function updateRoomPlayerCount(roomId: string, count: number): Promise<void> {
    await supabase
        .from('rooms')
        .update({ player_count: count })
        .eq('room_id', roomId);
}
