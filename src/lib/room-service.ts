import { supabase } from './supabaseClient';

/**
 * Insert a new room record into the `rooms` DB table.
 * Uses ON CONFLICT DO NOTHING pattern to handle race conditions.
 * Returns true if this client is the original creator (first to insert).
 *
 * PREREQUISITE: Run SQL migration `src/lib/supabase-migrations/001_rooms_policy.sql`
 *   in Supabase Dashboard → SQL Editor.
 *
 *   Schema: rooms (room_id TEXT PK, host_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW())
 *   RLS: "read_recent_rooms" SELECT WHERE created_at > now() - 24h
 *        "throttled_insert" INSERT WHERE global count < 100/hour
 */
export async function createRoom(
    roomId: string,
    hostName: string
): Promise<boolean> {
    // Sanitize inputs before DB operations
    const cleanRoomId = roomId.replace(/[^A-Z0-9]/gi, '').slice(0, 10);
    const cleanName = hostName.replace(/['"`;\\<>{}]/g, '').replace(/-{2,}/g, '-').trim().slice(0, 20);
    if (!cleanRoomId || !cleanName) return false;

    const { error: insertError } = await supabase
        .from('rooms')
        .insert({ room_id: cleanRoomId, host_name: cleanName });

    // 23505 = Postgres unique_violation (room already exists) — acceptable race condition
    if (insertError && insertError.code !== '23505') {
        console.error('Failed to create room:', insertError);
        return false;
    }

    // Verify we are the host by reading back from DB
    const host = await getRoomHost(cleanRoomId);
    return host === cleanName;
}

/**
 * Fetch the host_name for a given room.
 * Returns null if room doesn't exist in DB (legacy rooms or DB unavailable).
 */
export async function getRoomHost(
    roomId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('rooms')
        .select('host_name')
        .eq('room_id', roomId)
        .single();

    if (error || !data) {
        return null;
    }

    return data.host_name;
}
