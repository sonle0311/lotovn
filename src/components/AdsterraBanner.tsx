"use client";

import { useState } from "react";
import { X, Megaphone } from "lucide-react";

/**
 * Adsterra banner key — set NEXT_PUBLIC_ADSTERRA_KEY_728X90 và NEXT_PUBLIC_ADSTERRA_KEY_320X50 in .env.local
 * Lấy key từ: Adsterra Dashboard → Sites → Create placement → Banner
 */
const ADSTERRA_KEY_728X90 = process.env.NEXT_PUBLIC_ADSTERRA_KEY_728X90 ?? process.env.NEXT_PUBLIC_ADSTERRA_KEY ?? "";
const ADSTERRA_KEY_320X50 = process.env.NEXT_PUBLIC_ADSTERRA_KEY_320X50 ?? process.env.NEXT_PUBLIC_ADSTERRA_KEY ?? "";
const ADSTERRA_SOCIAL_BAR_KEY = process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_KEY ?? "";

/**
 * IS_DEV — true khi chạy localhost
 * Adsterra KHÔNG serve ads trên localhost (domain cookie restriction).
 * Production (vercel.app / domain thật) sẽ hiển thị ads bình thường.
 */
const IS_DEV = process.env.NODE_ENV === "development";

interface AdsterraBannerProps {
    /**
     * mobile      — 320×50, dùng trong game room mobile
     * leaderboard — 728×90, dùng trong landing page desktop
     */
    size?: "mobile" | "leaderboard";
    className?: string;
}

/**
 * AdsterraBanner — iframe srcdoc approach (only reliable in React/Next.js)
 *
 * WHY iframe srcdoc: Multiple ads share window.atOptions — iframe isolates each.
 * WHY ads blank on localhost: Ad networks block 127.0.0.1 / localhost by design.
 *   → Dev mode shows a placeholder with correct dimensions for layout testing.
 *   → Production (real domain) renders the real Adsterra iframe.
 */
export function AdsterraBanner({ size = "mobile", className = "" }: AdsterraBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    const ADSTERRA_KEY = size === "leaderboard" ? ADSTERRA_KEY_728X90 : ADSTERRA_KEY_320X50;

    if (!ADSTERRA_KEY || dismissed) return null;

    const width = size === "leaderboard" ? 728 : 320;
    const height = size === "leaderboard" ? 90 : 50;

    // Dev placeholder — hiển thị đúng kích thước để layout test
    if (IS_DEV) {
        return (
            <div
                className={`relative flex items-center justify-center gap-1.5
                    border border-dashed border-white/20 rounded
                    bg-white/5 text-white/30 text-[9px] font-mono ${className}`}
                style={{ width, height }}
                title="Adsterra ad — chỉ hiện trên production domain"
            >
                <Megaphone className="w-3 h-3 opacity-50" />
                <span>AD {width}×{height} · localhost blocked · works on production</span>
            </div>
        );
    }

    // Mỗi iframe có window.atOptions riêng — không conflict với banner khác
    const adHTML = `<!DOCTYPE html>
<html>
<head>
  <style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <script type="text/javascript">
    atOptions={'key':'${ADSTERRA_KEY}','format':'iframe','height':${height},'width':${width},'params':{}}
  </script>
  <script type="text/javascript" src="https://www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js"></script>
</body>
</html>`;

    return (
        <div
            className={`relative flex justify-center items-center ${className}`}
            style={{ minWidth: width, minHeight: height + 8 }}
            aria-label="Quảng cáo"
        >
            <button
                onClick={() => setDismissed(true)}
                aria-label="Đóng quảng cáo"
                className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full
                    bg-black/60 text-white/50 border border-white/10
                    flex items-center justify-center
                    hover:bg-black/80 hover:text-white/80
                    transition-colors duration-200"
            >
                <X className="w-2.5 h-2.5" />
            </button>

            {/* sandbox: NO allow-same-origin (combining with allow-scripts = sandbox escape warning).
                allow-top-navigation-by-user-activation = ad click opens new tab correctly.
                allow-forms = ad click tracking & redirects require form submissions. */}
            <iframe
                srcDoc={adHTML}
                style={{ width, height, border: "none", overflow: "hidden", display: "block" }}
                scrolling="no"
                title="Quảng cáo"
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-forms allow-same-origin"
            />
        </div>
    );
}

/**
 * AdsterraSocialBar — floating bar format (ít intrusive nhất)
 * Dùng key riêng tạo từ Adsterra dashboard (Social Bar format)
 */
export function AdsterraSocialBar({ className = "" }: { className?: string }) {
    const [dismissed, setDismissed] = useState(false);

    if (!ADSTERRA_SOCIAL_BAR_KEY || dismissed) return null;

    if (IS_DEV) {
        return (
            <div
                className={`flex items-center justify-center gap-1.5
                    border border-dashed border-white/20 rounded
                    bg-white/5 text-white/30 text-[9px] font-mono h-[60px] ${className}`}
                title="Social Bar — localhost blocked"
            >
                <Megaphone className="w-3 h-3 opacity-50" />
                <span>SOCIAL BAR · localhost blocked · works on production</span>
            </div>
        );
    }

    const adHTML = `<!DOCTYPE html>
<html>
<head>
  <style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <script type="text/javascript" src="https://pl${ADSTERRA_SOCIAL_BAR_KEY}.profitablecpmrate.com/${ADSTERRA_SOCIAL_BAR_KEY}/invoke.js" async></script>
</body>
</html>`;

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setDismissed(true)}
                aria-label="Đóng quảng cáo"
                className="absolute top-0 right-0 z-10 w-5 h-5 rounded-full
                    bg-black/60 text-white/50 border border-white/10
                    flex items-center justify-center
                    hover:bg-black/80 transition-colors"
            >
                <X className="w-2.5 h-2.5" />
            </button>
            <iframe
                srcDoc={adHTML}
                style={{ width: "100%", height: 60, border: "none", overflow: "hidden" }}
                scrolling="no"
                title="Quảng cáo"
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-forms"
            />
        </div>
    );
}

export default AdsterraBanner;
