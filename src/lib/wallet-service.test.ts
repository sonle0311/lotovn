import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBalance, addXu, spendXu, checkDailyBonus, WIN_REWARD, PLAY_REWARD } from './wallet-service';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('wallet-service', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    describe('getBalance', () => {
        it('should return initial balance of 100 for new wallet', () => {
            const balance = getBalance();
            expect(balance).toBe(100);
        });
    });

    describe('addXu', () => {
        it('should add xu to balance', () => {
            const initial = getBalance();
            const newBalance = addXu(50);
            expect(newBalance).toBe(initial + 50);
        });

        it('should accumulate multiple additions', () => {
            getBalance(); // init wallet
            addXu(10);
            addXu(20);
            const balance = getBalance();
            expect(balance).toBe(130); // 100 + 10 + 20
        });
    });

    describe('spendXu', () => {
        it('should deduct xu when sufficient balance', () => {
            getBalance(); // init 100
            const result = spendXu(30);
            expect(result.success).toBe(true);
            expect(result.balance).toBe(70);
        });

        it('should fail when insufficient balance', () => {
            getBalance(); // init 100
            const result = spendXu(200);
            expect(result.success).toBe(false);
            expect(result.balance).toBe(100);
        });

        it('should allow spending exact balance', () => {
            getBalance(); // init 100
            const result = spendXu(100);
            expect(result.success).toBe(true);
            expect(result.balance).toBe(0);
        });

        it('should fail after spending all', () => {
            getBalance();
            spendXu(100);
            const result = spendXu(1);
            expect(result.success).toBe(false);
            expect(result.balance).toBe(0);
        });
    });

    describe('checkDailyBonus', () => {
        it('should grant 20 xu on first call of the day', () => {
            getBalance();
            const bonus = checkDailyBonus();
            expect(bonus).toBe(20);
        });

        it('should not grant bonus on second call same day', () => {
            getBalance();
            checkDailyBonus(); // first claim
            const bonus2 = checkDailyBonus();
            expect(bonus2).toBe(0);
        });

        it('bonus should add to balance', () => {
            const initial = getBalance();
            checkDailyBonus();
            expect(getBalance()).toBe(initial + 20);
        });
    });

    describe('constants', () => {
        it('WIN_REWARD should be 50', () => {
            expect(WIN_REWARD).toBe(50);
        });

        it('PLAY_REWARD should be 10', () => {
            expect(PLAY_REWARD).toBe(10);
        });
    });
});
