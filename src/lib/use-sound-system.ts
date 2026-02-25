"use client";
import { useRef, useCallback, useEffect } from "react";
import { formatNumberVietnamese } from "./gameLogic";

/**
 * useSoundSystem — encapsulates Web Speech API (TTS) and Web Audio API (SFX).
 * All browser-API access is SSR-safe (guarded with typeof window checks).
 *
 * @param isMuted - when true, all audio output is suppressed immediately.
 * @returns { announceNumber, playDrawBeep, playWinFanfare }
 */
export function useSoundSystem(isMuted: boolean) {
  // Singleton AudioContext ref (browsers allow max one per page)
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Cached vi-VN SpeechSynthesisVoice (populated async on some browsers)
  const viVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  /**
   * Returns the shared AudioContext, creating it on first call and resuming
   * it if suspended (required by browser autoplay policy after user gesture).
   */
  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Selects the best available vi-VN voice from the SpeechSynthesis API.
   * Falls back to any "vi" prefixed voice, then null (browser default).
   * Uses onvoiceschanged because getVoices() may return [] synchronously
   * in Chrome until the voices list is asynchronously populated.
   */
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const pick = () => {
      const voices = speechSynthesis.getVoices();
      viVoiceRef.current =
        voices.find((v) => v.lang === "vi-VN") ||
        voices.find((v) => v.lang.startsWith("vi")) ||
        null;
    };

    pick();
    // addEventListener avoids clobbering other potential handlers on the singleton
    speechSynthesis.addEventListener("voiceschanged", pick);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", pick);
    };
  }, []);

  // Close AudioContext on unmount to avoid Chrome's 6-context limit
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  /**
   * Reads the Vietnamese name portion from formatNumberVietnamese output
   * (e.g. "Hai mươi ba" from "Hai mươi ba – 23") and speaks it via TTS.
   * Cancels any ongoing utterance before starting the new one.
   */
  const announceNumber = useCallback(
    (n: number) => {
      if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

      speechSynthesis.cancel();

      // Split on the em-dash separator produced by formatNumberVietnamese
      const text = formatNumberVietnamese(n).split(" – ")[0]; // e.g. "Hai mươi ba"

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "vi-VN";
      utt.rate = 0.9; // slightly slower for clarity
      if (viVoiceRef.current) utt.voice = viVoiceRef.current;

      speechSynthesis.speak(utt);
    },
    [isMuted]
  );

  /**
   * Plays a short 800 Hz sine-wave beep (150 ms) using the Web Audio API.
   * Signals each new number draw with a subtle audio cue.
   */
  const playDrawBeep = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 800;
    osc.type = "sine";

    // Ramp gain down to avoid click at end
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [isMuted, getCtx]);

  /**
   * Plays an ascending C5-E5-G5 major chord fanfare (3 staggered tones)
   * to celebrate a player win. Each tone is 400 ms and staggered 150 ms apart.
   */
  const playWinFanfare = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const freqs = [523, 659, 784]; // C5, E5, G5

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = "sine";

      const t = ctx.currentTime + i * 0.15; // stagger each tone by 150 ms
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }, [isMuted, getCtx]);

  return { announceNumber, playDrawBeep, playWinFanfare };
}
