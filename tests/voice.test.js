import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, cleanForSpeech } from '../js/voice.js';

test('pickVoice prefers exact lang, then prefix, else null', () => {
  const voices = [{ lang: 'en-US', name: 'a' }, { lang: 'en-GB', name: 'b' }, { lang: 'ar-SA', name: 'c' }];
  assert.equal(pickVoice(voices, 'en-GB').name, 'b');
  assert.equal(pickVoice(voices, 'ar').name, 'c');
  assert.equal(pickVoice([{ lang: 'fr-FR' }], 'ar'), null);
});
test('cleanForSpeech strips emoji and markdown', () => {
  assert.equal(cleanForSpeech('**أهلا** 😂 يا باشا'), 'أهلا يا باشا');
});
