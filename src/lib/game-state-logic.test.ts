import { describe, it, expect } from 'vitest';
import { validateWinRequest, MAX_PLAYERS, isValidLotoTicket, collectTicketNumbers } from './game-state-logic';
import type { WinRequest } from './game-state-logic';
import { generateTicket, checkRowWin } from './gameLogic';
import type { LotoTicket } from './gameLogic';

describe('validateWinRequest', () => {
    const drawnNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 89, 90];

    it('should reject when committed ticket is missing', () => {
        const ticket = generateTicket();
        const request: WinRequest = {
            playerId: 'uid-1',
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: [1, 2, 3],
        };

        const result = validateWinRequest(request, drawnNumbers, null);
        expect(result.valid).toBe(false);
        if (!result.valid) expect(result.reason).toBe('ticket_mismatch');
    });

    it('should reject fabricated ticket that differs from commit', () => {
        const committed = generateTicket();
        const fake = generateTicket();
        const fakeNums = Array.from(collectTicketNumbers(fake));
        const request: WinRequest = {
            playerId: 'uid-1',
            name: 'Cheater',
            isHost: false,
            ticket: fake,
            markedNumbers: fakeNums.slice(0, 5),
        };

        const result = validateWinRequest(request, drawnNumbers, committed);
        expect(result.valid).toBe(false);
        if (!result.valid) expect(result.reason).toBe('ticket_mismatch');
    });

    it('should reject when marked numbers are not in drawn list', () => {
        const ticket = generateTicket();
        const request: WinRequest = {
            playerId: 'uid-1',
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: [999],
        };

        const result = validateWinRequest(request, [1, 2, 3], ticket);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.reason).toBe('invalid_marks');
        }
    });

    it('should reject marks not printed on committed ticket', () => {
        const ticket = generateTicket();
        const ticketNums = collectTicketNumbers(ticket);
        const outsider = drawnNumbers.find((n) => !ticketNums.has(n))!;
        const request: WinRequest = {
            playerId: 'uid-1',
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: [outsider],
        };

        const result = validateWinRequest(request, drawnNumbers, ticket);
        expect(result.valid).toBe(false);
        if (!result.valid) expect(result.reason).toBe('marks_not_on_ticket');
    });

    it('should reject when no win condition met', () => {
        const ticket = generateTicket();
        const nums = Array.from(collectTicketNumbers(ticket)).slice(0, 2);
        const request: WinRequest = {
            playerId: 'uid-1',
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: nums,
        };

        const result = validateWinRequest(request, drawnNumbers, ticket);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.reason).toBe('no_win_condition');
        }
    });

    it('should accept valid win with full row against committed ticket', () => {
        const ticket = generateTicket();
        const drawnSet = new Set(drawnNumbers);
        let winRow: (number | null)[] | null = null;

        for (const frame of ticket.frames) {
            for (const row of frame) {
                if (checkRowWin(row, drawnSet)) {
                    winRow = row;
                    break;
                }
            }
            if (winRow) break;
        }

        if (winRow) {
            const markedNumbers = winRow.filter((n): n is number => n !== null);
            const request: WinRequest = {
                playerId: 'uid-winner',
                name: 'Winner',
                isHost: true,
                ticket,
                markedNumbers,
            };

            const result = validateWinRequest(request, drawnNumbers, ticket);
            expect(result.valid).toBe(true);
            if (result.valid) {
                expect(result.winner.name).toBe('Winner');
                expect(result.winner.playerId).toBe('uid-winner');
                expect(result.winner.isHost).toBe(true);
            }
        }
    });

    it('should return correct winner data on valid win', () => {
        const ticket = generateTicket();
        const allNums: number[] = [];
        ticket.frames[0].forEach(row => {
            row.forEach(n => { if (n !== null) allNums.push(n); });
        });

        const request: WinRequest = {
            playerId: 'uid-test',
            name: 'TestPlayer',
            isHost: false,
            ticket,
            markedNumbers: allNums,
        };

        const result = validateWinRequest(request, drawnNumbers, ticket);
        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.winner.name).toBe('TestPlayer');
            expect(result.winner.playerId).toBe('uid-test');
            expect(result.winner.ticket).toBe(ticket);
            expect(result.winner.markedNumbers).toEqual(allNums);
        }
    });
});

describe('isValidLotoTicket', () => {
    it('accepts generated tickets', () => {
        expect(isValidLotoTicket(generateTicket())).toBe(true);
    });

    it('rejects obviously fabricated ticket', () => {
        const fake = {
            id: 'x',
            color: '#fff',
            frames: [
                [
                    [1, 2, 3, 4, 5, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null],
                ],
            ],
        } as LotoTicket;
        expect(isValidLotoTicket(fake)).toBe(false);
    });
});

describe('MAX_PLAYERS', () => {
    it('should be 20', () => {
        expect(MAX_PLAYERS).toBe(20);
    });
});
