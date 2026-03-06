import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, AVAILABLE_LOCALES, type Locale } from './i18n';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// All translation keys from i18n.ts
const ALL_KEYS = [
    'app.title', 'app.subtitle',
    'room.create', 'room.join', 'room.code', 'room.full', 'room.share',
    'game.waiting', 'game.playing', 'game.ended', 'game.start', 'game.reset',
    'game.kinh', 'game.waiting_kinh',
    'ticket.change', 'ticket.keep', 'ticket.theme', 'ticket.auto_mark',
    'chat.placeholder', 'chat.send', 'chat.title',
    'player.name', 'player.host',
    'sound.mute', 'sound.unmute',
    'leaderboard.title',
    'lobby.title', 'lobby.join', 'lobby.empty',
];

describe('i18n', () => {
    beforeEach(() => {
        localStorageMock.clear();
        setLocale('vi');
    });

    // ─── setLocale / getLocale ─────────────────────────────
    describe('setLocale / getLocale', () => {
        it('should default to Vietnamese', () => {
            expect(getLocale()).toBe('vi');
        });

        it('should switch to English', () => {
            setLocale('en');
            expect(getLocale()).toBe('en');
        });

        it('should switch back to Vietnamese', () => {
            setLocale('en');
            setLocale('vi');
            expect(getLocale()).toBe('vi');
        });

        it('should persist locale to localStorage', () => {
            setLocale('en');
            expect(store['loto-locale']).toBe('en');
            setLocale('vi');
            expect(store['loto-locale']).toBe('vi');
        });

        it('should restore locale from localStorage', () => {
            store['loto-locale'] = 'en';
            const locale = getLocale();
            expect(locale).toBe('en');
        });

        it('should ignore invalid locale in localStorage', () => {
            store['loto-locale'] = 'fr';
            // 'fr' is not a valid Locale, getLocale should fallback
            const locale = getLocale();
            // Since 'fr' won't pass translations[saved] check, stays 'vi'
            expect(locale).toBe('vi');
        });
    });

    // ─── t() real-time switching ───────────────────────────
    describe('t() real-time locale switching', () => {
        it('should return Vietnamese THEN English for same key after setLocale', () => {
            setLocale('vi');
            expect(t('app.title')).toBe('Lô Tô Tết');

            setLocale('en');
            expect(t('app.title')).toBe('Loto Tet');
        });

        it('should switch game.kinh between KINH! and BINGO!', () => {
            setLocale('vi');
            expect(t('game.kinh')).toBe('KINH!');

            setLocale('en');
            expect(t('game.kinh')).toBe('BINGO!');

            setLocale('vi');
            expect(t('game.kinh')).toBe('KINH!');
        });

        it('should switch all game status labels correctly', () => {
            setLocale('vi');
            expect(t('game.waiting')).toBe('Chờ bắt đầu');
            expect(t('game.playing')).toBe('Đang xổ');
            expect(t('game.ended')).toBe('Kết thúc');

            setLocale('en');
            expect(t('game.waiting')).toBe('Waiting');
            expect(t('game.playing')).toBe('Playing');
            expect(t('game.ended')).toBe('Ended');
        });

        it('should switch ticket labels', () => {
            setLocale('vi');
            expect(t('ticket.change')).toBe('Đổi Vé');
            expect(t('ticket.keep')).toBe('Giữ Vé Cũ');

            setLocale('en');
            expect(t('ticket.change')).toBe('Change Ticket');
            expect(t('ticket.keep')).toBe('Keep Ticket');
        });

        it('should switch chat labels', () => {
            setLocale('vi');
            expect(t('chat.send')).toBe('Gửi');
            expect(t('chat.title')).toBe('Trò chuyện');

            setLocale('en');
            expect(t('chat.send')).toBe('Send');
            expect(t('chat.title')).toBe('Chat');
        });

        it('should switch sound labels', () => {
            setLocale('vi');
            expect(t('sound.mute')).toBe('Tắt tiếng');
            expect(t('sound.unmute')).toBe('Có tiếng');

            setLocale('en');
            expect(t('sound.mute')).toBe('Muted');
            expect(t('sound.unmute')).toBe('Sound on');
        });

        it('should switch lobby labels', () => {
            setLocale('vi');
            expect(t('lobby.empty')).toBe('Chưa có phòng nào đang mở');

            setLocale('en');
            expect(t('lobby.empty')).toBe('No rooms available');
        });
    });

    // ─── t() fallback behavior ─────────────────────────────
    describe('t() fallback behavior', () => {
        it('should return key itself for unknown keys', () => {
            expect(t('unknown.key')).toBe('unknown.key');
        });

        it('should return empty string key as-is', () => {
            expect(t('')).toBe('');
        });

        it('should handle special characters in key name', () => {
            expect(t('key.with.dots.and-dashes')).toBe('key.with.dots.and-dashes');
        });
    });

    // ─── Translation completeness ──────────────────────────
    describe('translation completeness', () => {
        it('ALL keys should exist in Vietnamese', () => {
            setLocale('vi');
            ALL_KEYS.forEach(key => {
                const val = t(key);
                expect(val, `Missing VI translation for: ${key}`).not.toBe(key);
            });
        });

        it('ALL keys should exist in English', () => {
            setLocale('en');
            ALL_KEYS.forEach(key => {
                const val = t(key);
                expect(val, `Missing EN translation for: ${key}`).not.toBe(key);
            });
        });

        it('VI and EN translations should be DIFFERENT for every key', () => {
            ALL_KEYS.forEach(key => {
                setLocale('vi');
                const viVal = t(key);
                setLocale('en');
                const enVal = t(key);
                expect(viVal, `VI and EN should differ for: ${key}`).not.toBe(enVal);
            });
        });

        it('no translation value should be empty', () => {
            ALL_KEYS.forEach(key => {
                setLocale('vi');
                expect(t(key).length, `Empty VI translation for: ${key}`).toBeGreaterThan(0);
                setLocale('en');
                expect(t(key).length, `Empty EN translation for: ${key}`).toBeGreaterThan(0);
            });
        });

        it('should have correct number of translation keys', () => {
            expect(ALL_KEYS.length).toBe(29);
        });
    });

    // ─── AVAILABLE_LOCALES ─────────────────────────────────
    describe('AVAILABLE_LOCALES', () => {
        it('should have exactly 2 locales (vi, en)', () => {
            expect(AVAILABLE_LOCALES.length).toBe(2);
            const ids = AVAILABLE_LOCALES.map(l => l.id);
            expect(ids).toContain('vi');
            expect(ids).toContain('en');
        });

        it('each locale should have id, label, and flag', () => {
            AVAILABLE_LOCALES.forEach(locale => {
                expect(locale.id).toBeTruthy();
                expect(locale.label).toBeTruthy();
                expect(locale.flag).toBeTruthy();
            });
        });

        it('vi should have correct metadata', () => {
            const vi = AVAILABLE_LOCALES.find(l => l.id === 'vi')!;
            expect(vi.label).toBe('Tiếng Việt');
            expect(vi.flag).toBe('🇻🇳');
        });

        it('en should have correct metadata', () => {
            const en = AVAILABLE_LOCALES.find(l => l.id === 'en')!;
            expect(en.label).toBe('English');
            expect(en.flag).toBe('🇺🇸');
        });
    });

    // ─── Edge cases ────────────────────────────────────────
    describe('edge cases', () => {
        it('rapid locale switching should always reflect latest', () => {
            for (let i = 0; i < 10; i++) {
                setLocale(i % 2 === 0 ? 'en' : 'vi');
            }
            // Final should be 'en' (i=9, 9%2=1 → 'vi'; wait... indices 0-9)
            // i=0→en, i=1→vi, i=2→en, i=3→vi, i=4→en, i=5→vi, i=6→en, i=7→vi, i=8→en, i=9→vi
            expect(getLocale()).toBe('vi');
            expect(t('game.kinh')).toBe('KINH!');
        });

        it('setLocale then getLocale should be consistent', () => {
            setLocale('en');
            expect(getLocale()).toBe('en');
            expect(t('app.title')).toBe('Loto Tet');

            setLocale('vi');
            expect(getLocale()).toBe('vi');
            expect(t('app.title')).toBe('Lô Tô Tết');
        });
    });
});
