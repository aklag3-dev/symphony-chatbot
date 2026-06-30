window.SymphonyGemini = (function () {
  'use strict';

  const STORAGE_KEY = 'symphony.gemini.key';
  const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const FALLBACK = "I'm having trouble reaching the AI service right now. I can still help with charging, handovers, reimbursements, and emergencies — what do you need?";

  function getKey() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setKey(key) {
    try {
      if (key && key.trim()) {
        window.localStorage.setItem(STORAGE_KEY, key.trim());
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearKey() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function isConfigured() {
    return getKey().length > 0;
  }

  function fingerprint() {
    const key = getKey();
    if (!key) return '';
    if (key.length <= 8) return key.charAt(0) + '…' + key.charAt(key.length - 1);
    return key.substring(0, 4) + '…' + key.substring(key.length - 4);
  }

  function buildSystemPrompt(policyContext) {
    return [
      "You are Symphony Assist, a driver support assistant for Symphony Fleet, a London EV fleet operator. You help drivers with charging, breakdowns, deliveries, mileage, and routes.",
      "Tone: friendly, professional, concise. UK English. No emoji. No exclamation marks. 2-4 sentences per turn. Bold the most important token (a phone number, menu path, or action verb) using **double asterisks**.",
      "Phone numbers to use: 999 (emergencies), 0800-SYMPHONY (0800-7967426, dispatch), 0800-SYMPHONY-1 (roadside).",
      "Out-of-scope: if asked anything outside charging, handovers, reimbursements, damage, or emergencies, reply: \"I'm not sure about that one. Please call dispatch on **0800-SYMPHONY** (0800-7967426) and they'll help you out.\"",
      "Safety emergency: if the user describes a safety emergency (accident, fire, injury, danger, 999, trapped), reply exactly: \"If this is a safety emergency, call **999** immediately. Once you and others are safe, call Symphony on **0800-SYMPHONY** to log the incident and arrange a replacement vehicle.\"",
      "Hard constraints: never invent policy. never claim to have taken action. never use emoji. never begin with 'I'.",
      "",
      "Policy knowledge base:",
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
          parts: [{ text: turn.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    return {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 400
      }
    };
  }

  function markdownToHtml(text) {
    if (!text) return '';
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.split(/\n{2,}/).map(function (p) {
      p = p.replace(/\n/g, '<br>');
      return '<p>' + p + '</p>';
    }).join('');
    return html;
  }

  async function generateResponse(userInput, conversationHistory, policyContext) {
    const key = getKey();
    if (!key) return FALLBACK;

    const systemPrompt = buildSystemPrompt(policyContext);
    const payload = buildPayload(userInput, conversationHistory, systemPrompt);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        return FALLBACK;
      }

      const data = await response.json();
      const candidate = data && data.candidates && data.candidates[0];
      const parts = candidate && candidate.content && candidate.content.parts;
      const text = parts && parts.length && parts[0] && parts[0].text;

      if (!text) return FALLBACK;

      return markdownToHtml(text);
    } catch (e) {
      return FALLBACK;
    }
  }

  return {
    isConfigured: isConfigured,
    getKey: getKey,
    setKey: setKey,
    clearKey: clearKey,
    fingerprint: fingerprint,
    generateResponse: generateResponse
  };
})();
