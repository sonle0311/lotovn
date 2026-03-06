import { describe, it, expect } from 'vitest';
import { validateWinRequest, MAX_PLAYERS } from './game-state-logic';
import type { WinRequest } from './game-state-logic';
import { generateTicket, checkRowWin } from './gameLogic';

describe('validateWinRequest', () => {
    const drawnNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 89, 90];

    it('should reject when marked numbers are not in drawn list', () => {
        const ticket = generateTicket();
        const request: WinRequest = {
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: [999], // số không tồn tại
        };

        const result = validateWinRequest(request, [1, 2, 3]);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.reason).toBe('invalid_marks');
        }
    });

    it('should reject when no win condition met', () => {
        const ticket = generateTicket();
        // Chỉ mark 1-2 số → không đủ hàng
        const request: WinRequest = {
            name: 'Player1',
            isHost: false,
            ticket,
            markedNumbers: [1, 2],
        };

        const result = validateWinRequest(request, drawnNumbers);
        expect(result.valid).toBe(false);
        if (!result.valid) {
            expect(result.reason).toBe('no_win_condition');
        }
    });

    it('should accept valid win with full row', () => {
        const ticket = generateTicket();
        // Tìm 1 hàng hoàn chỉnh từ ticket
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

        // Nếu tìm được hàng thắng (tất cả số đều trong drawnNumbers vì draw hết 1-90)
        if (winRow) {
            const markedNumbers = winRow.filter((n): n is number => n !== null);
            const request: WinRequest = {
                name: 'Winner',
                isHost: true,
                ticket,
                markedNumbers,
            };

            const result = validateWinRequest(request, drawnNumbers);
            expect(result.valid).toBe(true);
            if (result.valid) {
                expect(result.winner.name).toBe('Winner');
                expect(result.winner.isHost).toBe(true);
            }
        }
    });

    it('should return correct winner data on valid win', () => {
        const ticket = generateTicket();
        // Lấy tất cả số từ frame đầu tiên
        const allNums: number[] = [];
        ticket.frames[0].forEach(row => {
            row.forEach(n => { if (n !== null) allNums.push(n); });
        });

        const request: WinRequest = {
            name: 'TestPlayer',
            isHost: false,
            ticket,
            markedNumbers: allNums,
        };

        const result = validateWinRequest(request, drawnNumbers);
        expect(result.valid).toBe(true);
        if (result.valid) {
            expect(result.winner.name).toBe('TestPlayer');
            expect(result.winner.ticket).toBe(ticket);
            expect(result.winner.markedNumbers).toEqual(allNums);
        }
    });
});

describe('MAX_PLAYERS', () => {
    it('should be 20', () => {
        expect(MAX_PLAYERS).toBe(20);
    });
});
