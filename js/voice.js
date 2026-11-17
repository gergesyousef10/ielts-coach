import { getSettings } from './storage.js';

const norm = (l) => String(l || '').toLowerCase().replace('_', '-');

/** Higher = better sounding. macOS/iOS mark downloadable HQ voices "(Premium)"/"(Enhanced)". */
export function voiceQuality(v) {
  const n = String(v?.name || '');
  if (/premium/i.test(n)) return 4;
  if (/enhanced|neural|natural/i.test(n)) return 3;
  if (/google|microsoft .* online/i.test(n)) return 2;
  if (/compact|eloquence|bad news|bells|bubbles|zarvox|whisper|trinoids|jester|organ|cellos|boing|albert|bahh|superstar|wobble|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy/i.test(n)) return 0;
  return 1;
}

/** Voices for a language (by prefix, e.g. "ar" or "en"), best first; exact locale first among equals. */
export function voicesFor(voices, lang) {
  const l = norm(lang);
  const base = l.split('-')[0];
  return (voices || [])
    .filter((v) => norm(v.lang).startsWith(base))
    .sort((a, b) => (norm(b.lang) === l) - (norm(a.lang) === l) || voiceQuality(b) - voiceQuality(a));
}

export function pickVoice(voices, lang, preferredName) {
  if (preferredName) {
    const chosen = (voices || []).find((v) => v.name === preferredName);
    if (chosen) return chosen;
  }
  return voicesFor(voices, lang)[0] || null;
}

export function cleanForSpeech(text) {
  return String(text)
    .replace(/[*_`#>~]/g, '')
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(text, lang = 'en-GB') {
  const synth = globalThis.speechSynthesis;
  if (!synth || !globalThis.SpeechSynthesisUtterance) return null;
  synth.cancel();
  const isAr = lang === 'ar';
  const target = isAr ? 'ar-EG' : lang;
  const s = getSettings();
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  u.lang = target;
  const v = pickVoice(synth.getVoices(), target, isAr ? s.voiceAr : s.voiceEn);
  if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = isAr ? 1 : 0.95;
  synth.speak(u);
  return u;
}

/** Voices load asynchronously in Chrome; resolves once the list is available (or after 1.5s). */
export function loadVoices() {
  const synth = globalThis.speechSynthesis;
  if (!synth) return Promise.resolve([]);
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener?.('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });
}

export function stopSpeaking() { globalThis.speechSynthesis?.cancel(); }

export function speakButton(text, lang = 'ar') {
  const b = document.createElement('button');
  b.className = 'speak';
  b.type = 'button';
  b.textContent = '🔊';
  b.title = 'اسمع';
  b.addEventListener('click', () => speak(text, lang));
  return b;
}
