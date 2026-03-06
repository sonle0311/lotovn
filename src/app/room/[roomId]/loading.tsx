"use client";

export default function RoomLoading() {
    return (
        <div className="min-h-screen bg-red-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-yellow-500 rounded-full animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-yellow-500">🎰</span>
                </div>
                <p className="text-yellow-500/60 text-sm font-black uppercase tracking-widest">
                    Đang vào phòng...
                </p>
            </div>
        </div>
    );
}
