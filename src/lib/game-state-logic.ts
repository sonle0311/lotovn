import { LotoTicket, checkRowWin, checkFullCardWin } from './gameLogic';

// ─── Constants ──────────────────────────────────────────────
export const MAX_PLAYERS = 20;

const COL_RANGES = [
    { min: 1, max: 9 },
    { min: 10, max: 19 },
    { min: 20, max: 29 },
    { min: 30, max: 39 },
    { min: 40, max: 49 },
    { min: 50, max: 59 },
    { min: 60, max: 69 },
    { min: 70, max: 79 },
    { min: 80, max: 90 },
];

// ─── Types ──────────────────────────────────────────────────
export interface WinnerData {
    playerId: string;
    name: string;
    isHost: boolean;
    ticket: LotoTicket;
    markedNumbers: number[];
}

export interface WinRequest {
    playerId: string;
    name: string;
    isHost: boolean;
    ticket: LotoTicket;
    markedNumbers: number[];
}

// ─── Win Validation ─────────────────────────────────────────
export type WinValidationResult =
    | { valid: true; winner: WinnerData }
    | {
        valid: false;
        reason:
            | 'invalid_marks'
            | 'no_win_condition'
            | 'missing_player'
            | 'ticket_mismatch'
            | 'invalid_ticket'
            | 'marks_not_on_ticket';
    };

/** Collect every number printed on a ticket. */
export function collectTicketNumbers(ticket: LotoTicket): Set<number> {
    const nums = new Set<number>();
    for (const frame of ticket.frames ?? []) {
        for (const row of frame ?? []) {
            for (const n of row ?? []) {
                if (typeof n === 'number') nums.add(n);
            }
        }
    }
    return nums;
}

/** Structural check — blocks obviously fabricated grids. */
export function isValidLotoTicket(ticket: unknown): ticket is LotoTicket {
    if (!ticket || typeof ticket !== 'object') return false;
    const t = ticket as LotoTicket;
    if (!Array.isArray(t.frames) || t.frames.length === 0) return false;

    const allNums: number[] = [];

    for (const frame of t.frames) {
        if (!Array.isArray(frame) || frame.length !== 3) return false;
        let numbersOnCard = 0;

        for (const row of frame) {
            if (!Array.isArray(row) || row.length !== 9) return false;
            let numbersOnRow = 0;

            for (let c = 0; c < 9; c++) {
                const n = row[c];
                if (n === null || n === undefined) continue;
                if (typeof n !== 'number' || !Number.isInteger(n)) return false;
                const range = COL_RANGES[c];
                if (n < range.min || n > range.max) return false;
                numbersOnRow++;
                numbersOnCard++;
                allNums.push(n);
            }

            if (numbersOnRow !== 5) return false;
        }

        if (numbersOnCard !== 15) return false;
    }

    // Across a full 3-frame ticket, numbers must be unique.
    if (new Set(allNums).size !== allNums.length) return false;
    return true;
}

export function ticketsEqual(a: LotoTicket, b: LotoTicket): boolean {
    if (a.id && b.id && a.id === b.id && JSON.stringify(a.frames) === JSON.stringify(b.frames)) {
        return true;
    }
    return JSON.stringify(a.frames) === JSON.stringify(b.frames);
}

/**
 * Validate win request.
 * Host must pass the ticket committed at game start for that playerId.
 * Client-supplied ticket alone is never enough.
 */
export function validateWinRequest(
    request: WinRequest,
    drawnNumbers: number[],
    committedTicket?: LotoTicket | null
): WinValidationResult {
    if (!request.playerId) return { valid: false, reason: 'missing_player' };
    if (!committedTicket) return { valid: false, reason: 'ticket_mismatch' };
    if (!isValidLotoTicket(committedTicket)) return { valid: false, reason: 'invalid_ticket' };
    if (request.ticket && isValidLotoTicket(request.ticket) && !ticketsEqual(request.ticket, committedTicket)) {
        return { valid: false, reason: 'ticket_mismatch' };
    }

    const ticket = committedTicket;
    const hostDrawnSet = new Set(drawnNumbers);
    const ticketNums = collectTicketNumbers(ticket);

    if (!request.markedNumbers.every((n) => hostDrawnSet.has(n))) {
        return { valid: false, reason: 'invalid_marks' };
    }

    if (!request.markedNumbers.every((n) => ticketNums.has(n))) {
        return { valid: false, reason: 'marks_not_on_ticket' };
    }

    const markedSet = new Set(request.markedNumbers);
    const hasWin = ticket.frames.some((frame) =>
        checkFullCardWin(frame, markedSet) || frame.some((row) => checkRowWin(row, markedSet))
    );
    if (!hasWin) return { valid: false, reason: 'no_win_condition' };

    return {
        valid: true,
        winner: {
            playerId: request.playerId,
            name: request.name,
            isHost: request.isHost,
            ticket,
            markedNumbers: request.markedNumbers,
        },
    };
}
