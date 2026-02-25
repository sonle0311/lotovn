import type { NextConfig } from "next";

/**
 * Adsterra script/frame domains
 * - highperformanceformat.com  → banner invoke.js (standard banner key)
 * - profitablecpmrate.com      → social bar invoke.js
 * - adsterra.com subdomains    → ad creatives & tracking pixels
 * - butterflymediaget.com / go-cetechnology.com → common Adsterra CDN aliases
 */
const ADSTERRA_SCRIPT_SRC = [
  "https://*.highperformanceformat.com",
  "https://*.profitablecpmrate.com",
  "https://*.adsterra.com",
  "https://*.butterflymediaget.com",
  "https://*.go-cetechnology.com",
].join(" ");

const ADSTERRA_IMG_SRC = [
  "https://*.highperformanceformat.com",
  "https://*.adsterra.com",
  "https://*.butterflymediaget.com",
].join(" ");

const ADSTERRA_FRAME_SRC = [
  "https://*.highperformanceformat.com",
  "https://*.adsterra.com",
  "https://*.profitablecpmrate.com",
].join(" ");

const securityHeaders = [
  // Allow Adsterra scripts to load inside iframe srcdoc
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${ADSTERRA_SCRIPT_SRC}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: blob: ${ADSTERRA_IMG_SRC}`,
      `frame-src 'self' ${ADSTERRA_FRAME_SRC}`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${ADSTERRA_SCRIPT_SRC}`,
      `media-src 'self' blob:`,
    ].join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
