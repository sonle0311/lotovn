import { supabase } from './supabaseClient';

/**
 * Insert a new room record into the `rooms` DB table.
 * Uses ON CONFLICT DO NOTHING pattern to handle race conditions.
 * Returns true if this client is the original creator (first to insert).
 *
 * PREREQUISITE: Run SQL migration in Supabase Dashboard:
 *   CREATE TABLE IF NOT EXISTS rooms (
 *     room_id TEXT PRIMARY KEY,
 *     host_name TEXT NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *   ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "read_rooms" ON rooms FOR SELECT USING (true);
 *   CREATE POLICY "insert_rooms" ON rooms FOR INSERT WITH CHECK (true);
 */
export async function createRoom(
    roomId: string,
    hostName: string
): Promise<boolean> {
    const { error: insertError } = await supabase
        .from('rooms')
        .insert({ room_id: roomId, host_name: hostName });

    // 23505 = Postgres unique_violation (room already exists) — acceptable race condition
    if (insertError && insertError.code !== '23505') {
        console.error('Failed to create room:', insertError);
        return false;
    }

    // Verify we are the host by reading back from DB
    const host = await getRoomHost(roomId);
    return host === hostName;
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
