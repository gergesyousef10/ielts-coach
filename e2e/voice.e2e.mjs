import { openApp, check } from './harness.mjs';

// Fake speech engine with a mix of voices, recording what gets spoken.
const init = () => {
  const voices = [
    { name: 'Daniel', lang: 'en-GB' }, { name: 'Jamie (Premium)', lang: 'en-GB' },
    { name: 'Samantha', lang: 'en-US' }, { name: 'Majed', lang: 'ar-SA' }, { name: 'Majed (Enhanced)', lang: 'ar-SA' },
  ];
  window.__spoken = [];
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => voices, cancel() {}, addEventListener() {},
    speak: (u) => window.__spoken.push({ text: u.text, voice: u.voice?.name }),
  } });
};

const { page, errors, close } = await openApp({ storage: { 'ic.apiKey': 'K' }, hash: '#/settings', init });
try {
  await page.waitForSelector('#voice-en option:nth-child(2)', { state: 'attached' });
  const enOpts = await page.$$eval('#voice-en option', (o) => o.map((x) => x.value));
  check(enOpts[1] === 'Jamie (Premium)', 'English list shows premium voice first: ' + enOpts.join(', '));
  const arOpts = await page.$$eval('#voice-ar option', (o) => o.map((x) => x.value));
  check(arOpts[1] === 'Majed (Enhanced)', 'Arabic list shows enhanced voice first');

  await page.click('#test-en');
  check((await page.evaluate(() => window.__spoken.at(-1).voice)) === 'Jamie (Premium)', 'auto picks premium voice');

  await page.selectOption('#voice-en', 'Samantha');
  await page.click('#test-en');
  check((await page.evaluate(() => window.__spoken.at(-1).voice)) === 'Samantha', 'chosen voice is used');

  await page.selectOption('#voice-ar', 'Majed');
  await page.click('#save');
  await page.reload();
  await page.goto(page.url().replace(/#.*/, '#/settings'));
  await page.waitForSelector('#voice-ar option:nth-child(2)', { state: 'attached' });
  check((await page.inputValue('#voice-ar')) === 'Majed', 'Arabic choice persists');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} catch (e) {
  check(false, String(e.message).split('\n')[0]);
} finally { await close(); }
