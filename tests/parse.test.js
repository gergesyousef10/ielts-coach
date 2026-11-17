import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJson } from '../js/parse.js';

test('fenced json', () => assert.deepEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 }));
test('json with surrounding prose', () => assert.deepEqual(parseJson('Here you go: {"a":{"b":2}} thanks'), { a: { b: 2 } }));
test('braces inside strings', () => assert.deepEqual(parseJson('x {"t":"a } b"} y'), { t: 'a } b' }));
test('garbage throws bad_response', () => {
  assert.throws(() => parseJson('nope'), (e) => e.kind === 'bad_response');
});
