import { supabase } from './supabaseClient';

/**
 * Insert a new room record into the `rooms` DB table.
 * Uses ON CONFLICT DO NOTHING pattern to handle race conditions.
 * Returns true if this client is the original creator (first to insert).
 */
export async function createRoom(
    roomId: string,
    hostName: string,
    isPublic: boolean = false
): Promise<boolean> {
    const cleanRoomId = roomId.replace(/[^A-Z0-9]/gi, '').slice(0, 10);
    const cleanName = hostName.replace(/['"`;<>{}]/g, '').replace(/-{2,}/g, '-').trim().slice(0, 20);
    if (!cleanRoomId || !cleanName) return false;

    const { error: insertError } = await supabase
        .from('rooms')
        .insert({
            room_id: cleanRoomId,
            host_name: cleanName,
            is_public: isPublic,
        });

    // 23505 = Postgres unique_violation (room already exists)
    if (insertError && insertError.code !== '23505') {
        console.error('Failed to create room:', insertError);
        return false;
    }

    const host = await getRoomHost(cleanRoomId);
    return host === cleanName;
}

/**
 * Fetch the host_name for a given room.
 */
export async function getRoomHost(
    roomId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('rooms')
        .select('host_name')
        .eq('room_id', roomId)
        .single();

    if (error || !data) return null;
    return data.host_name;
}
