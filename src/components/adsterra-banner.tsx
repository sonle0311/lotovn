"use client";

import { useState } from "react";
import { X } from "lucide-react";

/**
 * Adsterra banner key — set NEXT_PUBLIC_ADSTERRA_KEY in .env.local
 * Lấy key từ: Adsterra Dashboard → Sites → Create placement → Banner
 */
const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY ?? "";

// Adsterra Social Bar key (floating bar, ít intrusive nhất)
const ADSTERRA_SOCIAL_BAR_KEY = process.env.NEXT_PUBLIC_ADSTERRA_SOCIAL_BAR_KEY ?? "";

interface AdsterraBannerProps {
    /**
     * mobile     — 320×50, dùng trong game room mobile
     * leaderboard — 728×90, dùng trong landing page desktop
     */
    size?: "mobile" | "leaderboard";
    className?: string;
}

/**
 * AdsterraBanner — iframe srcdoc approach (only reliable in React/Next.js)
 *
 * WHY iframe srcdoc: React components share the same window object.
 * Multiple Adsterra ads overwrite each other's window.atOptions.
 * Each iframe gets its own isolated window context → no conflict.
 *
 * Refs: https://joshwp.com/how-to-implement-adsterra-ads-in-react-js-next-js-projects/
 */
export function AdsterraBanner({ size = "mobile", className = "" }: AdsterraBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    // Không render nếu key chưa cấu hình hoặc đã dismiss
    if (!ADSTERRA_KEY || dismissed) return null;

    const width = size === "leaderboard" ? 728 : 320;
    const height = size === "leaderboard" ? 90 : 50;

    // Mỗi iframe có window.atOptions riêng biệt — không conflict
    const adHTML = `<!DOCTYPE html>
<html>
<head>
  <style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <script type="text/javascript">
    atOptions={'key':'${ADSTERRA_KEY}','format':'iframe','height':${height},'width':${width},'params':{}}
  </script>
  <script type="text/javascript" src="//www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js"></script>
</body>
</html>`;

    return (
        <div
            className={`relative flex justify-center items-center ${className}`}
            style={{ minWidth: width, minHeight: height + 8 }}
            aria-label="Quảng cáo"
        >
            {/* Nút đóng */}
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

            <iframe
                srcDoc={adHTML}
                style={{ width, height, border: "none", overflow: "hidden", display: "block" }}
                scrolling="no"
                title="Quảng cáo"
                /* sandbox cho phép script chạy nhưng cô lập với parent */
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    );
}

interface AdsterraSocialBarProps {
    className?: string;
}

/**
 * AdsterraSocialBar — floating bar ad (least intrusive format)
 * Adsterra Social Bar: hiển thị thanh nhỏ ở top/bottom
 * Dùng key khác với banner (tạo riêng trên Adsterra dashboard)
 */
export function AdsterraSocialBar({ className = "" }: AdsterraSocialBarProps) {
    const [dismissed, setDismissed] = useState(false);

    if (!ADSTERRA_SOCIAL_BAR_KEY || dismissed) return null;

    const adHTML = `<!DOCTYPE html>
<html>
<head>
  <style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>
</head>
<body>
  <script type="text/javascript" src="//pl${ADSTERRA_SOCIAL_BAR_KEY}.profitablecpmrate.com/${ADSTERRA_SOCIAL_BAR_KEY}/invoke.js" async></script>
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
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
        </div>
    );
}

export default AdsterraBanner;
