import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lotovn.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7f1d1d",
};

export const metadata: Metadata = {
  // ─── Core ─────────────────────────────────────────────
  title: {
    default: "LotoVN - Trải Nghiệm Lô Tô Tết Premium",
    template: "%s | LotoVN",
  },
  description:
    "Chơi Lô Tô online đa người chơi phong cách lễ hội Việt Nam. Tạo phòng, mời bạn bè, quay số trực tiếp — miễn phí, không cần tải app!",
  keywords: [
    "lô tô", "lô tô online", "loto", "loto vietnam",
    "trò chơi tết", "game tết", "lô tô tết",
    "lô tô trực tuyến", "chơi lô tô miễn phí",
    "multiplayer loto", "Vietnamese lottery game",
  ],
  authors: [{ name: "LotoVN Team" }],
  creator: "LotoVN",
  publisher: "LotoVN",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  // ─── Robots & Indexing ────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ─── Open Graph (Facebook, Zalo, etc.) ────────────────
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "LotoVN",
    title: "LotoVN - Trải Nghiệm Lô Tô Tết Premium",
    description:
      "Chơi Lô Tô online đa người chơi phong cách lễ hội Việt Nam. Tạo phòng, quay số trực tiếp — miễn phí!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LotoVN - Trò chơi Lô Tô online Việt Nam",
        type: "image/png",
      },
    ],
  },

  // ─── Twitter Card ─────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "LotoVN - Trải Nghiệm Lô Tô Tết Premium",
    description:
      "Chơi Lô Tô online đa người chơi phong cách lễ hội Việt Nam. Miễn phí!",
    images: ["/og-image.png"],
  },

  // ─── Icons ────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg" },
    ],
  },

  // ─── PWA Manifest ─────────────────────────────────────
  manifest: "/manifest.json",

  // ─── App-specific ─────────────────────────────────────
  applicationName: "LotoVN",
  category: "games",
  classification: "Game, Entertainment",
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
