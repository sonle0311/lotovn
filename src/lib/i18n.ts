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
        // Landing page
        'landing.name_label': 'Định danh (Tên)',
        'landing.name_placeholder': 'VD: Công Tử Bạc Liêu',
        'landing.room_label': 'Mã Phòng',
        'landing.room_placeholder': 'Nhập mã hoặc để trống...',
        'landing.join_btn': 'THAM GIA NGAY',
        'landing.or': 'Hoặc',
        'landing.create_btn': 'TẠO PHÒNG MỚI',
        'landing.public_rooms': 'PHÒNG CÔNG KHAI',
        'landing.hero_desc': 'Trải nghiệm không gian văn hóa dân gian kết hợp công nghệ hiện đại.',
        'landing.hero_cta': 'Chơi ngay, lộc về tay!',
        'landing.err_name': 'Vui lòng nhập tên của bạn',
        'landing.err_room': 'Vui lòng nhập mã phòng',
        'landing.err_create': 'Không thể tạo phòng. Vui lòng thử lại.',
        // Room page
        'room.title_prefix': 'PHÒNG',
        'room.drawing': 'Đang xổ',
        'room.ended_label': 'Kết thúc',
        'room.waiting_label': 'Chờ bắt đầu',
        'room.your_ticket': 'Phiếu của bạn',
        'room.new_number': 'Số mới',
        'room.new_game': 'CHƠI VÁN MỚI',
        'room.waiting_host': 'Đang chờ chủ phòng bắt đầu ván mới...',
        'room.game_mode': 'Chế độ chơi',
        // Admin controls
        'admin.host_panel': 'Bảng Điều Khiển Host',
        'admin.auto': 'Tự động',
        'admin.auto_draw': 'Tự động xổ',
        'admin.manual_draw': 'Xổ thủ công',
        'admin.draw_speed': 'Tốc độ xổ',
        'admin.sec_per_num': 'giây / số',
        'admin.room_settings': 'Cài đặt phòng',
        'admin.public_toggle': 'Công khai lobby',
        'admin.room_name_placeholder': 'Tên phòng hiển thị...',
        'admin.save': 'Lưu',
        // Lobby
        'lobby.auto_refresh': 'Tự động làm mới',
        'lobby.rooms_count': 'phòng',
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
        // Landing page
        'landing.name_label': 'Your Name',
        'landing.name_placeholder': 'E.g: Lucky Player',
        'landing.room_label': 'Room Code',
        'landing.room_placeholder': 'Enter code or leave empty...',
        'landing.join_btn': 'JOIN NOW',
        'landing.or': 'Or',
        'landing.create_btn': 'CREATE NEW ROOM',
        'landing.public_rooms': 'PUBLIC ROOMS',
        'landing.hero_desc': 'Experience Vietnamese folk culture combined with modern technology.',
        'landing.hero_cta': 'Play now, win big!',
        'landing.err_name': 'Please enter your name',
        'landing.err_room': 'Please enter room code',
        'landing.err_create': 'Could not create room. Please try again.',
        // Room page
        'room.title_prefix': 'ROOM',
        'room.drawing': 'Drawing',
        'room.ended_label': 'Ended',
        'room.waiting_label': 'Waiting to start',
        'room.your_ticket': 'Your ticket',
        'room.new_number': 'New number',
        'room.new_game': 'PLAY NEW GAME',
        'room.waiting_host': 'Waiting for host to start a new game...',
        'room.game_mode': 'Game mode',
        // Admin controls
        'admin.host_panel': 'Host Panel',
        'admin.auto': 'Auto',
        'admin.auto_draw': 'Auto draw',
        'admin.manual_draw': 'Manual draw',
        'admin.draw_speed': 'Draw speed',
        'admin.sec_per_num': 'sec / num',
        'admin.room_settings': 'Room settings',
        'admin.public_toggle': 'Public lobby',
        'admin.room_name_placeholder': 'Room display name...',
        'admin.save': 'Save',
        // Lobby
        'lobby.auto_refresh': 'Auto-refreshing',
        'lobby.rooms_count': 'rooms',
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

