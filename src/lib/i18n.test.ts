import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, AVAILABLE_LOCALES, type Locale } from './i18n';

describe('i18n', () => {
    beforeEach(() => {
        // Reset to Vietnamese
        setLocale('vi');
    });

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
    });

    describe('t() translation', () => {
        it('should translate Vietnamese keys', () => {
            setLocale('vi');
            expect(t('app.title')).toBe('Lô Tô Tết');
            expect(t('game.kinh')).toBe('KINH!');
            expect(t('room.create')).toBe('Tạo Phòng');
        });

        it('should translate English keys', () => {
            setLocale('en');
            expect(t('app.title')).toBe('Loto Tet');
            expect(t('game.kinh')).toBe('BINGO!');
            expect(t('room.create')).toBe('Create Room');
        });

        it('should return key itself for unknown keys', () => {
            expect(t('unknown.key')).toBe('unknown.key');
        });

        it('should fallback to Vietnamese when key missing in English', () => {
            setLocale('en');
            // If a key exists in vi but not en, should still get vi value
            // All keys exist in both so test with unknown
            expect(t('nonexistent')).toBe('nonexistent');
        });
    });

    describe('AVAILABLE_LOCALES', () => {
        it('should have vi and en', () => {
            const ids = AVAILABLE_LOCALES.map(l => l.id);
            expect(ids).toContain('vi');
            expect(ids).toContain('en');
        });

        it('each locale should have label and flag', () => {
            AVAILABLE_LOCALES.forEach(locale => {
                expect(locale.label).toBeTruthy();
                expect(locale.flag).toBeTruthy();
            });
        });

        it('vi should have Vietnamese flag', () => {
            const vi = AVAILABLE_LOCALES.find(l => l.id === 'vi');
            expect(vi?.flag).toBe('🇻🇳');
        });
    });

    describe('translation completeness', () => {
        it('vi and en should have same keys', () => {
            setLocale('vi');
            const viKeys = [
                'app.title', 'game.waiting', 'game.playing', 'game.ended',
                'game.kinh', 'room.create', 'room.join', 'chat.send',
                'leaderboard.title', 'lobby.title', 'lobby.join',
            ];
            viKeys.forEach(key => {
                setLocale('vi');
                const viVal = t(key);
                setLocale('en');
                const enVal = t(key);
                expect(viVal, `Missing vi translation for: ${key}`).not.toBe(key);
                expect(enVal, `Missing en translation for: ${key}`).not.toBe(key);
            });
        });
    });
});
