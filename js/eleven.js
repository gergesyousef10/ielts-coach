// ElevenLabs text-to-speech client (runs in the browser with the user's own key).
const API = 'https://api.elevenlabs.io/v1';

export class ElevenError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ElevenError';
    this.kind = kind; // "quota" | "auth" | "voice" | "network" | "other"
  }
}

// Same text + voice + model is played from memory instead of being paid for again.
const cache = new Map();
export function clearTTSCache() { cache.clear(); }

async function errorFrom(res) {
  let detail = {};
  try { detail = (await res.json())?.detail ?? {}; } catch { /* ignore */ }
  const status = typeof detail === 'object' ? String(detail.status || '') : '';
  const msg = (typeof detail === 'object' ? detail.message : String(detail)) || `HTTP ${res.status}`;
  if (res.status === 429 || /quota|credit|limit/i.test(status)) return new ElevenError('quota', msg);
  if (/voice/i.test(status) || res.status === 404) return new ElevenError('voice', msg);
  if (res.status === 401 || res.status === 403) return new ElevenError('auth', msg);
  return new ElevenError('other', msg);
}

export async function elevenTTS({ apiKey, voiceId, text, model = 'eleven_multilingual_v2', fetchImpl = globalThis.fetch }) {
  const key = `${voiceId}|${model}|${text}`;
  if (cache.has(key)) return cache.get(key);
  let res;
  try {
    res = await fetchImpl(`${API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg', 'xi-api-key': apiKey },
      body: JSON.stringify({ text, model_id: model }),
    });
  } catch (e) {
    throw new ElevenError('network', String(e?.message || e));
  }
  if (!res.ok) throw await errorFrom(res);
  const blob = await res.blob();
  cache.set(key, blob);
  return blob;
}

export async function listVoices({ apiKey, fetchImpl = globalThis.fetch }) {
  let res;
  try {
    res = await fetchImpl(`${API}/voices`, { headers: { 'xi-api-key': apiKey } });
  } catch (e) {
    throw new ElevenError('network', String(e?.message || e));
  }
  if (!res.ok) throw await errorFrom(res);
  const data = await res.json();
  return (data.voices || []).map((v) => ({ id: v.voice_id, name: v.name, language: v.labels?.language || '' }));
}

const MESSAGES = {
  quota: 'الـ credits بتاعة ElevenLabs خلصت أو وصلت للحد 😅 هكمل بصوت جهازك لحد ما تتجدد.',
  auth: 'مفتاح ElevenLabs مش شغال 🔑 اتأكد إنه صح وإن صلاحية Text to Speech متفعّلة.',
  voice: 'الصوت ده مش في حسابك على ElevenLabs 🎙️ افتح Voice Library ودوس "Add to my voices"، أو اختار صوت تاني من الإعدادات.',
  network: 'مقدرتش أوصل لـ ElevenLabs 📶 هكمل بصوت جهازك.',
  other: 'ElevenLabs رجّع مشكلة 🤔 هكمل بصوت جهازك.',
};

export function elevenFriendlyError(err) { return MESSAGES[err?.kind] || MESSAGES.other; }
