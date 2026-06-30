# Symphony Driver Assist

A single-page chatbot for Symphony Fleet drivers, built as a static GitHub Pages site. Answers the most common shift questions about handovers, charging, damage, tolls, and emergencies.

The bot works **offline-of-LLM** using a built-in rule-based matcher against the official Symphony policy. When a question is outside the policy, the bot can optionally consult Gemini 2.5 Flash — but the API key is held **server-side** in a Cloudflare Worker secret, never in the browser. Drivers never see or enter an API key.

## What it does

Symphony Assist is the in-pocket policy assistant for Symphony's 1,200-vehicle London EV fleet. Drivers can:

- Check the minimum battery at handover and the £35 low-battery fee rules
- See which charging networks are approved (bp pulse, Shell, GRIDSERVE, Ionity, Osprey, InstaVolt, GeniePoint, Pod Point) and the Ionity app vs. card rules
- Learn how to report damage or dispute a charge
- Confirm the £5.50 Heathrow T5 drop-off fee and how to claim it back
- Get the 24/7 emergency procedure for low battery or being stranded

The bot always answers from the policy knowledge base. If the question isn't in the policy, the bot either falls through to the Symphony-managed Gemini fallback or points to dispatch.

## How to run locally

No build step. Either open the file directly or serve it.

```sh
cd symphony-chatbot
python3 -m http.server 8000
# then open http://localhost:8000
```

The site is fully static. The rule-based matcher works without any backend. The optional AI fallback requires the Cloudflare Worker (see below) to be deployed and the worker's URL pasted into `js/gemini.js` as `PROXY_URL`.

## How to deploy

### 1. Static site → GitHub Pages

Push `symphony-chatbot/` to a GitHub repo, enable Pages on the `main` branch at `/ (root)`. The site will be at `https://<user>.github.io/<repo>/`.

### 2. AI proxy → Cloudflare Worker (optional)

The Gemini API key is held server-side. Deploy the worker in `worker/`:

```sh
cd worker
npm install
npx wrangler login                              # one-time
npx wrangler secret put GEMINI_API_KEY          # paste your Gemini key
npx wrangler deploy
```

The deploy output prints a URL like
`https://symphony-chatbot-proxy.<account-subdomain>.workers.dev`.

Open `js/gemini.js` and set:

```js
const PROXY_URL = 'https://symphony-chatbot-proxy.<account>.workers.dev';
```

Commit and push. Done. Drivers never see the key.

## Architecture

**Hybrid: rule-based primary, server-proxied Gemini fallback.**

```
[ Driver's browser / GitHub Pages ]        [ Cloudflare Worker ]           [ Gemini ]
        |                                          |                          |
        | matchIntent (rule-based, in-browser)     |                          |
        |                                           |                          |
        | if confidence < 0.4:                     |                          |
        |   POST { message, policyContext }  ------>|  read GEMINI_API_KEY     |
        |                                           |  build system prompt     |
        |                                           |  POST generateContent -->|
        |   { reply: "<p>...</p>" }          <------|  { candidates }     <----|
```

- `js/policy.js` — authoritative policy knowledge base, structured as plain JS data. 5 categories, each with keywords, regex triggers, a templated response, and follow-up chips. Plus safety-emergency patterns, the 999 response, the out-of-scope fallback, and a rotating set of welcome messages.
- `js/matcher.js` — pure-function intent matcher. Normalises input, runs a safety check first, then scores each category by keyword hit + trigger match + Levenshtein fuzzy distance. Returns confidence 0–1. Above 0.4 is considered a confident match.
- `js/gemini.js` — when `PROXY_URL` is set, calls the Cloudflare Worker instead of calling Gemini directly. The browser never sees or stores an API key. Sends the policy context with each request so the worker has current policy.
- `js/app.js` — DOM wiring. Renders the welcome and starter chips, handles user input, decides between matcher and Gemini fallback, manages the About panel.
- `worker/src/index.js` — Cloudflare Worker. Receives `{ message, history, policyContext }`, builds the system prompt, calls Gemini with the secret key, returns `{ reply }` as HTML. CORS-enabled. Verifies the key is set before doing anything.
- `worker/wrangler.toml` — worker config.
- `worker/package.json` — wrangler dev dep.

**Why this is better than key-in-browser:**

- The key never appears in client source, browser DevTools, or network calls to Google.
- Workers.dev is rate-limited and CORS-allowlisted, so abuse is harder.
- One key serves all drivers; rotating or revoking is a one-line `wrangler secret put` change.
- The site still works fully without the worker (rule-based only) — graceful degradation.

**Emergency patterns are checked first and always win.** They return the 999 response, show no chips, and never call Gemini.

## File structure

```
symphony-chatbot/
├── index.html              # The whole app
├── css/
│   └── styles.css          # Design tokens, components, motion
├── js/
│   ├── policy.js           # Knowledge base (5 categories, emergencies, fallback)
│   ├── matcher.js          # Intent matching (keywords + Levenshtein + regex)
│   ├── gemini.js           # Worker-proxy integration (set PROXY_URL here)
│   └── app.js              # DOM wiring, event handlers, About panel
├── worker/                 # Cloudflare Worker that holds the Gemini key
│   ├── src/index.js        # Worker entry point
│   ├── wrangler.toml       # Worker config
│   ├── package.json        # wrangler dev dep
│   └── README.md           # Worker-specific deploy instructions
├── policy-knowledge-base.md # The source-of-truth policy document
├── design/                 # Design source files (spec, conversation, wireframe)
└── README.md               # This file
```

## Cost

- **GitHub Pages:** free.
- **Cloudflare Workers:** 100,000 requests/day free, no credit card.
- **Gemini 2.5 Flash:** 15 requests/minute, 1,000 requests/day free (per project).

Comfortable for a class demo and small production usage.

## Credits

- Policy content adapted from Symphony Fleet Driver Policy Manual, Edition 7.2 (effective 30 June 2026).
- Design system from `design/design-spec.md` and `design/wireframe.html`.
- Built as a class project for a London EV fleet operator.
