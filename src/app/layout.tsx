import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lexend = Lexend({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Lô Tô Tết - Game Việt Truyền Thống",
  description: "Trò chơi Lô Tô đa người chơi phong cách lễ hội Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-red-950 text-white min-h-screen overflow-x-hidden`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
