window.SymphonyMatcher = (function () {
  'use strict';

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(function (t) { return t.length > 0; });
  }

  function fuzzyContainsKeyword(token, keyword) {
    if (token === keyword) return true;
    if (token.length < 4 || keyword.length < 4) return false;
    if (token.indexOf(keyword) !== -1 || keyword.indexOf(token) !== -1) {
      return Math.abs(token.length - keyword.length) <= 3;
    }
    const allowed = Math.max(1, Math.floor(Math.min(token.length, keyword.length) / 4));
    return levenshtein(token, keyword) <= allowed;
  }

  function isEmergency(input) {
    if (!input) return false;
    for (let i = 0; i < window.SymphonyPolicy.emergencyPatterns.length; i++) {
      if (window.SymphonyPolicy.emergencyPatterns[i].test(input)) return true;
    }
    return false;
  }

  function scoreCategory(input, tokens, category) {
    let score = 0;
    let triggerHits = 0;
    let keywordHits = 0;

    for (let i = 0; i < category.triggers.length; i++) {
      if (category.triggers[i].test(input)) {
        score += 0.35;
        triggerHits += 1;
      }
    }

    const lowerInput = input.toLowerCase();
    for (let i = 0; i < category.keywords.length; i++) {
      const kw = category.keywords[i];
      if (kw.indexOf(' ') !== -1) {
        if (lowerInput.indexOf(kw) !== -1) {
          score += 0.2;
          keywordHits += 1;
        }
        continue;
      }
      if (lowerInput.indexOf(kw) !== -1) {
        score += 0.18;
        keywordHits += 1;
        continue;
      }
      let matched = false;
      for (let t = 0; t < tokens.length; t++) {
        if (fuzzyContainsKeyword(tokens[t], kw)) {
          score += 0.12;
          keywordHits += 1;
          matched = true;
          break;
        }
      }
      if (!matched && kw.length >= 5) {
        for (let t = 0; t < tokens.length; t++) {
          if (tokens[t].length >= 4 && levenshtein(tokens[t], kw) <= 1) {
            score += 0.08;
            keywordHits += 1;
            break;
          }
        }
      }
    }

    if (triggerHits > 0 && keywordHits === 0) score += 0.05;
    if (score > 1) score = 1;
    return score;
  }

  function matchIntent(userInput, policy) {
    const input = (userInput || '').trim();
    const fallback = {
      intent: null,
      confidence: 0,
      response: policy.outOfScopeFallback.response,
      chips: policy.outOfScopeFallback.followupChips,
      isEmergency: false
    };

    if (!input) return fallback;

    if (isEmergency(input)) {
      return {
        intent: 'safety-emergency',
        confidence: 1,
        response: policy.emergencySafety.response,
        chips: policy.emergencySafety.followupChips,
        isEmergency: true
      };
    }

    const tokens = tokenize(input);
    let best = null;

    for (let i = 0; i < policy.categories.length; i++) {
      const cat = policy.categories[i];
      const score = scoreCategory(input, tokens, cat);
      if (best === null || score > best.score) {
        best = { score: score, category: cat };
      }
    }

    if (!best || best.score < 0.18) return fallback;

    return {
      intent: best.category.id,
      confidence: best.score,
      response: best.category.response,
      chips: best.category.followupChips,
      isEmergency: false
    };
  }

  return { matchIntent: matchIntent, levenshtein: levenshtein, isEmergency: isEmergency };
})();
