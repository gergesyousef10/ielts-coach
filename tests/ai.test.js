import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askTutor } from '../js/ai.js';
import { buildPrompt } from '../js/persona.js';

const settings = (apiKey) => () => ({ apiKey, examType: 'general', model: 'm1', readAloud: false });

test('empty key -> auth error, no API call', async () => {
  let called = false;
  await assert.rejects(
    askTutor({ mode: 'chat', messages: [{ role: 'user', text: 'hi' }], deps: { getSettings: settings(''), callGemini: async () => { called = true; return ''; } } }),
    (e) => e.kind === 'auth',
  );
  assert.equal(called, false);
});

test('json mode parses fenced reply and passes prompt + model', async () => {
  let args;
  const r = await askTutor({
    mode: 'writing2', json: true, messages: [{ role: 'user', text: 'essay' }],
    deps: { getSettings: settings('KEY'), callGemini: async (a) => { args = a; return '```json\n{"overallBand":6}\n```'; } },
  });
  assert.deepEqual(r, { overallBand: 6 });
  assert.equal(args.system, buildPrompt('writing2', 'general'));
  assert.equal(args.model, 'm1');
  assert.equal(args.apiKey, 'KEY');
  assert.equal(args.json, true);
});

test('text mode returns raw text', async () => {
  const r = await askTutor({ mode: 'chat', messages: [{ role: 'user', text: 'x' }], deps: { getSettings: settings('K'), callGemini: async () => 'أهلا' } });
  assert.equal(r, 'أهلا');
});
