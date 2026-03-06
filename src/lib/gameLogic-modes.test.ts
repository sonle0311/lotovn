import { describe, it, expect } from 'vitest';
import {
    generateCard, generateTicket, checkRowWin, checkFullCardWin,
    checkTwoRowsWin, checkCornersWin, checkWinByMode,
    type LotoCard, type GameMode, GAME_MODE_LABELS,
    getCardWaitingNumbers, formatNumberVietnamese,
} from './gameLogic';

// Helper: tạo card với số cố định để test
function makeCard(rows: (number | null)[][]): LotoCard {
    return rows;
}

const ALL_DRAWN = new Set(Array.from({ length: 90 }, (_, i) => i + 1));
const NONE_DRAWN = new Set<number>();

// ─── generateCard ────────────────────────────────────────────
describe('generateCard', () => {
    it('should generate 3 rows x 9 columns', () => {
        const card = generateCard();
        expect(card.length).toBe(3);
        card.forEach(row => expect(row.length).toBe(9));
    });

    it('should have exactly 5 numbers per row', () => {
        const card = generateCard();
        card.forEach(row => {
            const nums = row.filter(n => n !== null);
            expect(nums.length).toBe(5);
        });
    });

    it('should have 15 numbers total', () => {
        const card = generateCard();
        const total = card.flat().filter(n => n !== null).length;
        expect(total).toBe(15);
    });

    it('numbers should be between 1-90', () => {
        const card = generateCard();
        card.flat().filter((n): n is number => n !== null).forEach(n => {
            expect(n).toBeGreaterThanOrEqual(1);
            expect(n).toBeLessThanOrEqual(90);
        });
    });

    it('should respect usedNumbers (no duplicates across cards)', () => {
        const used = new Set<number>();
        const card1 = generateCard(used);
        const card2 = generateCard(used);
        const nums1 = card1.flat().filter((n): n is number => n !== null);
        const nums2 = card2.flat().filter((n): n is number => n !== null);
        const overlap = nums1.filter(n => nums2.includes(n));
        expect(overlap.length).toBe(0);
    });
});

// ─── generateTicket ──────────────────────────────────────────
describe('generateTicket', () => {
    it('should generate 3 frames', () => {
        const ticket = generateTicket();
        expect(ticket.frames.length).toBe(3);
    });

    it('should have a unique id', () => {
        const t1 = generateTicket();
        const t2 = generateTicket();
        expect(t1.id).not.toBe(t2.id);
    });

    it('should have a color string', () => {
        const ticket = generateTicket();
        expect(ticket.color).toBeTruthy();
        expect(ticket.color.startsWith('#')).toBe(true);
    });

    it('should have no duplicate numbers across all frames', () => {
        const ticket = generateTicket();
        const allNums = ticket.frames.flatMap(f => f.flat().filter((n): n is number => n !== null));
        const unique = new Set(allNums);
        expect(unique.size).toBe(allNums.length);
    });
});

// ─── checkRowWin ─────────────────────────────────────────────
describe('checkRowWin', () => {
    it('should return true when all row numbers are drawn', () => {
        const row = [1, null, 23, null, 45, null, 67, null, 89] as (number | null)[];
        const drawn = new Set([1, 23, 45, 67, 89]);
        expect(checkRowWin(row, drawn)).toBe(true);
    });

    it('should return false when not all drawn', () => {
        const row = [1, null, 23, null, 45, null, 67, null, 89] as (number | null)[];
        const drawn = new Set([1, 23, 45]);
        expect(checkRowWin(row, drawn)).toBe(false);
    });

    it('should return false for empty row', () => {
        const row = [null, null, null, null, null, null, null, null, null] as (number | null)[];
        expect(checkRowWin(row, ALL_DRAWN)).toBe(false);
    });
});

// ─── checkFullCardWin ────────────────────────────────────────
describe('checkFullCardWin', () => {
    it('should return true when all numbers in card are drawn', () => {
        const card = generateCard();
        expect(checkFullCardWin(card, ALL_DRAWN)).toBe(true);
    });

    it('should return false when only partial', () => {
        const card = generateCard();
        expect(checkFullCardWin(card, new Set([1, 2, 3]))).toBe(false);
    });
});

// ─── checkTwoRowsWin ────────────────────────────────────────
describe('checkTwoRowsWin', () => {
    it('should return true when 2 rows completed', () => {
        const card = makeCard([
            [1, null, null, null, 40, null, 60, null, 80],
            [null, 10, null, 30, null, 50, null, 70, null],
            [null, null, 20, null, null, null, null, null, 90],
        ]);
        // Row 0 and Row 1 complete
        const drawn = new Set([1, 40, 60, 80, 10, 30, 50, 70]);
        expect(checkTwoRowsWin(card, drawn)).toBe(true);
    });

    it('should return false when only 1 row completed', () => {
        const card = makeCard([
            [1, null, null, null, 40, null, 60, null, 80],
            [null, 10, null, 30, null, 50, null, 70, null],
            [null, null, 20, null, null, null, null, null, 90],
        ]);
        const drawn = new Set([1, 40, 60, 80]); // Only row 0
        expect(checkTwoRowsWin(card, drawn)).toBe(false);
    });

    it('should return true when all 3 rows completed', () => {
        const card = generateCard();
        expect(checkTwoRowsWin(card, ALL_DRAWN)).toBe(true);
    });
});

