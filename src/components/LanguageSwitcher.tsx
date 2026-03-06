"use client";

import { memo, useState, useEffect } from "react";
import { AVAILABLE_LOCALES, getLocale, setLocale, type Locale } from "@/lib/i18n";

const LanguageSwitcher = memo(function LanguageSwitcher() {
    // SSR-safe: default 'vi', then sync from localStorage after mount
    const [locale, setLocalState] = useState<Locale>('vi');

    useEffect(() => {
        setLocalState(getLocale());
    }, []);

    const handleChange = (newLocale: Locale) => {
        setLocale(newLocale);
        setLocalState(newLocale);
        window.location.reload();
    };

    return (
        <div className="flex gap-1">
            {AVAILABLE_LOCALES.map(loc => (
                <button
                    key={loc.id}
                    onClick={() => handleChange(loc.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${locale === loc.id
                        ? "bg-yellow-500/20 border border-yellow-500/30 text-yellow-300"
                        : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
                        }`}
                    title={loc.label}
                >
                    <span>{loc.flag}</span>
                </button>
            ))}
        </div>
    );
});

export default LanguageSwitcher;
