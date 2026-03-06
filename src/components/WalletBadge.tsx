"use client";

import { memo, useState, useEffect } from "react";
import { Coins, Gift } from "lucide-react";
import { getBalance, checkDailyBonus } from "@/lib/wallet-service";
import { toast } from "sonner";

const WalletBadge = memo(function WalletBadge() {
    const [balance, setBalance] = useState<number | null>(null);
    const [showBonus, setShowBonus] = useState(false);

    useEffect(() => {
        setBalance(getBalance());
        const bonus = checkDailyBonus();
        if (bonus > 0) {
            setShowBonus(true);
            setBalance(getBalance());
            toast.success(`+${bonus} xu thưởng hàng ngày! 🎁`, { duration: 3000 });
            setTimeout(() => setShowBonus(false), 3000);
        }
    }, []);

    // SSR-safe: don't render until client-side balance is loaded
    if (balance === null) return null;

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Coins size={14} className="text-yellow-500" />
            <span className="text-xs font-bold text-yellow-400">{balance}</span>
            {showBonus && (
                <Gift size={12} className="text-green-400 animate-bounce" />
            )}
        </div>
    );
});

export default WalletBadge;
