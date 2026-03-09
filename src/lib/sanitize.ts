/**
 * Shared sanitization utilities.
 * All user input (names, room codes, text) should pass through these BEFORE use.
 */

const MAX_PLAYER_NAME = 20;
const MAX_ROOM_CODE = 10;

/** Strip HTML, SQL injection patterns, dangerous chars */
export function sanitizeName(name: string): string {
    return name
        .replace(/<[^>]*>/g, '')
        .replace(/['"`;<>{}]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/[\x00-\x1F]/g, '')
        .trim()
        .slice(0, MAX_PLAYER_NAME);
}

/** Alphanumeric uppercase only */
export function sanitizeRoomCode(code: string): string {
    return code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, MAX_ROOM_CODE);
}

/** Strip HTML tags, control chars, enforce maxLen (same as chat-logic.sanitizeText) */
export function sanitizeText(text: string, maxLen: number): string {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .trim()
        .slice(0, maxLen);
}
