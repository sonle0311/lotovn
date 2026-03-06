/**
 * /api/tts — Server-side proxy for Google Translate TTS.
 * Bypasses browser CORS & bot-protection by fetching audio server-side,
 * then returning it with proper headers. Responses are cached 24 h
 * (same number text → same audio bytes every time).
 *
 * GET /api/tts?text=Hai+mươi+ba
 */
import { NextRequest, NextResponse } from "next/server";

/** Maximum text length accepted (avoid abuse). */
const MAX_TEXT_LEN = 120;

/** Rate limit: max requests per window per IP */
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 phút

/** In-memory rate limit store (IP → { count, resetAt }) */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Cleanup expired entries periodically (tránh memory leak)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(ip);
    }
  }, RATE_LIMIT_WINDOW_MS * 2);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const text = req.nextUrl.searchParams.get("text") ?? "";

  if (!text || text.length > MAX_TEXT_LEN) {
    return NextResponse.json({ error: "Missing or too-long text param" }, { status: 400 });
  }

  const ttsUrl =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob&ttsspeed=0.9`;

  try {
    const upstream = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream TTS failed: ${upstream.status}` },
        { status: 502 }
      );
    }

    const audio = await upstream.arrayBuffer();

    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "TTS fetch failed" }, { status: 502 });
  }
}
