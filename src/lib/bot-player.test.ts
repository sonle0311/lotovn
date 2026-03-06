import { describe, it, expect } from 'vitest';
import { createBot, getBotMarkDelay, shouldBotDeclareWin, type BotInstance } from './bot-player';

describe('createBot', () => {
    it('should create bot with name and empty markedNumbers', () => {
        const bot = createBot([]);
        expect(bot.name).toBeTruthy();
        expect(bot.markedNumbers.size).toBe(0);
        expect(bot.ticket).toBeNull();
    });

    it('should avoid duplicate names', () => {
        const bot1 = createBot([]);
        const bot2 = createBot([bot1.name]);
        expect(bot2.name).not.toBe(bot1.name);
    });

    it('should generate fallback name when all known names taken', () => {
        const allNames = [
            "Bot Hùng 🤖", "Bot Lan 🌸", "Bot Minh 🎯",
            "Bot Tú 🃏", "Bot Phúc 🍀", "Bot Hạnh 😊",
        ];
        const bot = createBot(allNames);
        expect(bot.name).toMatch(/^Bot \d+$/);
    });

    it('should create unique bots', () => {
        const bots: BotInstance[] = [];
        for (let i = 0; i < 5; i++) {
            const names = bots.map(b => b.name);
            bots.push(createBot(names));
        }
        const uniqueNames = new Set(bots.map(b => b.name));
        expect(uniqueNames.size).toBe(5);
    });
});

describe('getBotMarkDelay', () => {
    it('easy delay should be 1000-2500ms', () => {
        for (let i = 0; i < 20; i++) {
            const delay = getBotMarkDelay('easy');
            expect(delay).toBeGreaterThanOrEqual(1000);
            expect(delay).toBeLessThanOrEqual(2500);
        }
    });

    it('medium delay should be 500-1300ms', () => {
        for (let i = 0; i < 20; i++) {
            const delay = getBotMarkDelay('medium');
            expect(delay).toBeGreaterThanOrEqual(500);
            expect(delay).toBeLessThanOrEqual(1300);
        }
    });

    it('hard delay should be 100-400ms', () => {
        for (let i = 0; i < 20; i++) {
            const delay = getBotMarkDelay('hard');
            expect(delay).toBeGreaterThanOrEqual(100);
            expect(delay).toBeLessThanOrEqual(400);
        }
    });
});

describe('shouldBotDeclareWin', () => {
    it('should always return false (bots cannot win)', () => {
        for (let i = 0; i < 10; i++) {
            expect(shouldBotDeclareWin()).toBe(false);
        }
    });
});
