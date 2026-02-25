import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LotoVN - Lô Tô Việt Nam Online",
    short_name: "LotoVN",
    description: "Trò chơi Lô Tô đa người chơi phong cách lễ hội Việt Nam",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#7f1d1d",
    background_color: "#450a0a",
    lang: "vi",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" as const },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" as const },
    ],
  };
}
