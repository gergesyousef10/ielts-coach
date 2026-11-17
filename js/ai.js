import { getSettings as realGetSettings } from './storage.js';
import { callGemini as realCallGemini, GeminiError } from './gemini.js';
import { buildPrompt } from './persona.js';
import { parseJson } from './parse.js';

export async function askTutor({ mode, messages, json = false, deps = {} }) {
  const getSettings = deps.getSettings || realGetSettings;
  const callGemini = deps.callGemini || realCallGemini;
  const s = getSettings();
  if (!s.apiKey) throw new GeminiError('auth', 'No API key set');
  const text = await callGemini({ apiKey: s.apiKey, model: s.model, system: buildPrompt(mode, s.examType), messages, json });
  return json ? parseJson(text) : text;
}
