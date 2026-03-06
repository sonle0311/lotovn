/** Ticket theme definitions — visual skins for LotoCard */

export interface TicketTheme {
    id: string;
    name: string;
    emoji: string;
    bgColor: string;
    headerBg: string;
    headerText: string;
    accentColor: string;
    borderColor: string;
    cellBg: string;
    cellText: string;
    matchedBg: string;
    matchedText: string;
    footerText: string;
    title: string;
    subtitle: string;
}

export const TICKET_THEMES: TicketTheme[] = [
    {
        id: 'tet',
        name: 'Tết Nguyên Đán',
        emoji: '🧧',
        bgColor: '#fbbf24',
        headerBg: 'rgba(0,0,0,0.05)',
        headerText: '#000',
        accentColor: '#991b1b',
        borderColor: '#000',
        cellBg: '#fffbeb',
        cellText: '#000',
        matchedBg: '#dc2626',
        matchedText: '#fff',
        footerText: 'rgba(0,0,0,0.4)',
        title: 'LÔ TÔ',
        subtitle: 'TẾT',
    },
    {
        id: 'trungThu',
        name: 'Trung Thu',
        emoji: '🥮',
        bgColor: '#fde68a',
        headerBg: 'rgba(120,53,15,0.1)',
        headerText: '#78350f',
        accentColor: '#b45309',
        borderColor: '#92400e',
        cellBg: '#fffbeb',
        cellText: '#78350f',
        matchedBg: '#f59e0b',
        matchedText: '#fff',
        footerText: 'rgba(120,53,15,0.4)',
        title: 'LÔ TÔ',
        subtitle: 'TRĂNG RẰM',
    },
    {
        id: 'christmas',
        name: 'Giáng Sinh',
        emoji: '🎄',
        bgColor: '#bbf7d0',
        headerBg: 'rgba(22,101,52,0.1)',
        headerText: '#166534',
        accentColor: '#dc2626',
        borderColor: '#166534',
        cellBg: '#f0fdf4',
        cellText: '#166534',
        matchedBg: '#dc2626',
        matchedText: '#fff',
        footerText: 'rgba(22,101,52,0.4)',
        title: 'LÔ TÔ',
        subtitle: 'NOEL',
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        emoji: '🌃',
        bgColor: '#1e1b4b',
        headerBg: 'rgba(139,92,246,0.15)',
        headerText: '#a78bfa',
        accentColor: '#f472b6',
        borderColor: '#7c3aed',
        cellBg: 'rgba(139,92,246,0.1)',
        cellText: '#c4b5fd',
        matchedBg: '#f472b6',
        matchedText: '#fff',
        footerText: 'rgba(167,139,250,0.4)',
        title: 'LÔTÔ',
        subtitle: 'CYBER',
    },
    {
        id: 'ocean',
        name: 'Đại Dương',
        emoji: '🌊',
        bgColor: '#bfdbfe',
        headerBg: 'rgba(30,64,175,0.1)',
        headerText: '#1e40af',
        accentColor: '#0ea5e9',
        borderColor: '#1e40af',
        cellBg: '#eff6ff',
        cellText: '#1e40af',
        matchedBg: '#0ea5e9',
        matchedText: '#fff',
        footerText: 'rgba(30,64,175,0.4)',
        title: 'LÔ TÔ',
        subtitle: 'BIỂN',
    },
    {
        id: 'classic',
        name: 'Cổ Điển',
        emoji: '📜',
        bgColor: '#fef3c7',
        headerBg: 'rgba(0,0,0,0.05)',
        headerText: '#451a03',
        accentColor: '#92400e',
        borderColor: '#451a03',
        cellBg: '#fffbeb',
        cellText: '#451a03',
        matchedBg: '#92400e',
        matchedText: '#fff',
        footerText: 'rgba(69,26,3,0.4)',
        title: 'LÔ TÔ',
        subtitle: 'CLASSIC',
    },
];

export const DEFAULT_THEME_ID = 'tet';

export function getThemeById(id: string): TicketTheme {
    return TICKET_THEMES.find(t => t.id === id) || TICKET_THEMES[0];
}
