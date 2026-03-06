import { describe, it, expect } from 'vitest';
import { TICKET_THEMES, DEFAULT_THEME_ID, getThemeById, type TicketTheme } from './ticket-themes';

describe('TICKET_THEMES', () => {
    it('should have 6 themes', () => {
        expect(TICKET_THEMES.length).toBe(6);
    });

    it('all themes should have required properties', () => {
        const requiredKeys: (keyof TicketTheme)[] = [
            'id', 'name', 'emoji', 'bgColor', 'headerBg', 'headerText',
            'accentColor', 'borderColor', 'cellBg', 'cellText',
            'matchedBg', 'matchedText', 'footerText', 'title', 'subtitle',
        ];
        TICKET_THEMES.forEach(theme => {
            requiredKeys.forEach(key => {
                expect(theme[key], `Theme "${theme.id}" missing "${key}"`).toBeTruthy();
            });
        });
    });

    it('all theme IDs should be unique', () => {
        const ids = TICKET_THEMES.map(t => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('should include known theme IDs', () => {
        const ids = TICKET_THEMES.map(t => t.id);
        expect(ids).toContain('tet');
        expect(ids).toContain('cyberpunk');
        expect(ids).toContain('ocean');
        expect(ids).toContain('classic');
    });
});

describe('DEFAULT_THEME_ID', () => {
    it('should be "tet"', () => {
        expect(DEFAULT_THEME_ID).toBe('tet');
    });

    it('should exist in TICKET_THEMES', () => {
        expect(TICKET_THEMES.find(t => t.id === DEFAULT_THEME_ID)).toBeTruthy();
    });
});

describe('getThemeById', () => {
    it('should return matching theme', () => {
        const theme = getThemeById('cyberpunk');
        expect(theme.id).toBe('cyberpunk');
        expect(theme.name).toBe('Cyberpunk');
    });

    it('should return default theme for unknown id', () => {
        const theme = getThemeById('nonexistent');
        expect(theme.id).toBe(TICKET_THEMES[0].id);
    });

    it('should return default for empty string', () => {
        const theme = getThemeById('');
        expect(theme.id).toBe(TICKET_THEMES[0].id);
    });
});
