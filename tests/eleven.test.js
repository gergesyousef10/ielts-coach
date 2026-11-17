import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elevenTTS, listVoices, ElevenError, clearTTSCache, elevenFriendlyError } from '../js/eleven.js';

function fake(status, body, cap) {
  return async (url, opts) => {
    cap && cap.push({ url, opts });
    const isBlob = body instanceof Blob;
    return {
      ok: status >= 200 && status < 300, status,
      blob: async () => (isBlob ? body : new Blob([JSON.stringify(body)])),
      json: async () => (isBlob ? {} : body),
    };
  };
}
const audio = new Blob(['mp3'], { type: 'audio/mpeg' });

test('tts request shape and returns audio blob', async () => {
  clearTTSCache();
  const cap = [];
  const b = await elevenTTS({ apiKey: 'EK', voiceId: 'V1', text: 'أهلا', model: 'eleven_multilingual_v2', fetchImpl: fake(200, audio, cap) });
  assert.equal(await b.text(), 'mp3');
  assert.match(cap[0].url, /\/v1\/text-to-speech\/V1\?output_format=mp3_44100_128$/);
  assert.equal(cap[0].opts.headers['xi-api-key'], 'EK');
  assert.deepEqual(JSON.parse(cap[0].opts.body), { text: 'أهلا', model_id: 'eleven_multilingual_v2' });
});

test('same text and voice is cached (no second charge)', async () => {
  clearTTSCache();
  const cap = [];
  const f = fake(200, audio, cap);
  await elevenTTS({ apiKey: 'EK', voiceId: 'V1', text: 'hi', fetchImpl: f });
  await elevenTTS({ apiKey: 'EK', voiceId: 'V1', text: 'hi', fetchImpl: f });
  await elevenTTS({ apiKey: 'EK', voiceId: 'V2', text: 'hi', fetchImpl: f });
  assert.equal(cap.length, 2);
});

async function kind(p) { try { await p; return 'none'; } catch (e) { assert.ok(e instanceof ElevenError); return e.kind; } }
const base = { apiKey: 'EK', voiceId: 'V', text: 'x' };

test('quota exceeded -> quota', async () => {
  clearTTSCache();
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: fake(401, { detail: { status: 'quota_exceeded', message: 'no credits' } }) })), 'quota');
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: fake(429, { detail: { status: 'too_many_concurrent_requests' } }) })), 'quota');
});
test('bad key -> auth', async () => {
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: fake(401, { detail: { status: 'invalid_api_key' } }) })), 'auth');
});
test('voice not available -> voice', async () => {
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: fake(404, { detail: { status: 'voice_not_found' } }) })), 'voice');
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: fake(400, { detail: { status: 'voice_not_found' } }) })), 'voice');
});
test('network -> network', async () => {
  assert.equal(await kind(elevenTTS({ ...base, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })), 'network');
});
test('listVoices returns id/name/lang', async () => {
  const cap = [];
  const r = await listVoices({ apiKey: 'EK', fetchImpl: fake(200, { voices: [{ voice_id: 'a', name: 'Momen', labels: { language: 'ar' } }] }, cap) });
  assert.deepEqual(r, [{ id: 'a', name: 'Momen', language: 'ar' }]);
  assert.match(cap[0].url, /\/v1\/voices$/);
});
test('friendly messages are Arabic', () => {
  for (const k of ['quota', 'auth', 'voice', 'network', 'other']) assert.match(elevenFriendlyError(new ElevenError(k, 'x')), /[؀-ۿ]/);
});
