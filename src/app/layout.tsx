import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LotoVN - Trải Nghiệm Lô Tô Tết Premium",
  description: "Trò chơi Lô Tô đa người chơi phong cách lễ hội Việt Nam hiện đại",
  icons: {
    icon: "/favicon.svg",
  },
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
