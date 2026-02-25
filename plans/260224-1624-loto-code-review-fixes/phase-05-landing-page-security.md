# Phase 05: Landing Page Security
**File:** `src/app/page.tsx`
**Action:** MODIFY
**Status:** Pending
**Depends on:** Phase 04 file exists (imports `createRoom`)

## Changes Overview
1. Import `createRoom` from room-service
2. Make `handleCreate` async; call `createRoom` before navigating
3. Remove `&host=true` from navigation URL
4. Add error handling for failed room creation

## Change 1: Add Import

**Location:** Top of file, after existing imports (after line 7)

```typescript
// ADD this import
import { createRoom } from "@/lib/room-service";
```

## Change 2: Replace `handleCreate` Function

**Remove** (lines 29-36):
```typescript
  const handleCreate = () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhap ten cua ban");
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(playerName.trim())}&host=true`);
  };
```

**Replace with:**
```typescript
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhap ten cua ban");
      return;
    }
    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const trimmedName = playerName.trim();

    setIsCreating(true);
    try {
      await createRoom(newRoomId, trimmedName);
      router.push(`/room/${newRoomId}?name=${encodeURIComponent(trimmedName)}`);
    } catch {
      setError("Khong the tao phong. Vui long thu lai.");
    } finally {
      setIsCreating(false);
    }
  };
```

### Key Differences
- `handleCreate` is now `async`
- Calls `createRoom(newRoomId, trimmedName)` to INSERT into DB
- URL no longer contains `&host=true` -- host identity is now DB-backed
- Added `isCreating` state for UX (prevent double-clicks)
- Error handling with try/catch
- We do NOT block navigation if `createRoom` returns false (edge case: room ID collision is astronomically rare with 5 random chars)

## Change 3: Disable Button During Creation (Optional UX)

The "TAO PHONG MOI" button (line 188) can use `isCreating` to prevent double-clicks.

**Find** (the create button, approximately line 188):
```typescript
<button onClick={handleCreate} aria-label="Tao mot phong choi moi"
```

**Replace with:**
```typescript
<button onClick={handleCreate} disabled={isCreating} aria-label="Tao mot phong choi moi"
```

## Change 4: Verify `handleJoin` URL Has No `host=true`

`handleJoin` (line 26) already navigates WITHOUT `&host=true`:
```typescript
router.push(`/room/${roomId}?name=${encodeURIComponent(playerName.trim())}`);
```
No change needed. This is correct.

## Acceptance Criteria
- [ ] `createRoom` imported from `@/lib/room-service`
- [ ] `handleCreate` is async, calls `createRoom` before `router.push`
- [ ] Navigation URL does NOT contain `host=true`
- [ ] `isCreating` state added, button disabled during creation
- [ ] Error state set if room creation fails
- [ ] Compiles without errors (`npm run build` or `npx tsc --noEmit`)

## Testing Checklist
- [ ] Create room -> verify row appears in `rooms` table in Supabase Dashboard
- [ ] Create room -> navigate to room -> verify host controls visible
- [ ] Join room as second player -> verify NO host controls
- [ ] Manually navigate to `/room/XYZ?host=true` -> verify NO host controls (spoofing blocked)
