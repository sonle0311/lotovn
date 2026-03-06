"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-red-950 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-8 text-center border-red-500/30">
                <div className="text-5xl mb-4">💥</div>
                <h2 className="text-xl font-black text-white mb-2">Ối! Có lỗi xảy ra</h2>
                <p className="text-white/50 text-sm mb-6">
                    Đã có sự cố xảy ra. Vui lòng thử lại.
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-red-950 font-black rounded-xl hover:bg-yellow-400 transition-colors"
                >
                    <RotateCcw size={16} />
                    Thử lại
                </button>
            </div>
        </div>
    );
}
