"use client";

import { memo, useEffect, useState } from "react";
import { Coins, Gift } from "lucide-react";
import { toast } from "sonner";
import { checkDailyBonus, getBalance } from "@/lib/wallet-service";
import { useHydrated } from "@/lib/useHydrated";

const WalletBadge = memo(function WalletBadge() {
    const hydrated = useHydrated();
    const [balance, setBalance] = useState<number | null>(null);
    const [showBonus, setShowBonus] = useState(false);

    useEffect(() => {
        if (!hydrated) return;
        const initTimer = setTimeout(() => {
            const bonus = checkDailyBonus();
            setBalance(getBalance());

            if (bonus > 0) {
                setShowBonus(true);
                toast.success(`+${bonus} xu thuong hang ngay!`, { duration: 3000 });
                setTimeout(() => setShowBonus(false), 3000);
            }
        }, 0);

        return () => clearTimeout(initTimer);
    }, [hydrated]);

    if (balance === null) return null;

    return (
        <div className="flex items-center gap-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5">
            <Coins size={14} className="text-yellow-500" />
            <span className="text-xs font-bold text-yellow-400">{balance}</span>
            {showBonus ? <Gift size={12} className="animate-bounce text-green-400" /> : null}
        </div>
    );
});

export default WalletBadge;
