/**
 * Wallet service for virtual currency (Xu) system.
 * Uses localStorage as primary store since we don't have user auth.
 * When Supabase player_wallets table is available, syncs to it.
 */

const WALLET_KEY = 'loto-wallet';
const DAILY_BONUS_KEY = 'loto-daily-bonus';

interface WalletData {
    balance: number;
    totalEarned: number;
    lastUpdated: string;
}

function getLocalWallet(): WalletData {
    if (typeof localStorage === 'undefined') return { balance: 100, totalEarned: 100, lastUpdated: new Date().toISOString() };
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) {
        const initial: WalletData = { balance: 100, totalEarned: 100, lastUpdated: new Date().toISOString() };
        localStorage.setItem(WALLET_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(raw);
}

function saveLocalWallet(wallet: WalletData): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
    }
}

export function getBalance(): number {
    return getLocalWallet().balance;
}

export function addXu(amount: number): number {
    const wallet = getLocalWallet();
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastUpdated = new Date().toISOString();
    saveLocalWallet(wallet);
    return wallet.balance;
}

export function spendXu(amount: number): { success: boolean; balance: number } {
    const wallet = getLocalWallet();
    if (wallet.balance < amount) return { success: false, balance: wallet.balance };

    wallet.balance -= amount;
    wallet.lastUpdated = new Date().toISOString();
    saveLocalWallet(wallet);
    return { success: true, balance: wallet.balance };
}

/**
 * Check and claim daily bonus (20 xu/day).
 * Returns the bonus amount if eligible, 0 if already claimed today.
 */
export function checkDailyBonus(): number {
    if (typeof localStorage === 'undefined') return 0;

    const lastBonusStr = localStorage.getItem(DAILY_BONUS_KEY);
    const today = new Date().toDateString();

    if (lastBonusStr === today) return 0;

    localStorage.setItem(DAILY_BONUS_KEY, today);
    return addXu(20) ? 20 : 0;
}

// Win reward amounts
export const WIN_REWARD = 50;
export const PLAY_REWARD = 10;
