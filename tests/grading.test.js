import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, estimateBand } from '../js/grading.js';

const qs = [
  { id: '1', type: 'gap', answer: 'London', explanation: 'e1' },
  { id: '2', type: 'tfng', answer: 'Not Given', explanation: 'e2' },
  { id: '3', type: 'mcq', answer: 'B) the river', explanation: 'e3' },
  { id: '4', type: 'tfng', answer: 'True', explanation: 'e4' },
];

test('case and spaces insensitive', () => assert.equal(grade(qs, { 1: '  london ' }).results[0].ok, true));
test('NG short form', () => assert.equal(grade(qs, { 2: 'NG' }).results[1].ok, true));
test('T short form', () => assert.equal(grade(qs, { 4: 't' }).results[3].ok, true));
test('mcq exact option', () => assert.equal(grade(qs, { 3: 'B) the river' }).results[2].ok, true));
test('wrong answer not ok with explanation', () => {
  const r = grade(qs, { 1: 'Paris' });
  assert.equal(r.results[0].ok, false);
  assert.equal(r.results[0].explanation, 'e1');
  assert.equal(r.results[0].expected, 'London');
  assert.equal(r.results[0].given, 'Paris');
});
test('totals', () => {
  const r = grade(qs, { 1: 'london', 2: 'ng' });
  assert.equal(r.correct, 2);
  assert.equal(r.total, 4);
});
test('missing answer is wrong', () => assert.equal(grade(qs, {}).correct, 0));
test('estimateBand', () => {
  assert.equal(estimateBand(0, 10), 0);
  assert.equal(estimateBand(10, 10), 9);
  assert.equal(estimateBand(7, 10), 6.5);
  assert.equal(estimateBand(0, 0), 0);
});
