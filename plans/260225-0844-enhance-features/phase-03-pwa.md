# Phase 03: PWA Enhancement

**Parent**: [plan.md](./plan.md) | **Research**: [sound-pwa](./research/researcher-260225-sound-pwa.md)
**Date**: 260225 | **Priority**: LOW-MEDIUM | **Status**: pending | **Review**: pending
**Dependencies**: None (Group A, parallel-safe)

---

## Overview

Upgrade PWA support: replace static `public/manifest.json` with Next.js 15 programmatic `manifest.ts`, add Apple Web App metadata to `layout.tsx`, add proper icon references. Existing `manifest.json` in `public/` already has basic fields; programmatic approach gives type safety and single source of truth.

## Key Insights

- `layout.tsx:91` already references `manifest: "/manifest.json"` -- switch to auto-generated `/manifest.webmanifest`
- Existing `public/manifest.json` has SVG favicon only; PWA requires 192x192 + 512x512 PNG icons
- `layout.tsx:10-15` already sets `themeColor: "#7f1d1d"` via viewport export
- Next.js 15 `MetadataRoute.Manifest` type provides compile-time validation
- iOS requires separate `appleWebApp` metadata in layout (not from manifest)

## Requirements

**Functional:**
- Programmatic `manifest.ts` with proper PWA fields
- Apple Web App metadata for iOS "Add to Home Screen"
- Reference 192x192 + 512x512 PNG icons (files created separately)
- Keep SVG favicon as fallback icon

**Non-functional:**
- Type-safe manifest via `MetadataRoute.Manifest`
- No breaking changes to existing metadata
- Under 50 lines for manifest.ts

## Architecture

```
src/app/manifest.ts (NEW)
  -> Next.js auto-serves as /manifest.webmanifest
  -> Replaces public/manifest.json reference

src/app/layout.tsx (MODIFY)
  -> Remove manifest: "/manifest.json" from metadata
  -> Add appleWebApp config
  -> Add apple-touch-icon to icons

public/manifest.json (KEEP but unused)
  -> Kept as reference; Next.js manifest.ts takes precedence
```

### Manifest Shape

```typescript
// src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LotoVN - Lo To Viet Nam Online",
    short_name: "LotoVN",
    description: "Tro choi Lo To da nguoi choi phong cach le hoi Viet Nam",
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
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
```

## Related Code Files

| File | Role | Lines |
|------|------|-------|
| `src/app/manifest.ts` | NEW -- programmatic manifest | ~25 |
| `src/app/layout.tsx` | MODIFY -- apple metadata | 113 total |
| `public/manifest.json` | READ -- reference for values | 23 |

## Implementation Steps

### 1. Create `src/app/manifest.ts`

Full file as shown in Architecture section above. Key fields:
- `theme_color` and `background_color` match existing values from `public/manifest.json`
- Icons array: SVG (any size) + placeholder PNG refs (192 + 512)
- `orientation: "portrait"` for mobile game

### 2. Modify `src/app/layout.tsx`

**Change A -- Remove manifest reference (line 91):**
```diff
- manifest: "/manifest.json",
```
Next.js auto-links the programmatic manifest when `src/app/manifest.ts` exists.

**Change B -- Add appleWebApp to metadata (after line 94, before closing `};`):**
```typescript
appleWebApp: {
  capable: true,
  statusBarStyle: "black-translucent",
  title: "LotoVN",
},
```

**Change C -- Update icons (line 81-88):**
```typescript
icons: {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
  ],
  apple: [
    { url: "/icon-192x192.png", sizes: "192x192" },
  ],
},
```

### 3. Note on PNG Icons

192x192 and 512x512 PNG icons must be created manually and placed in `public/`. Until created, PWA install prompt may not appear on all browsers. SVG favicon works as fallback.

## Todo Checklist

- [ ] Create `src/app/manifest.ts` with `MetadataRoute.Manifest`
- [ ] Set name, short_name, display, theme_color, background_color, icons
- [ ] Remove `manifest: "/manifest.json"` from layout.tsx metadata
- [ ] Add `appleWebApp` config to layout.tsx metadata
- [ ] Update apple icon reference to use PNG (192x192)
- [ ] Verify manifest.ts under 30 lines
- [ ] Verify `/manifest.webmanifest` served correctly in dev
- [ ] Note: PNG icon files are a separate design task

## Success Criteria

- `GET /manifest.webmanifest` returns valid JSON with all required PWA fields
- Apple Web App metadata present in rendered HTML `<head>`
- No duplicate manifest references in HTML
- Existing viewport/theme-color meta unchanged
- Build succeeds without manifest type errors

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Missing PNG icons blocks PWA install | Medium | SVG fallback; icons are separate task |
| Duplicate manifest link in HTML | Low | Remove explicit `manifest:` from metadata |
| iOS Safari ignores standard manifest | Known | Added `appleWebApp` metadata separately |

## Security Considerations

- Manifest is public metadata; no sensitive data
- `start_url: "/"` prevents deep-link hijacking

## Next Steps

- Create PNG icons (192x192 + 512x512) -- design task
- Consider adding `apple-touch-startup-image` for splash screen
- Service worker for offline support in future iteration
