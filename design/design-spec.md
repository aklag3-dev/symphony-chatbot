# Symphony Driver Assist — Design Specification

**Version:** 1.0
**Deployment:** Static GitHub Pages · Gemini 2.5 Flash (browser-stored API key)
**Primary viewport:** Mobile (drivers on the road)

---

## 1. Overview

Symphony Driver Assist is a single-page chatbot for drivers of Symphony Fleet, a London-based EV fleet operator. The interface prioritises fast, scannable answers during a shift: charging, breakdowns, deliveries, mileage, and routes. The app has no backend; the user's Gemini API key is stored in `localStorage`.

The design must feel **professional but warm** — drivers will see this daily, often in stressful or time-pressured situations. It must read as **trustworthy and compliant**, not consumer-chatty.

---

## 2. Brand & Identity

### 2.1 Wordmark & mark

- **Wordmark:** "Symphony Fleet" set in Fraunces 600, ink (#1A1F2E).
- **Tagline:** "Driver Assist" — Inter 500, 11px, all-caps, 0.06em tracking, muted color.
- **Mark:** 32×32 rounded square (radius 8) in primary teal (#0E5C5A) with a cream-coloured wave inside. Hints at orchestration and motion without being literal.
- **Mark fallback:** If SVG fails to render, the wordmark alone stands.

### 2.2 Colour palette

All tokens defined as CSS custom properties on `:root`.

| Token             | Value     | Role                                                    | Contrast (vs Surface)  |
| ----------------- | --------- | ------------------------------------------------------- | ---------------------- |
| `--ink`           | `#1A1F2E` | Body text, headings, focus ring                        | 15.3 : 1 — AAA         |
| `--ink-2`         | `#3D4250` | Secondary text, less critical labels                    | 10.2 : 1 — AAA         |
| `--muted`         | `#5A5E68` | Timestamps, helper text, placeholders                   | 5.4 : 1 — AA           |
| `--surface`       | `#FAF7F2` | App background, composer background                     | — (base)               |
| `--surface-2`     | `#F0EBE1` | Bot bubbles, input field fill, settings panel header    | 1.17 : 1 (intentional) |
| `--border`        | `#E5E0D6` | Hairlines, chip outlines, field borders                 | —                      |
| `--primary`       | `#0E5C5A` | User bubble, brand, primary buttons, focus indicator    | 5.6 : 1 vs white — AA  |
| `--primary-ink`   | `#FFFFFF` | Text on primary                                         | 5.6 : 1 — AA           |
| `--accent`        | `#E8A33D` | Sparingly: highlight chips, active state                | 2.0 : 1 (decorative)  |
| `--success`       | `#2E7D5C` | Confirmation states, "saved" badges                     | 5.0 : 1 — AA           |
| `--danger`        | `#B0432A` | Errors, destructive, emergency accent                   | 5.4 : 1 — AA           |
| `--focus`         | `#1A1F2E` | Keyboard focus ring (2px, 2px offset)                  | 15.3 : 1 — AAA         |

**Page background (outside app frame):** `#ECE7DA` — slightly darker than surface so the app card reads as a distinct object on desktop/tablet.

### 2.3 Typography

- **Body / UI:** `Inter` (400, 500, 600, 700). System fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Display / wordmark:** `Fraunces` (500, 600). System fallback: `Georgia, "Times New Roman", Times, serif`.
- **Load strategy:** `preconnect` to Google Fonts, `display=swap` so text never blocks.

### 2.4 Type scale & spacing

| Size | Use                                |
| ---- | ---------------------------------- |
| 11px | Timestamps, micro-labels           |
| 13px | Helper text, secondary labels      |
| 15px | Bubble body, input text (default)  |
| 18px | Wordmark                           |
| 20px | Settings sheet title               |
| 24px | (Reserved for future error page)   |

**Line height:** 1.45 for body/bubble text, 1.2 for headings, 1.0 for UI labels/buttons.

**Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 px. Use these tokens; avoid arbitrary values.

**Radii:** 6 / 10 / 18 / 24 px — see components for usage.

---

## 3. Layout

Mobile-first, single column, vertical scroll.

```
+----------------------------+
|  HEADER (64px, sticky top) |  ← brand left, gear right
+----------------------------+
|                            |
|  THREAD (flex 1, scrolls)  |  ← messages + chips
|                            |
|                            |
+----------------------------+
|  COMPOSER (64px, sticky)   |  ← input + send, safe-area aware
+----------------------------+
```

- **App frame:** max-width 480px, centred on tablet/desktop. Full-width on mobile (320–480px).
- **Safe areas:** composer uses `padding-bottom: calc(12px + env(safe-area-inset-bottom))` for notched devices.
- **Z-index stack:** composer 10, settings sheet 50, focus trap 100.

---

## 4. Components

### 4.1 Header (sticky)

| Slot    | Content                                                 |
| ------- | ------------------------------------------------------- |
| Left    | 32×32 SVG mark · wordmark "Symphony Fleet" · tagline    |
| Right   | 44×44 gear icon button (aria-label "Open settings")      |

- Background: `--surface`. Bottom hairline: `1px solid --border`.
- Padding: 12px 16px.
- The gear shows a 6×6 dot indicator in `--accent` when an API key is missing.
- On viewports <360px, tagline can drop; wordmark and mark always remain.

### 4.2 Message bubbles

Two variants: **bot** and **user**.

**Bot bubble**
- Background: `--surface-2`. Text: `--ink`.
- Max width: 85% of thread width.
- Border radius: 20px on top-left, top-right, bottom-right; **6px on bottom-left** (asymmetric "tail").
- Padding: 10px 14px.
- Avatar (32×32 circle, `--primary` fill, white "S" in Fraunces) sits to the left, aligned to the bubble bottom.
- Timestamp: 11px, 6px top margin, 0.7 opacity, in muted.

**User bubble**
- Background: `--primary`. Text: `--primary-ink`.
- Border radius: 20px except **6px on bottom-right** (mirrored asymmetry).
- No avatar.
- Timestamp: same as bot, white at 0.7 opacity.

**Shared rules**
- A message's timestamp is always present, but for user + bot pairs within 60s, only the bot shows the time.
- Message entrance: 200ms ease-out opacity + 4px translateY. `prefers-reduced-motion` → opacity only.
- Consecutive messages from the same author collapse avatar (still show top timestamp).

### 4.3 Quick-reply chips

- Pill-shaped. 1.5px border in `--primary`, transparent fill, `--primary` text.
- Min-height 40px, padding 0 14px. Active chips on touch devices render with 44px effective height via outer margin.
- Wrap freely; 8px gap.
- Tap state: 100ms scale 0.97 then return.
- Focus: 2px solid `--focus`, 2px offset.
- Always appear:
  - Below the welcome message (4–6 chips).
  - After the last bot reply, IF the system prompt context suggests follow-up questions the bot cannot fully answer (e.g. "Find a charger", "Call dispatch"). At most 4 chips per turn.
- Chips are never shown after user messages.

### 4.4 Composer

- Sticky to bottom of viewport. Background `--surface`, top hairline.
- Padding: 12px 12px `calc(12px + env(safe-area-inset-bottom))`.
- Layout: `input` (flex 1) + send button (44×44 circle, `--primary`).
- Input: pill, `--surface-2` fill, 1.5px `--border`, 16px horizontal padding, 44px height. Font 15px / 400. Placeholder: "Ask anything about your shift…".
- Send button: 44×44 circle, `--primary` background, white SVG arrow (line + arrowhead, 1.5px stroke). Disabled state at 50% opacity, `cursor: not-allowed`.
- The send button activates only when input has non-whitespace content.

### 4.5 Settings panel

- Bottom sheet on mobile (≤480px). Slides up from composer; covers bottom 70% of viewport.
- Top corners: 24px radius. Background `--surface`. Shadow: `--shadow-2`.
- Header: title "Settings" (Fraunces 600 20px) + close (44×44 X icon, top right).
- **Section: Gemini API key**
  - Label: "Gemini API key" (Inter 600 13px, ink).
  - Input: 44px height, `--surface-2` fill, 1.5px `--border`. Type `password` by default. Show/hide eye icon button (44×44) inside the input row.
  - Help text (13px, muted): "Get a key from [aistudio.google.com](https://aistudio.google.com) — sign in and create an API key in API Keys." Link in `--primary`, 1.5px underline.
  - Save button: 44px height, full width on mobile, `--primary` background, white text "Save".
  - "Stored locally" footnote in 11px muted.
- **Section: Manage key** (only if a key is stored)
  - "Clear stored key" — secondary button (44px, `--surface-2` fill, ink text, danger left border 3px on hover/press).
  - "Key fingerprint" display: first 4 chars + "…" + last 4 chars, monospace 13px, muted.
- **Footer:** "Symphony Driver Assist v1.0 · Built for Symphony Fleet" 11px muted, centred.
- Open/close: 280ms ease-out slide. Focus is trapped while open; ESC closes.

---

## 5. States

### 5.1 Empty / welcome
- Thread shows a single bot bubble, centred vertically with 80px top padding: "Hi, I'm Symphony Assist. I'm here to help with your shift. What do you need?"
- Below the bubble: 5 starter chips (see conversation-flow.md).
- Optional micro-illustration (van silhouette + "Driver Assist" wordmark) above the bubble on viewports >360px. **Off by default** — drivers need answers, not decoration.

### 5.2 Loading
- Three animated dots in a bot bubble (no avatar — preserve context).
- 1.2s loop, 0.15s stagger between dots. Dots scale 0.85→1, opacity 0.3→1.
- `prefers-reduced-motion` → static dots, no animation.
- The composer input remains enabled while loading; new messages queue or replace pending (Maker to decide; default: replace).

### 5.3 Error (network / API failure / safety block)
- Inline error block, max-width 85%, surface colour, 1px `--danger` border, 12px 14px padding, 12px radius.
- Structure: small uppercase label "Something went wrong" (11px, danger, 0.08em tracking) + body sentence + "Try again" button (text button, primary colour, underlined).
- Friendly copy. Never blame the user. No stack traces. No error codes.
- The user's last message is preserved; retry resends the same prompt.

### 5.4 Empty API key
- Gear icon shows a 6×6 `--accent` dot (aria-hidden; described in settings label).
- A subtle banner appears in the thread: "Add your Gemini API key in settings to start chatting." 14px, muted, centred. Includes a "Open settings" text button.
- The composer is disabled until a key is saved (input + send button at 50% opacity, send `disabled`).

### 5.5 Out-of-scope
- See conversation-flow.md. Bot offers dispatch number and surface relevant chips ("Call dispatch", "Different question").
- No error styling — this is a normal answer.

### 5.6 Emergency
- The first bot reply leads with 999 (see conversation-flow.md). No chips appear until the user confirms they are safe.

---

## 6. Accessibility

- **Contrast:** All text ≥ AA against its background. Most tokens exceed AAA.
- **Tap targets:** All interactive elements ≥ 44×44px.
- **Keyboard nav:** Tab order is settings → input → send → chips (chips in DOM order). Enter activates. Esc closes the settings sheet.
- **Focus:** Always visible, 2px solid `--focus`, 2px offset. Never `outline: none` without a replacement.
- **Live region:** Thread has `aria-live="polite"`, `aria-atomic="false"`. New bot messages are announced.
- **Semantic HTML:** `<header>`, `<main>`, `<form>`, `<button>`, `<label for>`. Icon-only buttons have `aria-label`.
- **Motion:** Respect `prefers-reduced-motion`. All motion has a static equivalent.
- **Form labels:** Every input has a visible label AND `aria-label` if icon-only.
- **Heading levels:** One `<h1>` (the wordmark is visually h1-equivalent via styling; settings sheet uses `<h2>`).
- **Language:** `<html lang="en-GB">`. UK English throughout ("lorry", "colour", "behaviour" not used in user-facing copy).

---

## 7. Responsive behaviour

| Viewport        | Behaviour                                                      |
| --------------- | -------------------------------------------------------------- |
| 320 – 480 px    | Full-bleed app, no side padding, composer uses safe-area.      |
| 481 – 768 px    | App centred, max-width 480px, page bg `#ECE7DA`.               |
| > 768 px        | App centred, max-width 480px, generous side padding.           |

The settings sheet remains a bottom sheet at all sizes — it is a phone-first product. On >768px, the sheet occupies max 480px wide and is centred horizontally.

---

## 8. Motion

- **Default easing:** `cubic-bezier(0.2, 0, 0, 1)` (ease-out).
- **Bubble entrance:** 200ms opacity 0→1 + translateY 4px→0.
- **Chip press:** 100ms scale 1→0.97→1.
- **Settings sheet:** 280ms translateY 100%→0.
- **Send button press:** 100ms scale 0.95.
- **`prefers-reduced-motion: reduce`** → all transitions become instant; loading dots become static.

---

## 9. Maker handoff notes

1. All design tokens are in §2 — implement as CSS custom properties in `:root`. Do not hardcode hex values in component CSS.
2. The `wireframe.html` file in this folder is a high-fidelity reference. Copy its `:root` block directly.
3. The composer must be `position: sticky; bottom: 0;` (not `fixed`) so it scrolls with the page on desktop and stays correctly placed on mobile.
4. The thread scrolls; auto-scroll to bottom on new message. Use `scrollIntoView({ block: "end", behavior: "smooth" })`, but disable smooth scroll under `prefers-reduced-motion`.
5. The settings sheet's focus trap: on open, store `document.activeElement`, focus the first input; on close, restore focus and remove listeners.
6. Use the system font stack as the immediate font for body text so first paint is never blank.
7. No emoji anywhere in the UI. Use SVG for icons (gear, send, eye, close).
