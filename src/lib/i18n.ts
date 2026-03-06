/** Simple key-value i18n system */

export type Locale = 'vi' | 'en';

const translations: Record<Locale, Record<string, string>> = {
    vi: {
        'app.title': 'Lô Tô Tết',
        'app.subtitle': 'Trải nghiệm Lô Tô trực tuyến',
        'room.create': 'Tạo Phòng',
        'room.join': 'Vào Phòng',
        'room.code': 'Mã Phòng',
        'room.full': 'Phòng đã đầy',
        'room.share': 'Chia sẻ',
        'game.waiting': 'Chờ bắt đầu',
        'game.playing': 'Đang xổ',
        'game.ended': 'Kết thúc',
        'game.start': 'Bắt Đầu',
        'game.reset': 'Chơi Lại',
        'game.kinh': 'KINH!',
        'game.waiting_kinh': 'Chờ Kinh',
        'ticket.change': 'Đổi Vé',
        'ticket.keep': 'Giữ Vé Cũ',
        'ticket.theme': 'Theme vé',
        'ticket.auto_mark': 'Tự động đánh',
        'chat.placeholder': 'Gửi tin nhắn...',
        'chat.send': 'Gửi',
        'chat.title': 'Trò chuyện',
        'player.name': 'Tên của bạn',
        'player.host': 'Chủ phòng',
        'sound.mute': 'Tắt tiếng',
        'sound.unmute': 'Có tiếng',
        'leaderboard.title': 'Bảng Xếp Hạng',
        'lobby.title': 'Phòng Chơi',
        'lobby.join': 'Vào',
        'lobby.empty': 'Chưa có phòng nào đang mở',
    },
    en: {
        'app.title': 'Loto Tet',
        'app.subtitle': 'Vietnamese Loto Online',
        'room.create': 'Create Room',
        'room.join': 'Join Room',
        'room.code': 'Room Code',
        'room.full': 'Room is full',
        'room.share': 'Share',
        'game.waiting': 'Waiting',
        'game.playing': 'Playing',
        'game.ended': 'Ended',
        'game.start': 'Start Game',
        'game.reset': 'Play Again',
        'game.kinh': 'BINGO!',
        'game.waiting_kinh': 'Almost there',
        'ticket.change': 'Change Ticket',
        'ticket.keep': 'Keep Ticket',
        'ticket.theme': 'Ticket theme',
        'ticket.auto_mark': 'Auto mark',
        'chat.placeholder': 'Type a message...',
        'chat.send': 'Send',
        'chat.title': 'Chat',
        'player.name': 'Your name',
        'player.host': 'Host',
        'sound.mute': 'Muted',
        'sound.unmute': 'Sound on',
        'leaderboard.title': 'Leaderboard',
        'lobby.title': 'Rooms',
        'lobby.join': 'Join',
        'lobby.empty': 'No rooms available',
    },
};

let currentLocale: Locale = 'vi';

export function setLocale(locale: Locale): void {
    currentLocale = locale;
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('loto-locale', locale);
    }
}

export function getLocale(): Locale {
    if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('loto-locale') as Locale | null;
        if (saved && translations[saved]) {
            currentLocale = saved;
        }
    }
    return currentLocale;
}

/**
 * Translate a key to the current locale.
 */
export function t(key: string): string {
    return translations[currentLocale]?.[key] ?? translations.vi[key] ?? key;
}

export const AVAILABLE_LOCALES: { id: Locale; label: string; flag: string }[] = [
    { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { id: 'en', label: 'English', flag: '🇺🇸' },
];
