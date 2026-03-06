import { describe, it, expect } from 'vitest';
import {
    sanitizeText,
    createChatMessage,
    getChatThrottleRemaining,
    appendToMessages,
    CHAT_THROTTLE_MS,
    MAX_CHAT_MSG_LEN,
    MAX_CHAT_MESSAGES,
    MAX_PLAYER_NAME_LEN,
} from './chat-logic';
import type { ChatMessage } from './chat-logic';

describe('sanitizeText', () => {
    it('should strip HTML tags', () => {
        expect(sanitizeText('<script>alert("xss")</script>hello', 100))
            .toBe('alert("xss")hello');
    });

    it('should remove control characters', () => {
        expect(sanitizeText('hello\x00\x01\x02world', 100)).toBe('helloworld');
    });

    it('should trim whitespace', () => {
        expect(sanitizeText('  hello  ', 100)).toBe('hello');
    });

    it('should enforce max length', () => {
        const longText = 'a'.repeat(300);
        expect(sanitizeText(longText, 200)).toHaveLength(200);
    });

    it('should handle empty string', () => {
        expect(sanitizeText('', 100)).toBe('');
    });

    it('should handle only HTML tags', () => {
        expect(sanitizeText('<b></b><script></script>', 100)).toBe('');
    });

    it('should preserve normal Vietnamese text', () => {
        expect(sanitizeText('Xin chào thế giới!', 100)).toBe('Xin chào thế giới!');
    });
});

describe('createChatMessage', () => {
    it('should create a message with sanitized fields', () => {
        const msg = createChatMessage('Player<1>', 'Hello <b>world</b>');
        expect(msg.senderName).toBe('Player'); // <1> stripped as HTML tag
        expect(msg.text).toBe('Hello world');
        expect(msg.id).toBeTruthy();
        expect(msg.timestamp).toBeGreaterThan(0);
    });

    it('should enforce max name length', () => {
        const longName = 'A'.repeat(50);
        const msg = createChatMessage(longName, 'hello');
        expect(msg.senderName).toHaveLength(MAX_PLAYER_NAME_LEN);
    });

    it('should enforce max message length', () => {
        const longText = 'B'.repeat(500);
        const msg = createChatMessage('Player', longText);
        expect(msg.text).toHaveLength(MAX_CHAT_MSG_LEN);
    });
});

describe('getChatThrottleRemaining', () => {
    it('should return 0 when enough time has passed', () => {
        const oldTime = Date.now() - CHAT_THROTTLE_MS - 100;
        expect(getChatThrottleRemaining(oldTime)).toBe(0);
    });

    it('should return remaining seconds when throttled', () => {
        const recentTime = Date.now() - 500; // 500ms ago
        const remaining = getChatThrottleRemaining(recentTime);
        expect(remaining).toBeGreaterThan(0);
        expect(remaining).toBeLessThanOrEqual(Math.ceil(CHAT_THROTTLE_MS / 1000));
    });

    it('should return 0 when lastMessageTime is 0', () => {
        expect(getChatThrottleRemaining(0)).toBe(0);
    });
});

describe('appendToMessages', () => {
    const makeMsg = (id: string): ChatMessage => ({
        id,
        senderName: 'Test',
        text: 'msg',
        timestamp: Date.now(),
    });

    it('should append a message', () => {
        const messages = [makeMsg('1')];
        const result = appendToMessages(messages, makeMsg('2'));
        expect(result).toHaveLength(2);
        expect(result[1].id).toBe('2');
    });

    it('should not mutate original array', () => {
        const messages = [makeMsg('1')];
        appendToMessages(messages, makeMsg('2'));
        expect(messages).toHaveLength(1);
    });

    it('should trim to MAX_CHAT_MESSAGES when exceeded', () => {
        const messages: ChatMessage[] = Array.from({ length: MAX_CHAT_MESSAGES }, (_, i) =>
            makeMsg(`msg-${i}`)
        );
        const result = appendToMessages(messages, makeMsg('new'));
        expect(result).toHaveLength(MAX_CHAT_MESSAGES);
        expect(result[result.length - 1].id).toBe('new');
        expect(result[0].id).toBe('msg-1'); // đầu tiên bị cắt
    });
});
