# Phase 01: Sound System

**Parent**: [plan.md](./plan.md) | **Research**: [sound-pwa](./research/researcher-260225-sound-pwa.md)
**Date**: 260225 | **Priority**: HIGH | **Status**: completed | **Review**: pending
**Dependencies**: None (Group A, parallel-safe)

---

## Overview

Wire existing non-functional `isMuted` toggle in `NumberDrawing.tsx` to real audio. New `useSoundSystem` hook encapsulates Web Speech API TTS (vi-VN) + Web Audio API oscillator beep. Zero npm deps.

## Key Insights

- `isMuted` state exists at `NumberDrawing.tsx:14` but triggers nothing
- `formatNumberVietnamese(n)` in `gameLogic.ts:13-37` returns "Hai muoi ba -- 23" format; split on " -- " for TTS text
- AudioContext starts `suspended` on mobile; must call `.resume()` on user gesture
- `speechSynthesis.getVoices()` loads async; use `onvoiceschanged` event
- Single AudioContext per page (browser limit); use singleton ref pattern

## Requirements

**Functional:**
- TTS announces each drawn number in Vietnamese when unmuted
- Short beep (800Hz, 150ms) plays on each number draw
- Win fanfare: ascending 3-tone sequence on `game_end`
- Mute toggle silences both TTS and SFX immediately

**Non-functional:**
- SSR-safe (guard all `window`/`speechSynthesis` access)
- AudioContext resumes on first user interaction (autoplay policy)
- No new npm packages

## Architecture

```
NumberDrawing.tsx
  |-- useSoundSystem(isMuted)
        |-- AudioContext singleton (ref)
        |-- SpeechSynthesis vi-VN voice (ref)
        |-- announceNumber(n) -> TTS
        |-- playDrawBeep() -> oscillator 800Hz
        |-- playWinFanfare() -> 3 ascending tones
```

### Hook Interface

```typescript
interface SoundSystem {
  announceNumber: (n: number) => void;
  playDrawBeep: () => void;
  playWinFanfare: () => void;
}
function useSoundSystem(isMuted: boolean): SoundSystem;
```

## Related Code Files

| File | Role | Lines |
|------|------|-------|
| `src/lib/use-sound-system.ts` | NEW -- hook | ~80 |
| `src/components/NumberDrawing.tsx` | MODIFY -- consume hook | 97 total |
| `src/lib/gameLogic.ts` | READ -- `formatNumberVietnamese` | L13-37 |

## Implementation Steps

### 1. Create `src/lib/use-sound-system.ts`

```typescript
"use client";
import { useRef, useCallback, useEffect } from "react";
import { formatNumberVietnamese } from "./gameLogic";

export function useSoundSystem(isMuted: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const viVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  // Select vi-VN voice async
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const pick = () => {
      const v = speechSynthesis.getVoices();
      viVoiceRef.current = v.find(x => x.lang === "vi-VN")
        || v.find(x => x.lang.startsWith("vi")) || null;
    };
    pick();
    speechSynthesis.onvoiceschanged = pick;
  }, []);

  const announceNumber = useCallback((n: number) => { /* TTS */ }, [isMuted]);
  const playDrawBeep = useCallback(() => { /* 800Hz 150ms */ }, [isMuted, getCtx]);
  const playWinFanfare = useCallback(() => { /* 3 ascending tones */ }, [isMuted, getCtx]);

  return { announceNumber, playDrawBeep, playWinFanfare };
}
```

Key patterns for each function:
- **announceNumber**: `speechSynthesis.cancel()` then `speak(new SpeechSynthesisUtterance(text))` with `lang:"vi-VN"`, `voice: viVoiceRef.current`
- **playDrawBeep**: create oscillator at 800Hz, gain 0.3 -> exponentialRamp to 0.01, duration 150ms
- **playWinFanfare**: schedule 3 oscillators at 523Hz, 659Hz, 784Hz (C5-E5-G5) staggered 150ms apart, each 200ms duration

### 2. Modify `NumberDrawing.tsx`

- Add `useEffect` to imports (line 6)
- Import `useSoundSystem` from `@/lib/use-sound-system`
- After `isMuted` useState (line 14): call `const { announceNumber, playDrawBeep } = useSoundSystem(isMuted);`
- Add useEffect after `reversedNumbers` useMemo:
  ```typescript
  useEffect(() => {
    if (currentNumber !== null) {
      playDrawBeep();
      announceNumber(currentNumber);
    }
  }, [currentNumber, playDrawBeep, announceNumber]);
  ```
- Props interface unchanged; `playWinFanfare` exported but used in Phase 04 page.tsx

## Todo Checklist

- [x] Create `src/lib/use-sound-system.ts`
- [x] Implement `getCtx` AudioContext singleton with resume
- [x] Implement vi-VN voice selection with `onvoiceschanged`
- [x] Implement `announceNumber` with TTS
- [x] Implement `playDrawBeep` with oscillator
- [x] Implement `playWinFanfare` with 3 ascending tones
- [x] Modify `NumberDrawing.tsx`: import hook, add useEffect
- [x] Verify SSR build succeeds (no window errors) — tsc --noEmit exit 0
- [ ] Test mute/unmute toggles audio (manual browser test required)

## Success Criteria

- Mute button toggles both TTS and beep on/off
- Vietnamese number announced on each draw (when unmuted)
- No console errors on SSR or initial load
- AudioContext resumes on mobile after first tap

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| vi-VN voice unavailable on Windows | Medium | Fallback: `vi` prefix voice, then default lang |
| iOS AudioContext suspended | High | Resume in getCtx on every call |
| speechSynthesis unsupported (rare) | Low | Guard with typeof check |

## Security Considerations

- All browser-local APIs, no external calls, no user data transmitted

## Next Steps

- Phase 04 uses `playWinFanfare` alongside confetti in page.tsx win effect
- Future: Vibration API for haptic feedback
