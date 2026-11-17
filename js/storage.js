const DEFAULTS = { examType: 'academic', model: 'gemini-flash-latest', readAloud: false, voiceEn: '', voiceAr: '',
  elevenKey: '', elevenVoiceAr: 'x6fvBLXv9YxzoVJQ0wp6', elevenVoiceEn: 'lrivmCHEM3HUU4GFbeDS', elevenModel: 'eleven_multilingual_v2' };
const K = { key: 'ic.apiKey', settings: 'ic.settings', mistakes: 'ic.mistakes', results: 'ic.results' };

function store_(s) { return s ?? globalThis.localStorage; }

function readJson(s, key, fallback) {
  try {
    const raw = store_(s).getItem(key);
    if (raw == null) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(s, key, value) { store_(s).setItem(key, JSON.stringify(value)); }

export function getSettings(store) {
  const saved = readJson(store, K.settings, {});
  const obj = typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  return { apiKey: store_(store).getItem(K.key) ?? '', ...DEFAULTS, ...obj };
}

export function saveSettings(partial, store) {
  const { apiKey, ...rest } = partial;
  if (apiKey !== undefined) store_(store).setItem(K.key, String(apiKey).trim());
  const { apiKey: _ignored, ...current } = getSettings(store);
  writeJson(store, K.settings, { ...current, ...rest });
  return getSettings(store);
}

function readList(store, key) {
  const v = readJson(store, key, []);
  return Array.isArray(v) ? v : [];
}

export function addMistakes(skill, mistakes, store) {
  const date = new Date().toISOString();
  const added = (mistakes || []).map((m) => ({ ...m, skill, date }));
  writeJson(store, K.mistakes, [...added, ...readList(store, K.mistakes)].slice(0, 500));
}

export function getMistakes(store) { return readList(store, K.mistakes); }

export function addResult(skill, band, store) {
  const entry = { skill, band: Number(band), date: new Date().toISOString() };
  writeJson(store, K.results, [entry, ...readList(store, K.results)].slice(0, 500));
}

export function getResults(store) { return readList(store, K.results); }