// ─── checkCornersWin ─────────────────────────────────────────
describe('checkCornersWin', () => {
    it('should return true when all 4 corners are marked', () => {
        const card = makeCard([
            [1, null, null, null, null, null, null, null, 89],
            [null, 10, null, null, null, null, null, 70, null],
            [2, null, null, null, null, null, null, null, 90],
        ]);
        const drawn = new Set([1, 89, 2, 90]);
        expect(checkCornersWin(card, drawn)).toBe(true);
    });

    it('should return false when missing one corner', () => {
        const card = makeCard([
            [1, null, null, null, null, null, null, null, 89],
            [null, 10, null, null, null, null, null, 70, null],
            [2, null, null, null, null, null, null, null, 90],
        ]);
        const drawn = new Set([1, 89, 2]); // Missing 90
        expect(checkCornersWin(card, drawn)).toBe(false);
    });

    it('should return false for card with less than 3 rows', () => {
        const card = makeCard([
            [1, null, null, null, null, null, null, null, 89],
            [null, 10, null, null, null, null, null, 70, null],
        ]);
        expect(checkCornersWin(card, ALL_DRAWN)).toBe(false);
    });
});

// ─── checkWinByMode ──────────────────────────────────────────
describe('checkWinByMode', () => {
    const card = generateCard();

    it('mode "row" → checks single row win', () => {
        expect(checkWinByMode(card, ALL_DRAWN, 'row')).toBe(true);
        expect(checkWinByMode(card, NONE_DRAWN, 'row')).toBe(false);
    });

    it('mode "full" → checks full card win', () => {
        expect(checkWinByMode(card, ALL_DRAWN, 'full')).toBe(true);
    });

    it('mode "two_rows" → checks two rows', () => {
        expect(checkWinByMode(card, ALL_DRAWN, 'two_rows')).toBe(true);
    });

    it('mode "corners" → checks corners', () => {
        expect(checkWinByMode(card, ALL_DRAWN, 'corners')).toBe(true);
    });

    it('unknown mode → returns false', () => {
        expect(checkWinByMode(card, ALL_DRAWN, 'nonexistent' as GameMode)).toBe(false);
    });
});

// ─── GAME_MODE_LABELS ────────────────────────────────────────
describe('GAME_MODE_LABELS', () => {
    it('should have labels for all modes', () => {
        expect(GAME_MODE_LABELS.row).toBe('Hàng Ngang');
        expect(GAME_MODE_LABELS.full).toBe('Full Card');
        expect(GAME_MODE_LABELS.two_rows).toBe('2 Hàng');
        expect(GAME_MODE_LABELS.corners).toBe('4 Góc');
    });
});

// ─── getCardWaitingNumbers ───────────────────────────────────
describe('getCardWaitingNumbers', () => {
    it('should return missing number when row has 4/5 matched', () => {
        const card = makeCard([
            [1, null, null, null, 40, null, 60, null, 80],
            [null, 10, null, 30, null, 50, null, 70, null],
            [null, null, 20, null, null, null, null, null, 90],
        ]);
        // Row 0: missing only 80
        const drawn = new Set([1, 40, 60]);
        const waiting = getCardWaitingNumbers(card, drawn);
        // Row 0 has 4 numbers: 1, 40, 60, 80. With 3 drawn → 1 missing but need 4/5
        // Actually row 0 only has 4 numbers (5 slots with 4 non-null)
        // Let me recalculate: [1, null, null, null, 40, null, 60, null, 80] → 4 nums
        // drawn: 1, 40, 60 → 3 matched, missing 80 → exactly 1 missing → "chờ kinh"!
        expect(waiting).toContain(80);
    });

    it('should return empty array when no row is near completion', () => {
        const card = makeCard([
            [1, null, null, null, 40, null, 60, null, 80],
            [null, 10, null, 30, null, 50, null, 70, null],
            [null, null, 20, null, null, null, null, null, 90],
        ]);
        const drawn = new Set([1]); // Only 1 of 4 in row 0
        const waiting = getCardWaitingNumbers(card, drawn);
        expect(waiting.length).toBe(0);
    });
});

// ─── formatNumberVietnamese ──────────────────────────────────
describe('formatNumberVietnamese', () => {
    it('should format single digit', () => {
        expect(formatNumberVietnamese(5)).toBe('Năm – 05');
    });

    it('should format 10', () => {
        expect(formatNumberVietnamese(10)).toBe('Mười – 10');
    });

    it('should format 11 with "mốt"', () => {
        expect(formatNumberVietnamese(21)).toBe('Hai mươi mốt – 21');
    });

    it('should format 15 with "lăm"', () => {
        expect(formatNumberVietnamese(15)).toBe('Mười lăm – 15');
    });

    it('should format 90', () => {
        expect(formatNumberVietnamese(90)).toBe('Chín mươi – 90');
    });
});
