import { test } from 'node:test';
import assert from 'node:assert/strict';
import { callGemini, GeminiError, friendlyError } from '../js/gemini.js';

function fakeFetch(status, body, capture = {}) {
  return async (url, opts) => {
    capture.url = url; capture.opts = opts;
    return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
  };
}
const okBody = { candidates: [{ content: { parts: [{ text: 'Hello ' }, { text: 'there' }] } }] };

test('builds request with model, key, system and audio inline_data', async () => {
  const cap = {};
  await callGemini({
    apiKey: 'KEY', model: 'gemini-flash-latest', system: 'SYS', json: true,
    messages: [{ role: 'user', text: 'hi' }, { role: 'user', audio: { mimeType: 'audio/mp4', base64: 'AAA' } }],
    fetchImpl: fakeFetch(200, okBody, cap),
  });
  assert.match(cap.url, /models\/gemini-flash-latest:generateContent$/);
  assert.equal(cap.opts.headers['x-goog-api-key'], 'KEY');
  const body = JSON.parse(cap.opts.body);
  assert.equal(body.system_instruction.parts[0].text, 'SYS');
  assert.deepEqual(body.contents[1].parts[0], { inline_data: { mime_type: 'audio/mp4', data: 'AAA' } });
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
});

test('returns joined text', async () => {
  const r = await callGemini({ apiKey: 'k', model: 'm', system: 's', messages: [{ role: 'user', text: 'x' }], fetchImpl: fakeFetch(200, okBody) });
  assert.equal(r, 'Hello there');
});

async function kindOf(p) { try { await p; return 'none'; } catch (e) { assert.ok(e instanceof GeminiError); return e.kind; } }
const base = { apiKey: 'k', model: 'm', system: 's', messages: [{ role: 'user', text: 'x' }] };

test('429 -> quota', async () => {
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: fakeFetch(429, { error: { message: 'Resource exhausted' } }) })), 'quota');
});
test('bad key -> auth', async () => {
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: fakeFetch(400, { error: { message: 'API key not valid. Please pass a valid API key.' } }) })), 'auth');
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: fakeFetch(403, { error: { message: 'Permission denied' } }) })), 'auth');
});
test('network failure -> network', async () => {
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } })), 'network');
});
test('no candidates -> bad_response', async () => {
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: fakeFetch(200, { candidates: [] }) })), 'bad_response');
});
test('other http error -> bad_response', async () => {
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: fakeFetch(500, { error: { message: 'boom' } }) })), 'bad_response');
});
test('friendlyError gives Arabic text per kind', () => {
  for (const k of ['quota', 'auth', 'network', 'bad_response']) {
    const msg = friendlyError(new GeminiError(k, 'x'));
    assert.match(msg, /[؀-ۿ]/);
  }
  assert.match(friendlyError(new Error('weird')), /[؀-ۿ]/);
});

test('slow request times out with kind timeout', async () => {
  const hang = (url, opts) => new Promise((_, reject) => {
    opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const started = Date.now();
  assert.equal(await kindOf(callGemini({ ...base, fetchImpl: hang, timeoutMs: 30 })), 'timeout');
  assert.ok(Date.now() - started < 1000);
});
test('timeout has an Arabic message', () => {
  assert.match(friendlyError(new GeminiError('timeout', 'x')), /[؀-ۿ]/);
  assert.notEqual(friendlyError(new GeminiError('timeout', 'x')), friendlyError(new Error('?')));
});
