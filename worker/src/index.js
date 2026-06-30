// Symphony Chatbot — Gemini proxy
// Receives a chat request from the static site, calls Gemini with the
// server-side API key (stored as a Cloudflare secret), returns the reply.
//
// The browser never sees the key. Only this worker does.

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const FALLBACK_HTML = "<p>I'm having trouble reaching the AI service right now. I can still help with charging, handovers, reimbursements, and emergencies — what do you need?</p>";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      CORS_HEADERS
    ),
  });
}

function buildSystemPrompt(policyContext) {
  return [
    "You are Symphony Assist, a driver support assistant for Symphony Fleet, a London EV fleet operator. You help drivers with charging, handovers, reimbursements, damage reporting, and emergencies.",
    "Tone: friendly, professional, concise. UK English. No emoji. No exclamation marks. 2-4 sentences per turn. Bold the most important token (a phone number, menu path, or action verb) using **double asterisks**.",
    "Phone numbers to use: 999 (safety emergencies), 0800-SYMPHONY or 0800-7967426 or +44 20 4538 7700 (24/7 dispatch), +44 20 4538 7799 (RAC Fleet Assist breakdown), 0800 028 9393 (Allstar charge card helpline).",
    "Out-of-scope: if asked anything outside charging, handovers, reimbursements, damage, or emergencies, reply: \"I'm not sure about that one. Please call dispatch on **0800-SYMPHONY** (0800-7967426) and they'll help you out.\"",
    "Safety emergency: if the user describes a safety emergency (accident, fire, injury, danger, 999, trapped), reply exactly: \"If this is a safety emergency, call **999** immediately. Once you and others are safe, call Symphony on **0800-SYMPHONY** to log the incident and arrange a replacement vehicle.\"",
    "Hard constraints: never invent policy. never claim to have taken action. never use emoji. never begin with 'I'.",
    "",
    "Policy knowledge base (use this as the source of truth for driver questions):",
    policyContext || ''
  ].join('\n\n');
}

function buildPayload(userInput, history, systemPrompt) {
  const contents = [];
  if (Array.isArray(history)) {
    for (let i = 0; i < history.length; i++) {
      const turn = history[i];
      if (!turn || !turn.role || !turn.text) continue;
      contents.push({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(turn.text) }]
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: String(userInput) }]
  });

  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 400
    }
  };
}

function markdownToHtml(text) {
  if (!text) return '';
  let html = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.split(/\n{2,}/).map(function (p) {
    p = p.replace(/\n/g, '<br>');
    return '<p>' + p + '</p>';
  }).join('');
  return html;
}

async function callGemini(apiKey, payload) {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error('Gemini HTTP ' + response.status + ': ' + errText.substring(0, 200));
  }

  const data = await response.json();
  const candidate = data && data.candidates && data.candidates[0];
  const parts = candidate && candidate.content && candidate.content.parts;
  const text = parts && parts.length && parts[0] && parts[0].text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      const hasKey = !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 0);
      return jsonResponse({
        ok: true,
        service: 'symphony-chatbot-proxy',
        gemini_configured: hasKey,
        model: 'gemini-2.5-flash'
      });
    }

    // Only POST /api/chat
    if (url.pathname !== '/api/chat') {
      return jsonResponse({ error: 'not_found' }, 404);
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405);
    }

    // Auth check
    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: 'server_misconfigured', detail: 'GEMINI_API_KEY not set' }, 500);
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'invalid_json' }, 400);
    }

    const message = (body && body.message || '').toString().trim();
    const history = body && body.history;
    const policyContext = body && body.policyContext;

    if (!message) {
      return jsonResponse({ error: 'missing_message' }, 400);
    }
    if (message.length > 2000) {
      return jsonResponse({ error: 'message_too_long', limit: 2000 }, 400);
    }
    if (policyContext && policyContext.length > 50000) {
      return jsonResponse({ error: 'policy_too_long', limit: 50000 }, 400);
    }

    // Call Gemini
    try {
      const systemPrompt = buildSystemPrompt(policyContext);
      const payload = buildPayload(message, history, systemPrompt);
      const text = await callGemini(env.GEMINI_API_KEY, payload);
      const html = markdownToHtml(text);
      return jsonResponse({ reply: html, ok: true });
    } catch (e) {
      return jsonResponse({
        reply: FALLBACK_HTML,
        ok: false,
        error: 'gemini_error',
        detail: String(e && e.message || e).substring(0, 300)
      }, 200); // 200 because we still have a usable fallback reply
    }
  }
};
