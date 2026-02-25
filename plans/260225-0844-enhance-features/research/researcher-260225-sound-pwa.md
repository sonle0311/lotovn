# Research: Web Speech API, Web Audio API, PWA Manifest for Vietnamese Lô Tô

**Date**: 2025-02-25
**Project**: LotoVN (Vietnamese Lô Tô Web Game)
**Stack**: Next.js 15 (App Router), Tailwind CSS, mobile-first

---

## Topic 1: Web Speech API for Vietnamese TTS

### speechSynthesis.speak() Overview
- Part of W3C Web Speech API (Baseline: widely available since Sept 2018)
- `window.speechSynthesis` is the controller for speech synthesis service
- Core methods: `speak()`, `pause()`, `resume()`, `cancel()`, `getVoices()`

### Vietnamese Language Support
**Setting Vietnamese:**
```javascript
const utterance = new SpeechSynthesisUtterance("Hai ba bốn");
utterance.lang = 'vi-VN';
speechSynthesis.speak(utterance);
```

**Voice Selection Strategy:**
```javascript
const synth = window.speechSynthesis;
let viVoice = null;

// Call after onvoiceschanged
function selectVietnameseVoice() {
  const voices = synth.getVoices();
  viVoice = voices.find(v => v.lang.startsWith('vi-VN'));

  if (!viVoice) {
    viVoice = voices.find(v => v.lang.startsWith('vi'));
  }
  // Fallback: use system default if vi-VN unavailable
  return viVoice;
}

synth.onvoiceschanged = selectVietnameseVoice;
```

**Voices availability depends on OS:**
- Windows: Limited Vietnamese voice support
- macOS/iOS: Typically includes vi-VN voices
- Android: Vendor-dependent
- **Fallback required**: Always check available voices, provide fallback language

### Mobile Autoplay Policy Constraints
**Critical for mobile (iOS/Android):**
- Audio/speech **must be initiated by user gesture** (click, tap, touch)
- Cannot autoplay on page load
- First `speechSynthesis.speak()` will fail silently unless user-triggered

**Implementation pattern:**
```javascript
// Button click handler - MUST be user-triggered
const speakNumber = (number) => {
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(number);
  utterance.lang = 'vi-VN';
  speechSynthesis.speak(utterance);
};

// In JSX:
<button onClick={() => speakNumber("Ba")}>Nói</button>
```

### Utterance Queueing & Queue Management
```javascript
// Queue multiple utterances
const numbers = ['Ba', 'Sáu', 'Chín'];
numbers.forEach(num => {
  const utterance = new SpeechSynthesisUtterance(num);
  utterance.lang = 'vi-VN';
  speechSynthesis.speak(utterance); // Auto-queued
});

// Cancel all
speechSynthesis.cancel();

// Check queue status
console.log(speechSynthesis.speaking);  // Is speaking now
console.log(speechSynthesis.pending);   // Are utterances waiting
```

---

## Topic 2: Web Audio API for Sound Effects

### AudioContext & Oscillator Basics
- **OscillatorNode**: Creates programmatic sine/square/triangle/sawtooth tones
- No audio files needed (0 KB overhead)
- Supported since 2015 across all modern browsers

### Creating a Beep/Ding Sound
**Simple 800Hz beep (200ms):**
```javascript
const playBeep = (frequencyHz = 800, durationMs = 200, volumeLevel = 0.3) => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.setValueAtTime(frequencyHz, audioCtx.currentTime);
  osc.type = 'sine'; // Pure tone

  gain.gain.setValueAtTime(volumeLevel, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + durationMs / 1000);
};
```

**Recommended Frequencies:**
- **800-1000 Hz** - Clear beep for number draw
- **440 Hz** - Musical A note
- **2000 Hz** - Sharp attention-grabbing beep

### AudioContext Suspended State (Autoplay Policy)
**Issue:** AudioContext starts in `suspended` state on mobile
**Solution:**
```javascript
const getOrCreateAudioContext = () => {
  if (!window.audioContext) {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Resume on user gesture
  if (window.audioContext.state === 'suspended') {
    document.addEventListener('click', () => {
      window.audioContext.resume();
    }, { once: true });
  }

  return window.audioContext;
};

// Call before first sound
const ctx = getOrCreateAudioContext();
playBeep();
```

### Simple Chime Pattern (Ding-ding sequence)
```javascript
const playDingSequence = async () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(1000 + (i * 200), ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    await new Promise(r => setTimeout(r, 150));
  }
};
```

---

## Topic 3: PWA Web App Manifest for Next.js 15

### Next.js 15 App Router Manifest Handling
**Two approaches:**

**1. Static manifest.json (public folder):**
```json
// public/manifest.json
{
  "name": "LotoVN - Trải Nghiệm Lô Tô Tết",
  "short_name": "LotoVN",
  "description": "Trò chơi Lô Tô trực tuyến với giao diện hiện đại",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#0a0a0a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

**2. Programmatic manifest.ts (Next.js 15 style):**
```typescript
// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LotoVN',
    short_name: 'LotoVN',
    description: 'Trò chơi Lô Tô trực tuyến',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#0a0a0a',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
```

### Required Icon Sizes
- **192x192**: Home screen icon (Android, desktop)
- **512x512**: Splash screen, installation prompts
- **Format**: PNG (transparent background recommended)
- Both sizes required for proper PWA installation

### Key Manifest Fields
| Field | Value | Purpose |
|-------|-------|---------|
| `display` | `"standalone"` | Full-screen app, no browser UI |
| `theme_color` | `"#000000"` | Address bar, task switcher color |
| `background_color` | `"#0a0a0a"` | Splash screen background |
| `start_url` | `"/"` | Launch entry point |
| `orientation` | `"portrait-primary"` | Mobile orientation lock |

### iOS Safari Specific Requirements
**iOS doesn't support standard PWA installation but requires web app mode:**

Add to `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LotoVN',
    startupImage: [
      {
        url: '/apple-touch-startup-image.png',
        media: '(device-width: 393px) and (device-height: 852px)',
      },
    ],
  },
  icons: {
    apple: '/apple-touch-icon-180x180.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}
```

**iOS-specific meta tags:**
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
```

---

## Implementation Summary

**For LotoVN game features:**
1. **TTS for number announcements**: User-gesture triggered `speechSynthesis.speak()` with `vi-VN` lang, fallback to available voice
2. **Draw sound**: Single call to `playBeep(1000, 200)` after AudioContext resume
3. **PWA enablement**: Add manifest.ts + apple-touch-icon to layout metadata

**Zero dependencies**: All APIs are native browser APIs.

---

## Unresolved Questions
- Whether target user base has significant iOS Safari presence (affects PWA strategy priority)
- Specific tone/frequency preference for draw event sound
- Need for vibration API integration (Vibration API is separate, browser-dependent)
