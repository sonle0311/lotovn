/**
 * Bot Player logic — AI that auto-marks numbers and strategically declares wins.
 * Runs on host client only, broadcasts actions like a real player.
 */

const BOT_NAMES = [
    "Bot Hùng 🤖", "Bot Lan 🌸", "Bot Minh 🎯",
    "Bot Tú 🃏", "Bot Phúc 🍀", "Bot Hạnh 😊",
];

export interface BotInstance {
    name: string;
    markedNumbers: Set<number>;
    ticket: null; // Bots don't have real tickets — they play virtually
}

/**
 * Create a bot instance with a random name.
 */
export function createBot(existingNames: string[]): BotInstance {
    const available = BOT_NAMES.filter(n => !existingNames.includes(n));
    const name = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : `Bot ${Math.floor(Math.random() * 999)}`;

    return {
        name,
        markedNumbers: new Set(),
        ticket: null,
    };
}

/**
 * Simulate bot marking a number with random delay,
 * returns delay in ms (200-1500ms depending on difficulty).
 */
export function getBotMarkDelay(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
        case 'easy': return 1000 + Math.random() * 1500; // 1-2.5s
        case 'medium': return 500 + Math.random() * 800; // 0.5-1.3s
        case 'hard': return 100 + Math.random() * 300; // 0.1-0.4s
    }
}

/**
 * Check if bot should declare win (simulated — always returns false since bots don't have real tickets).
 * This is a placeholder for potential future bot intelligence.
 */
export function shouldBotDeclareWin(): boolean {
    // Bots don't actually win — they're just for atmosphere
    return false;
}
