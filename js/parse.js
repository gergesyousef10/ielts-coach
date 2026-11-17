import { GeminiError } from './gemini.js';

export function parseJson(text) {
  const s = String(text ?? '').replace(/```(?:json)?/gi, '');
  try { return JSON.parse(s.trim()); } catch { /* fall through */ }
  const start = s.indexOf('{');
  if (start !== -1) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)); } catch { break; }
      }
    }
  }
  throw new GeminiError('bad_response', 'Could not parse JSON from AI reply');
}
