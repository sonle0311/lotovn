"use client";

import { ShoppingBag, ExternalLink } from "lucide-react";

/** Shopee affiliate homepage link — hoa hồng ghi nhận 7 ngày */
const SHOPEE_AFFILIATE_URL = "https://s.shopee.vn/2qPO9F6mYk";

interface Props {
    /**
     * winner  — full-width CTA button, dùng trong winner modal
     * waiting — compact bar, dùng trong waiting room
     * landing — mini inline link, dùng trong landing page footer
     */
    variant?: "winner" | "waiting" | "landing";
    className?: string;
}

/**
 * ShopeeAffiliateCTA — hiển thị link affiliate Shopee tinh tế
 * Đặt ở các điểm dừng tự nhiên: winner modal, waiting room, landing page
 */
export default function ShopeeAffiliateCTA({ variant = "waiting", className = "" }: Props) {
    // Full-width CTA trong winner modal — nổi bật nhưng không lấn át chiến thắng
    if (variant === "winner") {
        return (
            <a
                href={SHOPEE_AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={`flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl
                    bg-orange-500/10 border border-orange-500/25
                    text-orange-300 text-sm font-bold
                    hover:bg-orange-500/20 hover:border-orange-500/50 hover:text-orange-200
                    transition-all duration-300 group ${className}`}
                aria-label="Mua sắm Tết trên Shopee"
            >
                <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>🛒 Mua sắm Tết trên Shopee</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
        );
    }

    // Compact bar trong waiting room — nhỏ gọn dưới ticket
    if (variant === "waiting") {
        return (
            <a
                href={SHOPEE_AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-orange-500/10 border border-orange-500/20
                    text-orange-400/80 text-xs font-bold
                    hover:bg-orange-500/15 hover:text-orange-300
                    transition-all duration-200 group ${className}`}
                aria-label="Mua sắm Tết"
            >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Chuẩn bị Tết trên Shopee</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-40" />
            </a>
        );
    }

    // Mini link trong landing page footer — hòa vào design
    return (
        <a
            href={SHOPEE_AFFILIATE_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`inline-flex items-center gap-1 text-[10px] font-bold
                text-white/20 hover:text-orange-400/80
                transition-colors duration-200 pointer-events-auto ${className}`}
            aria-label="Shopee Tết"
        >
            <ShoppingBag className="w-2.5 h-2.5" />
            <span>Shopee Tết</span>
        </a>
    );
}
