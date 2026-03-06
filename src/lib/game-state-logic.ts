import { LotoTicket, checkRowWin, checkFullCardWin } from './gameLogic';

// ─── Constants ──────────────────────────────────────────────
export const MAX_PLAYERS = 20;

// ─── Types ──────────────────────────────────────────────────
export interface WinnerData {
    name: string;
    isHost: boolean;
    ticket: LotoTicket;
    markedNumbers: number[];
}

export interface WinRequest {
    name: string;
    isHost: boolean;
    ticket: LotoTicket;
    markedNumbers: number[];
}

// ─── Win Validation ─────────────────────────────────────────
export type WinValidationResult =
    | { valid: true; winner: WinnerData }
    | { valid: false; reason: 'invalid_marks' | 'no_win_condition' };

/** Validate một win request từ client bất kỳ — host gọi hàm này */
export function validateWinRequest(
    request: WinRequest,
    drawnNumbers: number[]
): WinValidationResult {
    const hostDrawnSet = new Set(drawnNumbers);

    // Kiểm tra tất cả marked numbers đều nằm trong lịch sử xổ
    const validMarks = request.markedNumbers.every(n => hostDrawnSet.has(n));
    if (!validMarks) return { valid: false, reason: 'invalid_marks' };

    // Kiểm tra ticket có đạt điều kiện thắng (hàng hoặc full card)
    const markedSet = new Set(request.markedNumbers);
    const hasWin = request.ticket.frames.some(frame =>
        checkFullCardWin(frame, markedSet) || frame.some(row => checkRowWin(row, markedSet))
    );
    if (!hasWin) return { valid: false, reason: 'no_win_condition' };

    return {
        valid: true,
        winner: {
            name: request.name,
            isHost: request.isHost,
            ticket: request.ticket,
            markedNumbers: request.markedNumbers,
        },
    };
}
