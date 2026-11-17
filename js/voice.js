import { getSettings } from './storage.js';
import { elevenTTS, elevenFriendlyError } from './eleven.js';

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

/** Decide which engine speaks: ElevenLabs when a key and a voice for that language are set. */
export function chooseVoiceEngine(settings, lang) {
  const voiceId = lang === 'ar' ? settings.elevenVoiceAr : settings.elevenVoiceEn;
  if (settings.elevenKey && voiceId) return { engine: 'eleven', apiKey: settings.elevenKey, voiceId, model: settings.elevenModel };
  return { engine: 'device' };
}

let currentAudio = null;
let speakToken = 0;
let lastElevenNotice = 0;

function speakDevice(text, lang, s) {
  const synth = globalThis.speechSynthesis;
  if (!synth || !globalThis.SpeechSynthesisUtterance) return null;
  synth.cancel();
  const isAr = lang === 'ar';
  const target = isAr ? 'ar-EG' : lang;
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  u.lang = target;
  const v = pickVoice(synth.getVoices(), target, isAr ? s.voiceAr : s.voiceEn);
  if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = isAr ? 1 : 0.95;
  synth.speak(u);
  return u;
}

function notice(msg) {
  // one small toast at most every 30s so a failing voice doesn't spam the screen
  if (typeof document === 'undefined' || Date.now() - lastElevenNotice < 30000) return;
  lastElevenNotice = Date.now();
  const t = document.createElement('div');
  t.className = 'error toast';
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 7000);
}

/** Speak text with ElevenLabs if configured, else (or on any failure) with the device voice. */
export async function speak(text, lang = 'en-GB') {
  stopSpeaking();
  const token = ++speakToken;
  const s = getSettings();
  const choice = chooseVoiceEngine(s, lang);
  if (choice.engine === 'eleven') {
    try {
      const blob = await elevenTTS({ apiKey: choice.apiKey, voiceId: choice.voiceId, model: choice.model, text: cleanForSpeech(text) });
      if (token !== speakToken) return null; // something else started speaking meanwhile
      const audio = new Audio(URL.createObjectURL(blob));
      currentAudio = audio;
      await audio.play();
      return audio;
    } catch (e) {
      if (token !== speakToken) return null;
      console.warn('ElevenLabs failed, using device voice', e);
      if (e?.kind) notice(elevenFriendlyError(e));
    }
  }
  return speakDevice(text, lang, s);
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

export function stopSpeaking() {
  speakToken++;
  globalThis.speechSynthesis?.cancel();
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
}

export function speakButton(text, lang = 'ar') {
  const b = document.createElement('button');
  b.className = 'speak';
  b.type = 'button';
  b.textContent = '🔊';
  b.title = 'اسمع';
  b.addEventListener('click', () => speak(text, lang));
  return b;
}
