# Symphony Chatbot Proxy (Cloudflare Worker)

A thin serverless proxy that holds the Gemini API key as an encrypted secret
and forwards chat requests from the static site to Gemini 2.5 Flash.

The browser **never** sees the API key. All the bot logic, policy knowledge
base, and intent matching happens in the static site (`/index.html` and
`/js/*`). This worker only handles the optional LLM fallback.

## Endpoints

- `GET /` or `GET /health` — returns `{ ok, gemini_configured, model }`
- `POST /api/chat` — `{ message, history?, policyContext? }` → `{ reply, ok }`
- `OPTIONS *` — CORS preflight (returns 204)

## Deploy

```bash
cd worker
npm install
npx wrangler login                              # one-time
npx wrangler secret put GEMINI_API_KEY          # paste your Gemini key
npx wrangler deploy
```

The deploy output will print a URL like
`https://symphony-chatbot-proxy.<account-subdomain>.workers.dev`.

Set that URL as the value of `PROXY_URL` in `js/gemini.js` (or read it from
`window.SYMPHONY_CONFIG.proxyUrl` if you wire it that way).

## Architecture

```
[ Browser / GitHub Pages ]                [ Cloudflare Edge ]                [ Gemini ]
        |                                          |                               |
        | matchIntent (rule-based) -> response     |                               |
        | if confidence < 0.4:                     |                               |
        |   POST /api/chat { message, policy }  -->|  read GEMINI_API_KEY secret   |
        |                                          |  build system prompt          |
        |                                          |  POST generateContent  ----->|
        |                                          |                               |
        |   { reply: "<p>...</p>" }            <---|  { candidates: [...] }  <----|
        |                                          |                               |
```

## Cost

Cloudflare Workers free tier: **100,000 requests/day**, no credit card.
Gemini 2.5 Flash free tier: 15 requests/minute per project. Comfortable
for a class demo and small production usage.
