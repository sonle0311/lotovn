// ─── Types ──────────────────────────────────────────────────
export interface Player {
    id: string;
    name: string;
    isHost: boolean;
    status: 'waiting' | 'playing' | 'won';
    isWaitingKinh?: boolean;
    waitingNumbers?: number[];
    lastSeen?: number;
}

// ─── Pure Functions ─────────────────────────────────────────

/** Chuyển Supabase presenceState() → Player[] (dedup + priority sort) */
export function presenceToPlayers(presenceState: Record<string, unknown[]>): Player[] {
    const players: Player[] = [];
    for (const [, presences] of Object.entries(presenceState)) {
        if (!presences || presences.length === 0) continue;

        // Ưu tiên session quan trọng hơn nếu có duplicate
        // won (0) > playing (1) > waiting (2)
        const sortedPresences = [...presences].sort((a, b) => {
            const aEntry = a as Record<string, unknown>;
            const bEntry = b as Record<string, unknown>;
            const priority = { 'won': 0, 'playing': 1, 'waiting': 2 };
            const aPrio = priority[aEntry.status as keyof typeof priority] ?? 3;
            const bPrio = priority[bEntry.status as keyof typeof priority] ?? 3;
            return aPrio - bPrio;
        });

        const p = sortedPresences[0] as Record<string, unknown>;
        const resolvedId = (p.userId as string) || (p.name as string) || '';
        players.push({
            id: resolvedId,
            name: (p.name as string) || '',
            isHost: (p.isHost as boolean) || false,
            status: (p.status as Player['status']) || 'waiting',
            isWaitingKinh: (p.isWaitingKinh as boolean) || false,
            waitingNumbers: (p.waitingNumbers as number[]) || undefined,
            lastSeen: Date.now(),
        });
    }
    return players;
}

/** Build presence payload cho Supabase channel.track() */
export function buildPresencePayload(
    playerName: string,
    playerId: string,
    isHost: boolean,
    gameStatus: 'waiting' | 'playing' | 'ended',
    overrides?: Partial<Player>
): Record<string, unknown> {
    return {
        name: playerName,
        userId: playerId,
        isHost,
        status: gameStatus === 'playing' ? 'playing' : 'waiting',
        ...overrides,
    };
}
