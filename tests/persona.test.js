import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUTOR_PERSONA, buildPrompt } from '../js/persona.js';

test('persona is Egyptian colloquial and never skips mistakes', () => {
  assert.ok(TUTOR_PERSONA.includes('ماتسيبش ولا غلطة'));
  assert.match(TUTOR_PERSONA, /عامية|العامية المصرية/);
});
test('writing2 general prompt', () => {
  const p = buildPrompt('writing2', 'general');
  assert.ok(p.includes('General Training'));
  assert.ok(p.includes('improvedVersion'));
  assert.ok(p.includes(TUTOR_PERSONA));
});
test('reading academic prompt', () => {
  const p = buildPrompt('reading', 'academic');
  assert.ok(p.includes('Academic'));
  assert.ok(p.includes('questions'));
});
test('all modes build', () => {
  for (const m of ['writing1', 'writing2', 'writing1-task', 'writing2-task', 'speaking', 'reading', 'listening', 'chat'])
    assert.ok(buildPrompt(m, 'academic').length > 100);
});
test('unknown mode throws', () => {
  assert.throws(() => buildPrompt('bogus', 'academic'));
});
