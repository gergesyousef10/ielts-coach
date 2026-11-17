export function pickVoice(voices, lang) {
  const list = voices || [];
  const l = lang.toLowerCase();
  return list.find((v) => v.lang?.toLowerCase().replace('_', '-') === l)
    || list.find((v) => v.lang?.toLowerCase().startsWith(l.split('-')[0]))
    || null;
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
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  u.lang = lang === 'ar' ? 'ar-EG' : lang;
  const v = pickVoice(synth.getVoices(), lang === 'ar' ? 'ar-EG' : lang) || pickVoice(synth.getVoices(), lang);
  if (v) u.voice = v;
  u.rate = lang === 'ar' ? 1 : 0.95;
  synth.speak(u);
  return u;
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
