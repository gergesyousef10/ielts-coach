import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseVoiceEngine } from '../js/voice.js';

const s = { elevenKey: 'EK', elevenVoiceAr: 'AR1', elevenVoiceEn: 'EN1', elevenModel: 'm' };

test('uses ElevenLabs with the right voice when key set', () => {
  assert.deepEqual(chooseVoiceEngine(s, 'ar'), { engine: 'eleven', apiKey: 'EK', voiceId: 'AR1', model: 'm' });
  assert.deepEqual(chooseVoiceEngine(s, 'en-GB'), { engine: 'eleven', apiKey: 'EK', voiceId: 'EN1', model: 'm' });
});
test('device voice when no key or no voice id', () => {
  assert.equal(chooseVoiceEngine({ ...s, elevenKey: '' }, 'ar').engine, 'device');
  assert.equal(chooseVoiceEngine({ ...s, elevenVoiceAr: '' }, 'ar').engine, 'device');
});
