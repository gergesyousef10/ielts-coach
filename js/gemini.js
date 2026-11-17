const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';

export class GeminiError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind; // "quota" | "auth" | "network" | "bad_response"
  }
}

function toPart(m) {
  if (m.audio) return { inline_data: { mime_type: m.audio.mimeType, data: m.audio.base64 } };
  return { text: m.text ?? '' };
}

export async function callGemini({ apiKey, model, system, messages, json = false, fetchImpl = globalThis.fetch }) {
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({ role: m.role, parts: [toPart(m)] })),
    generationConfig: json ? { responseMimeType: 'application/json' } : {},
  };
  let res;
  try {
    res = await fetchImpl(ENDPOINT + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new GeminiError('network', String(e?.message || e));
  }
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    if (res.status === 429) throw new GeminiError('quota', msg);
    if (res.status === 401 || res.status === 403 || /api key/i.test(msg)) throw new GeminiError('auth', msg);
    throw new GeminiError('bad_response', msg);
  }
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) throw new GeminiError('bad_response', 'No candidates in response');
  return parts.map((p) => p.text ?? '').join('');
}

const MESSAGES = {
  quota: 'الـ AI خد نفسه شوية 😅 الحد المجاني خلص دلوقتي. استنى دقيقة وجرب تاني، ولو لسه، يبقى خلص بتاع النهارده وكمل بكرة. اللي كتبته متحفظ متقلقش.',
  auth: 'المفتاح (API key) شكله مش مظبوط أو مش موجود 🔑 روح للإعدادات وحطه تاني.',
  network: 'النت فصل ولا إيه؟ 📶 اتأكد إنك متصل وجرب تاني.',
  bad_response: 'الـ AI رد رد غريب كده 🤔 جرب تاني، ولو فضلت المشكلة جرب تغير اسم الموديل من الإعدادات.',
};

export function friendlyError(err) {
  return MESSAGES[err?.kind] || 'حصلت مشكلة مش متوقعة 😬 جرب تاني.';
}
