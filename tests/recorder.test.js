import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickMimeType, blobToBase64, baseMime } from '../js/recorder.js';

test('picks first supported type', () => assert.equal(pickMimeType((t) => t === 'audio/mp4'), 'audio/mp4'));
test('prefers webm when available', () => assert.equal(pickMimeType(() => true), 'audio/webm'));
test('none supported -> null', () => assert.equal(pickMimeType(() => false), null));
test('blobToBase64', async () => assert.equal(await blobToBase64(new Blob(['hi'])), 'aGk='));
test('baseMime strips codecs', () => assert.equal(baseMime('audio/webm;codecs=opus'), 'audio/webm'));
