"use client";

export default function Loading() {
    return (
        <div className="min-h-screen bg-red-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                <p className="text-yellow-500/60 text-sm font-black uppercase tracking-widest">
                    Đang tải...
                </p>
            </div>
        </div>
    );
}
