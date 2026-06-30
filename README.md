# Symphony Driver Assist

A single-page chatbot for Symphony Fleet drivers, built as a static GitHub Pages site. Answers the most common shift questions about handovers, charging, damage, tolls, and emergencies. Works offline-of-LLM using a built-in rule-based matcher; can be upgraded with an optional Gemini 2.5 Flash API key for free-form fallback.

## What it does

Symphony Assist is the in-pocket policy assistant for Symphony's 1,200-vehicle London EV fleet. Drivers can:

- Check the minimum battery at handover and the £35 low-battery fee rules
- See which charging networks are approved (bp pulse, Shell, GRIDSERVE, Ionity, Osprey, InstaVolt, GeniePoint, Pod Point) and the Ionity app vs. card rules
- Learn how to report damage or dispute a charge
- Confirm the £5.50 Heathrow T5 drop-off fee and how to claim it back
- Get the 24/7 emergency procedure for low battery or being stranded

The bot always answers from the policy knowledge base. If the question isn't in the policy, the bot either falls through to the user's own Gemini API key (optional) or points to dispatch.

## How to run locally

No build step. Either open the file directly or serve it.

Option 1 — open in browser:

```sh
xdg-open index.html        # Linux
open index.html            # macOS
start index.html           # Windows
```

Option 2 — local web server (recommended; matches how GitHub Pages serves):

```sh
cd symphony-chatbot
python3 -m http.server 8000
# then open http://localhost:8000
```

The first option works because the page is fully static, but `fetch` behaviour in some browsers is more permissive when served over `http://localhost`. The optional Gemini call uses `fetch`, which works from `file://` in modern browsers but will fail on cross-origin if your browser blocks it.

## How to deploy to GitHub Pages

1. Push the `symphony-chatbot/` directory to a GitHub repository (or put it at the repo root).
2. In the repository settings → **Pages**, choose the branch and the `/ (root)` folder.
3. Wait ~60 seconds. GitHub will publish at `https://<user>.github.io/<repo>/`.

That's it. No build, no bundler, no server.

## How to add the optional Gemini key

The chatbot works without any API key — the rule-based matcher handles the 5 most common question categories. To unlock free-form fallback for off-policy questions:

1. Open the app and tap the **gear icon** in the top right.
2. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and create a free API key.
3. Paste the key into the **Gemini API key** field and tap **Save key**.

The key is stored only in your browser's `localStorage` under `symphony.gemini.key`. It is never sent anywhere except the Google Generative Language API. You can reveal or clear it from the same settings panel.

The gear icon shows a small amber dot when no key is set. The dot disappears once a key is saved.

## Architecture

**Hybrid: rule-based primary, optional Gemini fallback.**

- `js/policy.js` — the authoritative policy knowledge base, structured as plain JavaScript data. Each of the 5 categories has keywords, regex triggers, a templated response, and follow-up chips. Also includes safety-emergency patterns, the 999 response, the out-of-scope fallback, and a rotating set of welcome messages.
- `js/matcher.js` — pure-function intent matcher. Normalises input, runs a safety check first, then scores each category by keyword hit + trigger match + Levenshtein fuzzy distance. Returns a confidence score from 0 to 1. Above `0.4` is considered a confident match.
- `js/gemini.js` — optional Gemini 2.5 Flash integration. Reads the key from `localStorage`, builds a system prompt from the policy doc, posts to the public `generativelanguage.googleapis.com` endpoint over `fetch`. On any error (network, 429 quota, 400 bad key), returns a graceful fallback string. The key is sent in the `x-goog-api-key` header, not a query string.
- `js/app.js` — the DOM wiring. Renders the welcome and starter chips, handles user input, decides between matcher and Gemini, manages the settings panel and key persistence.

The matcher is intentionally the source of truth. Gemini is only consulted when the matcher returns a confidence below 0.4 AND a key is configured. Emergency patterns are checked first and always win — they return the 999 response with no chips and never call Gemini.

## File structure

```
symphony-chatbot/
├── index.html              # The whole app
├── css/
│   └── styles.css          # Design tokens, components, motion
├── js/
│   ├── policy.js           # Knowledge base (5 categories, emergencies, fallback)
│   ├── matcher.js          # Intent matching (keywords + Levenshtein + regex)
│   ├── gemini.js           # Optional Gemini API integration
│   └── app.js              # DOM wiring, event handlers, settings panel
├── policy-knowledge-base.md # The source-of-truth policy document
├── design/
│   ├── design-spec.md      # Design specification
│   ├── conversation-flow.md # Voice, tone, system-prompt shape
│   └── wireframe.html      # Visual reference (CSS tokens lifted from here)
└── README.md               # This file
```

## Credits

- Policy content adapted from Symphony Fleet Driver Policy Manual, Edition 7.2 (effective 30 June 2026).
- Design system from `design/design-spec.md` and `design/wireframe.html`.
- Built as a class project for a London EV fleet operator.
