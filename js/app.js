window.SymphonyApp = (function () {
  'use strict';

  const els = {};
  const state = {
    history: [],
    sending: false,
    settingsOpen: false,
    lastFocused: null
  };

  function $(id) { return document.getElementById(id); }

  function init() {
    cacheDom();
    bindHeader();
    bindComposer();
    bindSettings();
    renderWelcome();
  }

  function cacheDom() {
    els.thread = $('thread');
    els.composerInput = $('composer-input');
    els.composerForm = $('composer-form');
    els.sendBtn = $('send-btn');
    els.gearBtn = $('gear-btn');
    els.settingsOverlay = $('settings-overlay');
    els.settingsPanel = $('settings-panel');
    els.closeSettingsBtn = $('close-settings-btn');
    els.statusLine = $('status-line');
  }

  function bindHeader() {
    els.gearBtn.addEventListener('click', openSettings);
  }

  function bindComposer() {
    els.composerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSend();
    });
    els.composerInput.addEventListener('input', function () {
      const has = els.composerInput.value.trim().length > 0;
      els.sendBtn.disabled = !has;
      els.sendBtn.style.opacity = has ? '1' : '0.5';
    });
    els.composerInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  }

  function bindSettings() {
    els.closeSettingsBtn.addEventListener('click', closeSettings);
    els.settingsOverlay.addEventListener('click', function (e) {
      if (e.target === els.settingsOverlay) closeSettings();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.settingsOpen) closeSettings();
    });
  }

  function openSettings() {
    state.settingsOpen = true;
    state.lastFocused = document.activeElement;
    const app = document.querySelector('.app');
    if (app) app.setAttribute('inert', '');
    if (els.statusLine) {
      els.statusLine.textContent = window.SymphonyGemini.statusLabel();
    }
    els.settingsOverlay.classList.add('open');
    els.settingsOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      els.closeSettingsBtn.focus();
    });
  }

  function closeSettings() {
    state.settingsOpen = false;
    els.settingsOverlay.classList.remove('open');
    els.settingsOverlay.setAttribute('aria-hidden', 'true');
    const app = document.querySelector('.app');
    if (app) app.removeAttribute('inert');
    if (state.lastFocused && state.lastFocused.focus) state.lastFocused.focus();
  }

  function pickGreeting() {
    const greetings = window.SymphonyPolicy.greetings;
    if (!greetings || !greetings.length) return 'Hi, I am Symphony Assist.';
    const index = Math.floor(Math.random() * greetings.length);
    return greetings[index];
  }

  function nowTime() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function renderWelcome() {
    clearThread();
    const greeting = pickGreeting();
    appendBotMessage('<p>' + escapeText(greeting) + '</p>', false);
    appendChipRow(window.SymphonyPolicy.starterChips, 'Suggested questions');
  }

  function clearThread() {
    els.thread.innerHTML = '';
  }

  function appendBotMessage(html, withTimestamp) {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'S';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = html;
    if (withTimestamp !== false) {
      const t = document.createElement('time');
      t.className = 'time';
      t.setAttribute('datetime', nowTime());
      t.textContent = nowTime();
      bubble.appendChild(t);
    }
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    els.thread.appendChild(wrap);
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg user';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const p = document.createElement('p');
    p.textContent = text;
    bubble.appendChild(p);
    const t = document.createElement('time');
    t.className = 'time';
    t.setAttribute('datetime', nowTime());
    t.textContent = nowTime();
    bubble.appendChild(t);
    wrap.appendChild(bubble);
    els.thread.appendChild(wrap);
    scrollToBottom();
  }

  function appendLoadingBubble() {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'S';
    const bubble = document.createElement('div');
    bubble.className = 'bubble loading';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-label', 'Symphony Assist is typing');
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'dot';
      bubble.appendChild(d);
    }
    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    els.thread.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function appendChipRow(labels, ariaLabel) {
    if (!labels || !labels.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'chips';
    wrap.setAttribute('role', 'group');
    if (ariaLabel) wrap.setAttribute('aria-label', ariaLabel);
    for (let i = 0; i < labels.length; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = labels[i];
      btn.addEventListener('click', function () { handleChip(labels[i]); });
      wrap.appendChild(btn);
    }
    els.thread.appendChild(wrap);
    scrollToBottom();
  }

  function appendAiFootnote() {
    const wrap = document.createElement('div');
    wrap.className = 'ai-foot';
    wrap.textContent = 'via AI';
    els.thread.appendChild(wrap);
    scrollToBottom();
  }

  function scrollToBottom() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.thread.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
  }

  function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function handleChip(label) {
    if (state.sending) return;
    els.composerInput.value = label;
    els.sendBtn.disabled = false;
    els.sendBtn.style.opacity = '1';
    handleSend();
  }

  async function handleSend() {
    if (state.sending) return;
    const text = els.composerInput.value.trim();
    if (!text) return;

    state.sending = true;
    els.composerInput.value = '';
    els.sendBtn.disabled = true;
    els.sendBtn.style.opacity = '0.5';

    appendUserMessage(text);
    state.history.push({ role: 'user', text: text });

    const match = window.SymphonyMatcher.matchIntent(text, window.SymphonyPolicy);

    if (match.isEmergency) {
      appendBotMessage(match.response, true);
      appendChipRow(['Calling dispatch now', 'Authorisation codes', 'Different question'], 'Next steps');
      state.history.push({ role: 'model', text: stripHtml(match.response) });
    } else if (match.confidence >= 0.4) {
      appendBotMessage(match.response, true);
      appendChipRow(match.chips, 'Suggested follow-ups');
      state.history.push({ role: 'model', text: stripHtml(match.response) });
    } else if (window.SymphonyGemini.isConfigured()) {
      const loadingNode = appendLoadingBubble();
      try {
        const html = await window.SymphonyGemini.generateResponse(
          text,
          state.history.slice(),
          policyAsContext()
        );
        loadingNode.remove();
        appendBotMessage(html, true);
        appendAiFootnote();
        appendChipRow(window.SymphonyPolicy.outOfScopeFallback.followupChips, 'Suggested follow-ups');
        state.history.push({ role: 'model', text: stripHtml(html) });
      } catch (e) {
        loadingNode.remove();
        appendBotMessage(window.SymphonyPolicy.outOfScopeFallback.response, true);
        appendChipRow(window.SymphonyPolicy.outOfScopeFallback.followupChips, 'Suggested follow-ups');
        state.history.push({ role: 'model', text: stripHtml(window.SymphonyPolicy.outOfScopeFallback.response) });
      }
    } else {
      appendBotMessage(window.SymphonyPolicy.outOfScopeFallback.response, true);
      appendChipRow(window.SymphonyPolicy.outOfScopeFallback.followupChips, 'Suggested follow-ups');
      state.history.push({ role: 'model', text: stripHtml(window.SymphonyPolicy.outOfScopeFallback.response) });
    }

    state.sending = false;
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || '';
  }

  function policyAsContext() {
    const cats = window.SymphonyPolicy.categories;
    const lines = [];
    lines.push('SYMPHONY DRIVER POLICY (authoritative):');
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i];
      const plain = stripHtml(c.response);
      lines.push('- ' + c.title + ': ' + plain);
    }
    lines.push('Emergency contact: ' + window.SymphonyPolicy.contacts.support.display + ' (' + window.SymphonyPolicy.contacts.support.digits + ').');
    return lines.join('\n');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
