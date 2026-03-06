// ─── Constants ──────────────────────────────────────────────
export const CHAT_THROTTLE_MS = 2000;
export const MAX_CHAT_MESSAGES = 50;
export const MAX_CHAT_MSG_LEN = 200;
export const MAX_PLAYER_NAME_LEN = 20;

// ─── Types ──────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    senderName: string;
    text: string;
    timestamp: number;
}

// ─── Pure Functions ─────────────────────────────────────────

/** Sanitize text: strip HTML tags, remove control chars, enforce max length */
export function sanitizeText(text: string, maxLen: number): string {
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .trim()
        .slice(0, maxLen);
}

/** Tạo ChatMessage object với sanitized fields */
export function createChatMessage(senderName: string, text: string): ChatMessage {
    return {
        id: Math.random().toString(36).substring(2, 11),
        senderName: sanitizeText(senderName, MAX_PLAYER_NAME_LEN),
        text: sanitizeText(text, MAX_CHAT_MSG_LEN),
        timestamp: Date.now(),
    };
}

/** Kiểm tra chat throttle — trả về remaining seconds hoặc 0 nếu ok */
export function getChatThrottleRemaining(lastMessageTime: number): number {
    const elapsed = Date.now() - lastMessageTime;
    if (elapsed < CHAT_THROTTLE_MS) {
        return Math.ceil((CHAT_THROTTLE_MS - elapsed) / 1000);
    }
    return 0;
}

/** Append message vào list với giới hạn MAX_CHAT_MESSAGES */
export function appendToMessages(messages: ChatMessage[], newMsg: ChatMessage): ChatMessage[] {
    const next = [...messages, newMsg];
    return next.length > MAX_CHAT_MESSAGES ? next.slice(-MAX_CHAT_MESSAGES) : next;
}
