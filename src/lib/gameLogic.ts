export type LotoCard = (number | null)[][];

export interface LotoTicket {
    frames: LotoCard[];
    color: string;
    id: string;
}

/**
 * Format number to Vietnamese Lô Tô style
 * Example: 23 -> "Hai mươi ba – 23"
 */
export const formatNumberVietnamese = (n: number): string => {
    const units = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];

    if (n === 0) return "Không – 00";

    let text = "";
    const chuc = Math.floor(n / 10);
    const donVi = n % 10;

    if (chuc > 0) {
        text += tens[chuc];
        if (donVi > 0) {
            if (donVi === 1 && chuc > 1) text += " mốt";
            else if (donVi === 5) text += " lăm";
            else text += " " + units[donVi];
        }
    } else {
        text += units[donVi];
    }

    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    return `${text} – ${n < 10 ? '0' + n : n}`;
};

const COL_RANGES = [
    { min: 1, max: 9 },
    { min: 10, max: 19 },
    { min: 20, max: 29 },
    { min: 30, max: 39 },
    { min: 40, max: 49 },
    { min: 50, max: 59 },
    { min: 60, max: 69 },
    { min: 70, max: 79 },
    { min: 80, max: 90 },
];

/**
 * Generate a traditional Vietnamese Lô Tô card (90 numbers)
 * Rules:
 * - 3 rows, 9 columns.
 * - Each row has exactly 5 numbers.
 * - Total 15 numbers per card.
 * - Numbers in columns are sorted.
 * - Column ranges: 1-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80-90.
 */
export const generateCard = (usedNumbers: Set<number> = new Set()): LotoCard => {
    const card: LotoCard = Array.from({ length: 3 }, () => Array(9).fill(null));

    // Distribution: Each row must have exactly 5 numbers.
    // Each column must have at least 1 number.

    const grid = Array.from({ length: 3 }, () => Array(9).fill(false));
    const rowCounts = [0, 0, 0];

    // Calculate remaining capacity per column
    const colRemaining = COL_RANGES.map(range => {
        let count = 0;
        for (let v = range.min; v <= range.max; v++) {
            if (!usedNumbers.has(v)) count++;
        }
        return count;
    });

    const rows = [0, 1, 2];

    // Step 1: Ensure each column has at least one number if possible
    for (let c = 0; c < 9; c++) {
        if (colRemaining[c] <= 0) continue; // Skip if col is exhausted

        const shuffledRows = [...rows].sort(() => Math.random() - 0.5);
        for (const r of shuffledRows) {
            if (rowCounts[r] < 5) {
                grid[r][c] = true;
                rowCounts[r]++;
                colRemaining[c]--;
                break;
            }
        }
    }

    // Step 2: Fill remaining numbers up to 15 (5 per row)
    for (let r = 0; r < 3; r++) {
        while (rowCounts[r] < 5) {
            const candidates = [];
            for (let c = 0; c < 9; c++) {
                // Can only add to column if it has room in both this row and the whole ticket range
                if (!grid[r][c] && colRemaining[c] > 0) candidates.push(c);
            }

            if (candidates.length === 0) {
                // Emergency break: should not happen with 90 numbers and 45 slots
                break;
            }

            const luckyCol = candidates[Math.floor(Math.random() * candidates.length)];
            grid[r][luckyCol] = true;
            rowCounts[r]++;
            colRemaining[luckyCol]--;
        }
    }

    // Step 3: Assign numbers based on columns
    for (let c = 0; c < 9; c++) {
        const range = COL_RANGES[c];
        const pool = [];
        for (let val = range.min; val <= range.max; val++) {
            if (!usedNumbers.has(val)) pool.push(val);
        }

        // Shuffle pool using Fisher-Yates for better quality
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const rowsInCol = [];
        for (let r = 0; r < 3; r++) {
            if (grid[r][c]) rowsInCol.push(r);
        }

        if (rowsInCol.length > 0) {
            const selectedNums = pool.slice(0, rowsInCol.length).sort((a, b) => a - b);
            rowsInCol.forEach((r, idx) => {
                const num = selectedNums[idx];
                card[r][c] = num;
                usedNumbers.add(num);
            });
        }
    }

    return card;
};

/**
 * Generate a complete Loto Ticket with 3 frames and a random color
 */
export const generateTicket = (): LotoTicket => {
    const usedNumbers = new Set<number>();
    const frames = [
        generateCard(usedNumbers),
        generateCard(usedNumbers),
        generateCard(usedNumbers)
    ];
    const colors = [
        '#fcd34d', // Yellow
        '#fb923c', // Orange
        '#f87171', // Red
        '#ec4899', // Pink
        '#a855f7', // Purple
        '#3b82f6', // Blue
        '#4ade80', // Green
        '#94a3b8', // Gray/Blue
    ];

    return {
        id: Math.random().toString(36).substring(2, 9),
        frames,
        color: colors[Math.floor(Math.random() * colors.length)],
    };
};

/**
 * Check if a row is completed
 */
export const checkRowWin = (row: (number | null)[], drawnNumbers: Set<number>): boolean => {
    const rowNumbers = row.filter((n): n is number => n !== null);
    if (rowNumbers.length === 0) return false;
    return rowNumbers.every(n => drawnNumbers.has(n));
};

/**
 * Check if the full card is completed
 */
export const checkFullCardWin = (card: LotoCard, drawnNumbers: Set<number>): boolean => {
    return card.every(row => checkRowWin(row, drawnNumbers));
};

/**
 * Check if a row is "Chờ Kinh" (missing exactly one number)
 */
export const checkRowWaitingKinh = (row: (number | null)[], drawnNumbers: Set<number>): boolean => {
    const rowNumbers = row.filter((n): n is number => n !== null);
    if (rowNumbers.length === 0) return false;

    const matchedCount = rowNumbers.filter(n => drawnNumbers.has(n)).length;
    return matchedCount === rowNumbers.length - 1;
};

/**
 * Check if the card has any row "Chờ Kinh"
 */
export const checkCardWaitingKinh = (card: LotoCard, drawnNumbers: Set<number>): boolean => {
    return card.some(row => checkRowWaitingKinh(row, drawnNumbers));
};
