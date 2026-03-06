"use client";

import { memo, useState } from "react";
import { AVAILABLE_LOCALES, getLocale, setLocale, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

const LanguageSwitcher = memo(function LanguageSwitcher() {
    const [locale, setLocalState] = useState<Locale>(getLocale());

    const handleChange = (newLocale: Locale) => {
        setLocale(newLocale);
        setLocalState(newLocale);
        // Force page refresh to apply translations
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
