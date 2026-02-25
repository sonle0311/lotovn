# Phase 04: Room Service (NEW FILE)
**File:** `src/lib/room-service.ts`
**Action:** CREATE
**Status:** Pending
**Depends on:** SQL migration executed in Supabase Dashboard

## Prerequisites: SQL Migration

Run this in Supabase Dashboard > SQL Editor BEFORE deploying code:

```sql
-- Create rooms table for host authority
CREATE TABLE IF NOT EXISTS rooms (
  room_id TEXT PRIMARY KEY,
  host_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (needed to check who is host)
CREATE POLICY "read_rooms" ON rooms
  FOR SELECT
  USING (true);

-- Anyone can insert (room creation from anon client)
-- ON CONFLICT DO NOTHING handles duplicate room_id race condition
CREATE POLICY "insert_rooms" ON rooms
  FOR INSERT
  WITH CHECK (true);
```

**Verification after running SQL:**
1. Go to Supabase Dashboard > Table Editor > verify `rooms` table exists
2. Go to Authentication > Policies > verify both policies are active
3. Test: run `SELECT * FROM rooms;` in SQL editor (should return empty result set)

## Task: Create `src/lib/room-service.ts`

### Full File Content

```typescript
import { supabase } from './supabaseClient';

/**
 * Insert a new room record. Uses upsert-like pattern:
 * INSERT with ON CONFLICT DO NOTHING, then SELECT to verify.
 * Returns true if this client is the original creator.
 */
export async function createRoom(
  roomId: string,
  hostName: string
): Promise<boolean> {
  const { error: insertError } = await supabase
    .from('rooms')
    .insert({ room_id: roomId, host_name: hostName });

  // 23505 = unique_violation (room already exists) - expected in race condition
  if (insertError && insertError.code !== '23505') {
    console.error('Failed to create room:', insertError);
    return false;
  }

  // Verify we are the host (handles race condition)
  const host = await getRoomHost(roomId);
  return host === hostName;
}

/**
 * Fetch the host_name for a given room.
 * Returns null if room doesn't exist in DB.
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
```

### Design Notes
- `createRoom` returns boolean indicating if caller is the original host (race condition safe)
- `getRoomHost` returns `null` for rooms created before migration (legacy rooms) or rooms not in DB
- Error code `23505` is Postgres unique violation -- expected when two users race to create the same room ID
- No session ID needed; host authority is tied to `host_name` matching `playerName`
- File is ~40 lines, well under 200-line limit
- Kebab-case filename per development rules

### Acceptance Criteria
- [ ] File created at `src/lib/room-service.ts`
- [ ] `createRoom` inserts row and returns boolean
- [ ] `getRoomHost` fetches host_name by room_id
- [ ] Handles Postgres unique violation gracefully
- [ ] Compiles without errors (`npm run build` or `npx tsc --noEmit`)
