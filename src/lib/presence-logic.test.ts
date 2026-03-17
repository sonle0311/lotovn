import { describe, it, expect } from 'vitest';
import { presenceToPlayers, buildPresencePayload } from './presence-logic';

describe('presenceToPlayers', () => {
    it('should convert presence state to players', () => {
        const state = {
            'player1': [{ name: 'Alice', isHost: true, status: 'playing' }],
            'player2': [{ name: 'Bob', isHost: false, status: 'waiting' }],
        };
        const players = presenceToPlayers(state);
        expect(players).toHaveLength(2);
        expect(players.find(p => p.name === 'Alice')?.isHost).toBe(true);
        expect(players.find(p => p.name === 'Bob')?.status).toBe('waiting');
    });

    it('should handle empty presence state', () => {
        expect(presenceToPlayers({})).toEqual([]);
    });

    it('should handle empty presences array', () => {
        const state = { 'player1': [] };
        expect(presenceToPlayers(state)).toEqual([]);
    });

    it('should deduplicate and prioritize by status (won > playing > waiting)', () => {
        const state = {
            'player1': [
                { name: 'Alice', isHost: false, status: 'waiting' },
                { name: 'Alice', isHost: false, status: 'playing' },
            ],
        };
        const players = presenceToPlayers(state);
        expect(players).toHaveLength(1);
        expect(players[0].status).toBe('playing'); // playing > waiting
    });

    it('should set lastSeen timestamp', () => {
        const before = Date.now();
        const state = { 'p1': [{ name: 'Test', isHost: false, status: 'waiting' }] };
        const players = presenceToPlayers(state);
        const after = Date.now();
        expect(players[0].lastSeen).toBeGreaterThanOrEqual(before);
        expect(players[0].lastSeen).toBeLessThanOrEqual(after);
    });

    it('should default missing fields', () => {
        const state = { 'p1': [{}] }; // minimal presence
        const players = presenceToPlayers(state);
        expect(players[0].name).toBe('');
        expect(players[0].isHost).toBe(false);
        expect(players[0].status).toBe('waiting');
    });
});

describe('buildPresencePayload', () => {
    it('should build payload for playing status', () => {
        const payload = buildPresencePayload('Alice', 'uid-alice', true, 'playing');
        expect(payload).toEqual({
            name: 'Alice',
            userId: 'uid-alice',
            isHost: true,
            status: 'playing',
        });
    });

    it('should map ended status to waiting', () => {
        const payload = buildPresencePayload('Bob', 'uid-bob', false, 'ended');
        expect(payload.status).toBe('waiting');
    });

    it('should merge overrides', () => {
        const payload = buildPresencePayload('Alice', 'uid-alice', false, 'waiting', {
            isWaitingKinh: true,
            waitingNumbers: [1, 2, 3],
        });
        expect(payload.isWaitingKinh).toBe(true);
        expect(payload.waitingNumbers).toEqual([1, 2, 3]);
    });
});
