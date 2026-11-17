import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackHtml } from '../js/feedback.js';

const fb = {
  overallBand: 6.5,
  criteria: { task: { band: 6, comment: 'كويس' }, coherence: { band: 7, comment: 'حلو' }, vocabulary: { band: 6.5, comment: 'x' }, grammar: { band: 6, comment: 'y' } },
  mistakes: [
    { original: 'I am agree', correction: 'I agree', explanation: 'agree فعل' },
    { original: '<script>alert(1)</script>', correction: 'ok', explanation: 'e' },
    { original: 'peoples', correction: 'people', explanation: 'جمع' },
  ],
  improvedVersion: 'Better essay',
  tutorMessage: 'شد حيلك',
};

test('shows overall band', () => assert.match(feedbackHtml(fb), /6\.5/));
test('renders every mistake', () => assert.equal((feedbackHtml(fb).match(/<li/g) || []).length, 3));
test('escapes user text', () => {
  const html = feedbackHtml(fb);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
test('criteria and improved version optional (speaking)', () => {
  const html = feedbackHtml({ overallBand: 5, mistakes: [], tutorMessage: 'تمام' });
  assert.match(html, /تمام/);
  assert.ok(!html.includes('undefined'));
});
test('no mistakes shows a happy message', () => assert.match(feedbackHtml({ overallBand: 8, mistakes: [] }), /مفيش/));
