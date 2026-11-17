import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoice, cleanForSpeech, voicesFor } from '../js/voice.js';

test('pickVoice prefers exact lang, then prefix, else null', () => {
  const voices = [{ lang: 'en-US', name: 'a' }, { lang: 'en-GB', name: 'b' }, { lang: 'ar-SA', name: 'c' }];
  assert.equal(pickVoice(voices, 'en-GB').name, 'b');
  assert.equal(pickVoice(voices, 'ar').name, 'c');
  assert.equal(pickVoice([{ lang: 'fr-FR' }], 'ar'), null);
});
test('cleanForSpeech strips emoji and markdown', () => {
  assert.equal(cleanForSpeech('**أهلا** 😂 يا باشا'), 'أهلا يا باشا');
});

test('pickVoice prefers higher quality voices for the language', () => {
  const voices = [
    { lang: 'en-GB', name: 'Daniel' },
    { lang: 'en-GB', name: 'Serena (Enhanced)' },
    { lang: 'en-GB', name: 'Jamie (Premium)' },
    { lang: 'en-GB', name: 'Google UK English Female' },
  ];
  assert.equal(pickVoice(voices, 'en-GB').name, 'Jamie (Premium)');
  assert.equal(pickVoice(voices.slice(0, 2), 'en-GB').name, 'Serena (Enhanced)');
  assert.equal(pickVoice([voices[0], voices[3]], 'en-GB').name, 'Google UK English Female');
});

test('pickVoice uses the saved voice name when present', () => {
  const voices = [{ lang: 'en-GB', name: 'Jamie (Premium)' }, { lang: 'en-US', name: 'Samantha' }];
  assert.equal(pickVoice(voices, 'en-GB', 'Samantha').name, 'Samantha');
  assert.equal(pickVoice(voices, 'en-GB', 'Gone Voice').name, 'Jamie (Premium)');
});

test('exact locale beats a better voice in another locale', () => {
  const voices = [{ lang: 'en-US', name: 'Ava (Premium)' }, { lang: 'en-GB', name: 'Daniel' }];
  assert.equal(pickVoice(voices, 'en-GB').name, 'Daniel');
  assert.equal(pickVoice([{ lang: 'en-US', name: 'Ava (Premium)' }], 'en-GB').name, 'Ava (Premium)');
});

test('voicesFor lists voices of a language, best first', () => {
  const voices = [{ lang: 'ar-SA', name: 'Majed' }, { lang: 'en-GB', name: 'Daniel' }, { lang: 'ar-SA', name: 'Majed (Enhanced)' }];
  assert.deepEqual(voicesFor(voices, 'ar').map((v) => v.name), ['Majed (Enhanced)', 'Majed']);
});
