# LotoVN Design Guidelines

> Vietnamese Tet Lô Tô — festive, bold, glass-morphic dark UI on deep crimson.
> Last updated: 2026-02-25

---

## 1. Brand Identity

| Attribute | Value |
|---|---|
| Theme | Vietnamese Tết folk festival · warm lantern glow |
| Tone | Celebratory, bold, slightly retro-premium |
| Language | Vietnamese primary, Unicode diacritics required |

---

## 2. Color Tokens

Defined in `globals.css @theme` and used via Tailwind utilities.

| Token | Hex | Usage |
|---|---|---|
| `red-950` | `#450a0a` | Page background, loto cell deep shadow |
| `red-900` | `#7f1d1d` | Card backgrounds, header panel |
| `red-800` | `#991b1b` | Ticket header accent, avatar gradient end |
| `yellow-500` / `gold-500` | `#f59e0b` | Primary CTA, active states, headings |
| `yellow-400` / `gold-400` | `#fbdf3b` | Gradient start on btn-primary |
| `yellow-600` / `gold-600` | `#d97706` | Gradient end, btn-primary shadow |
| `white/5 – white/20` | rgba(255,255,255,…) | Glass-card borders, subtle surfaces |

### Semantic usage
- **Gold** = interactive, active, host-level, winning states
- **Deep red** = backgrounds, containers, structure
- **White/cream** = text, passive UI elements (opacity modulated)
- **Green-500** = online presence, win-confirmed, keep-ticket
- **Red-600** = drawn number highlight, matched-symbol ring, error

---

## 3. Typography

**Font family:** `Inter` (Google Fonts, subsets: `latin` + `vietnamese`)
**Fallback:** System sans-serif

| Scale | Usage | Class examples |
|---|---|---|
| Hero (5xl–9xl) | Landing page title | `text-9xl font-black tracking-tight` |
| Display (3xl–5xl) | Modal titles, KINH declaration | `text-5xl font-black italic tracking-tighter` |
| Section (xl–2xl) | Room ID in header | `text-2xl font-black tracking-tighter` |
| Label (9px–10px) | Uppercase section labels | `text-[10px] font-black uppercase tracking-widest` |
| Body (xs–sm) | Chat messages, status text | `text-xs` – `text-sm` |

**Numeric display:** Always use `tabular-nums` (not the invalid `font-variant-numeric-tabular-nums`).
**Impact font:** `font-impact` class for loto ticket numbers (fallback: Arial Narrow Bold).

---

## 4. Component Classes

### `.glass-card`
```css
bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl
```
- Use as the base container for all panels
- Border overrides allowed: `border-yellow-500/50` (host/admin), `border-yellow-500/30` (number draw), `border-white/5` (minimal)

### `.glass-panel`
```css
bg-black/40 backdrop-blur-2xl rounded-b-2xl
```
- Used exclusively for the sticky header
- Apply `border-b border-white/5` inline for the bottom divider

### `.btn-primary`
```
bg-gradient yellow-400→yellow-600, text-red-950, font-black
shadow-[0_4px_0_#92400e] → hover shifts down 2px → active shifts 4px
```

### `.btn-secondary`
```
bg-white/10, border-2 border-yellow-500/50, text-yellow-500
```

### `.btn-tactile`
```
active:scale-95 active:brightness-110 — micro-press feedback
```

---

## 5. Loto Ticket Cells

| State | Background | Text color | Border/Effect |
|---|---|---|---|
| Empty | `#e8e0d0` + 45° hatching, opacity 0.7 | transparent | none |
| Filled (idle) | `#ffffff` | `#000` | black grid line |
| Active (just drawn) | `#dc2626` (red-600) | `#fff` | glow 30px red, scale 1.05 |
| Matched (marked) | `#f59e0b` (yellow-500) | `#450a0a` | red-700 circle overlay |
| Ping indicator | tiny `w-2 h-2 bg-red-600 animate-ping` absolute on span corner | — | drawn-but-unmarked hint |

Cell font-size: `clamp(1rem, 4vw, 1.8rem)` — fluid, never truncates.

---

## 6. Spacing & Layout

### Breakpoints (Tailwind defaults)
- `sm`: 640px · `md`: 768px · `lg`: 1024px · `xl`: 1280px

### Game room grid
- **Mobile** (< lg): Single column, tab-navigated
- **Desktop** (≥ lg): `grid-cols-12` — left 3 cols | center 6 cols | right 3 cols

### Mobile tab nav
- Sticky at `top-[65px]` (matches actual header height)
- `bg-black/40 rounded-xl border border-white/10`
- Active tab: `bg-yellow-500 text-red-950`

### Touch targets
- All interactive elements: minimum `44×44px`
- Implemented via `min-h-[44px] min-w-[44px]` or `p-2` padding expansion
- Icon-only buttons: always include `aria-label`

---

## 7. Scrollbars

All scrollbars inherit the global Vietnamese gold theme:
- Thumb: gradient `yellow-300 → yellow-500 → yellow-600`
- Track: `white/5`

To hide scrollbar while keeping scroll: use `.scrollbar-hide` (defined in globals.css).
Do NOT use `.scrollbar-none` (not a defined utility).

---

## 8. Animations & Motion

| Name | Definition | Usage |
|---|---|---|
| `animate-float` | translateY 0→-20px→0, 6s infinite | Decorative background elements |
| `circle-pop` | scale 0.5→1 + opacity, 0.3s spring | Matched-cell marker |
| Framer Motion spring | stiffness 200, damping 15 | Number ball in/out |
| `animate-pulse` | Tailwind default | Status dot, active draw glow |
| `animate-ping` | Tailwind default | Ping hint on unmarked drawn cells |

All animations respect `prefers-reduced-motion` via global CSS rule:
```css
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; ... } }
```

---

## 9. Accessibility Checklist

- Every icon-only button must have `aria-label`
- Toggle buttons must have `aria-pressed={boolean}`
- Tab list uses `role="tablist"`, tabs use `role="tab"` + `aria-selected`
- Live number display uses `aria-live="polite" aria-atomic="true"`
- Color contrast: gold `#f59e0b` on red-950 `#450a0a` ≈ 5.2:1 (passes AA)
- Min touch targets: 44×44px enforced on all interactive controls

---

## 10. Known Anti-Patterns to Avoid

| Anti-pattern | Correct pattern |
|---|---|
| `font-variant-numeric-tabular-nums` (not a Tailwind class) | `tabular-nums` |
| `scrollbar-none` (undefined utility) | `scrollbar-hide` |
| `rounded-t-3xl` on top-flush sticky header | `rounded-b-2xl` |
| `top-[72px]` hardcoded offset that drifts | Match actual header height `top-[65px]` |
| Empty loto cells visually identical to filled cells | Hatched `#e8e0d0` background at 0.7 opacity |
| Icon buttons without `aria-label` | Always add `aria-label` |
| Toggle buttons without `aria-pressed` | Add `aria-pressed={boolean}` |
