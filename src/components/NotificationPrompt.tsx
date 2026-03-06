"use client";

import { memo, useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

const NotificationPrompt = memo(function NotificationPrompt() {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof Notification !== "undefined") {
            setPermission(Notification.permission);
        }
        setDismissed(localStorage.getItem("loto-notif-dismissed") === "true");
    }, []);

    if (permission === "granted" || permission === "denied" || dismissed) return null;
    if (typeof Notification === "undefined") return null;

    const handleAllow = async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
            new Notification("🧧 Lô Tô Tết", {
                body: "Bạn sẽ nhận thông báo khi game bắt đầu!",
                icon: "/favicon.ico",
            });
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem("loto-notif-dismissed", "true");
    };

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-gradient-to-r from-red-950 to-red-900 border border-yellow-500/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
                <Bell size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">Bật thông báo?</p>
                    <p className="text-xs text-white/50 mt-0.5">Nhận thông báo khi game bắt đầu hoặc có người kinh</p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleAllow}
                            className="px-3 py-1.5 bg-yellow-500 text-red-950 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-all"
                        >
                            Cho phép
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-1.5 bg-white/5 text-white/40 rounded-xl text-xs border border-white/10 hover:bg-white/10 transition-all"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

/**
 * Send a browser notification if permitted.
 */
export function sendNotification(title: string, body: string): void {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
            new Notification(title, {
                body,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
            });
        } catch {
            // Fallback: noop
        }
    }
}

export default NotificationPrompt;
