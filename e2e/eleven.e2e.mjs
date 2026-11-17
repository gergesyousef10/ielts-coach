import { openApp, check } from './harness.mjs';

// Fake device speech + fake Audio element so we can see which engine spoke.
const init = () => {
  window.__spoken = [];
  window.__played = [];
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => [{ name: 'Daniel', lang: 'en-GB' }, { name: 'Majed', lang: 'ar-SA' }],
    cancel() {}, addEventListener() {},
    speak: (u) => window.__spoken.push(u.text),
  } });
  window.Audio = function (src) { this.src = src; this.pause = () => {}; this.play = () => { window.__played.push(src); return Promise.resolve(); }; };
};

const { page, errors, close } = await openApp({ storage: { 'ic.apiKey': 'K' }, hash: '#/settings', init });
const ttsCalls = [];
let mode = 'ok';
await page.route('https://api.elevenlabs.io/**', async (route) => {
  const req = route.request();
  if (req.url().endsWith('/v1/voices')) {
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ voices: [{ voice_id: 'MINE1', name: 'My Voice', labels: { language: 'ar' } }] }) });
  }
  ttsCalls.push({ url: req.url(), key: req.headers()['xi-api-key'], body: JSON.parse(req.postData()) });
  if (mode === 'quota') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: { status: 'quota_exceeded', message: 'no credits' } }) });
  return route.fulfill({ contentType: 'audio/mpeg', body: Buffer.from('ID3fake') });
});

try {
  await page.fill('#elevenKey', 'sk_test');
  await page.click('#try-eleven-ar');
  await page.waitForFunction(() => window.__played.length === 1, null, { timeout: 5000 });
  check(ttsCalls[0].url.includes('/text-to-speech/x6fvBLXv9YxzoVJQ0wp6'), 'tutor uses Momen by default');
  check(ttsCalls[0].key === 'sk_test', 'sends ElevenLabs key');
  check(ttsCalls[0].body.model_id === 'eleven_multilingual_v2', 'default model');

  await page.click('#try-eleven-en');
  await page.waitForFunction(() => window.__played.length === 2, null, { timeout: 5000 });
  check(ttsCalls[1].url.includes('/text-to-speech/lrivmCHEM3HUU4GFbeDS'), 'examiner uses Catherine by default');

  await page.click('#try-eleven-en');
  await page.waitForFunction(() => window.__played.length === 3, null, { timeout: 5000 });
  check(ttsCalls.length === 2, 'replaying the same sentence does not call ElevenLabs again');

  await page.click('#eleven-load');
  await page.waitForFunction(() => document.querySelector('#eleven-status').textContent.includes('1'), null, { timeout: 5000 });
  check(await page.$('#eleven-ar option[value="MINE1"]') !== null, 'account voices added to list');

  mode = 'quota';
  await page.selectOption('#eleven-ar', 'MINE1');
  await page.click('#try-eleven-ar');
  await page.waitForFunction(() => window.__spoken.length === 1, null, { timeout: 5000 });
  check(true, 'quota error falls back to device voice');
  check((await page.textContent('.toast')).includes('credits'), 'shows credits message');

  await page.click('#save');
  await page.reload();
  await page.goto(page.url().replace(/#.*/, '#/settings'));
  check((await page.inputValue('#elevenKey')) === 'sk_test', 'ElevenLabs key persists');
  check((await page.inputValue('#eleven-ar')) === 'MINE1', 'chosen ElevenLabs voice persists');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} catch (e) {
  check(false, String(e.message).split('\n')[0]);
} finally { await close(); }
