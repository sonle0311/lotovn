/**
 * Pure helpers for host election / takeover validation.
 * Clients still cannot cryptographically prove broadcast authenticity;
 * these rules block casual spoofing and inverted "anti-cheat" demotion.
 */

export interface HostCandidate {
    id: string;
    isHost: boolean;
}

/** Deterministic successor when no living host remains. */
export function electHostUserId(players: HostCandidate[]): string | null {
    if (players.length === 0) return null;

    const livingHost = players.find((p) => p.isHost && p.id);
    if (livingHost) return livingHost.id;

    const sorted = [...players]
        .map((p) => p.id)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    return sorted[0] ?? null;
}

/**
 * Accept host_change only when known host is gone and the nominee
 * matches deterministic election among present players.
 */
export function shouldAcceptHostChange(
    players: HostCandidate[],
    newHostUserId: string,
    knownHostUserId: string | null
): boolean {
    if (!newHostUserId) return false;

    const presentIds = new Set(players.map((p) => p.id).filter(Boolean));
    if (!presentIds.has(newHostUserId)) return false;

    if (knownHostUserId && presentIds.has(knownHostUserId)) return false;

    return electHostUserId(players) === newHostUserId;
}

/** Host-authored gameplay events must carry the known host uid. */
export function isAuthorizedHostPayload(
    payloadHostUserId: unknown,
    knownHostUserId: string | null
): boolean {
    if (!knownHostUserId) return false;
    return typeof payloadHostUserId === "string" && payloadHostUserId === knownHostUserId;
}
