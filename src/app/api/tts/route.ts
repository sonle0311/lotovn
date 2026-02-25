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

export async function GET(req: NextRequest) {
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
        // Mimic a real browser request — required by Google TTS
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
        // Cache 24 h — same Vietnamese text always produces identical audio
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "TTS fetch failed" }, { status: 502 });
  }
}
