import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeStore } from './helpers.js';
import { getSettings, saveSettings, addMistakes, getMistakes, addResult, getResults } from '../js/storage.js';

test('defaults', () => {
  assert.deepEqual(getSettings(fakeStore()), { apiKey: '', examType: 'academic', model: 'gemini-flash-latest', readAloud: false, voiceEn: '', voiceAr: '', elevenKey: '', elevenVoiceAr: 'x6fvBLXv9YxzoVJQ0wp6', elevenVoiceEn: 'lrivmCHEM3HUU4GFbeDS', elevenModel: 'eleven_multilingual_v2' });
});

test('saveSettings merges and stores key separately', () => {
  const s = fakeStore();
  saveSettings({ examType: 'general' }, s);
  saveSettings({ apiKey: 'k' }, s);
  const r = getSettings(s);
  assert.equal(r.examType, 'general');
  assert.equal(r.apiKey, 'k');
  assert.equal(s.getItem('ic.apiKey'), 'k');
});

test('mistakes newest first with skill and date', () => {
  const s = fakeStore();
  addMistakes('writing', [{ original: 'a', correction: 'b', explanation: 'c' }], s);
  addMistakes('speaking', [{ original: 'x', correction: 'y', explanation: 'z' }], s);
  const m = getMistakes(s);
  assert.equal(m.length, 2);
  assert.equal(m[0].skill, 'speaking');
  assert.ok(!Number.isNaN(Date.parse(m[0].date)));
});

test('corrupt data is treated as empty', () => {
  const s = fakeStore({ 'ic.mistakes': '{not json', 'ic.settings': '???' });
  assert.deepEqual(getMistakes(s), []);
  assert.equal(getSettings(s).examType, 'academic');
});

test('results', () => {
  const s = fakeStore();
  addResult('writing', 6.5, s);
  assert.equal(getResults(s)[0].band, 6.5);
  assert.equal(getResults(s)[0].skill, 'writing');
});
