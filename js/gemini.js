window.SymphonyGemini = (function () {
  'use strict';

  // PROXY_URL: the deployed Cloudflare Worker that holds the secret Gemini key.
  // Set this to the URL printed by `wrangler deploy` (e.g.
  // "https://symphony-chatbot-proxy.<account>.workers.dev").
  // Leave empty to disable the LLM fallback (rule-based only).
  const PROXY_URL = 'https://symphony-chatbot-proxy.symphony-driver-assist.workers.dev';

  const FALLBACK_HTML = "<p>I'm having trouble reaching the AI service right now. I can still help with charging, handovers, reimbursements, and emergencies — what do you need?</p>";

  function isConfigured() {
    return PROXY_URL.length > 0;
  }

  function statusLabel() {
    if (!PROXY_URL) return 'AI fallback: off (rule-based only)';
    try {
      const u = new URL(PROXY_URL);
      return 'AI fallback: on (' + u.host + ')';
    } catch (e) {
      return 'AI fallback: misconfigured';
    }
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

  async function generateResponse(userInput, conversationHistory, policyContext) {
    if (!isConfigured()) return FALLBACK_HTML;

    try {
      const response = await fetch(PROXY_URL.replace(/\/$/, '') + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: String(userInput || ''),
          history: Array.isArray(conversationHistory) ? conversationHistory : [],
          policyContext: String(policyContext || '')
        })
      });

      if (!response.ok) {
        return FALLBACK_HTML;
      }

      const data = await response.json();
      if (data && data.reply) return String(data.reply);
      if (data && data.ok === false) return FALLBACK_HTML;
      return FALLBACK_HTML;
    } catch (e) {
      return FALLBACK_HTML;
    }
  }

  return {
    isConfigured: isConfigured,
    statusLabel: statusLabel,
    generateResponse: generateResponse
  };
})();
