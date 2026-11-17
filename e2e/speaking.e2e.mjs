import { openApp, check } from './harness.mjs';
const fin = { overallBand: 5.5, mistakes: [{ original: 'I go yesterday', correction: 'I went yesterday', explanation: 'ماضي' }], tutorMessage: 'مش بطال!' };
const { page, calls, errors, close } = await openApp({
  storage: { 'ic.apiKey': 'K' }, hash: '#/speaking',
  replies: ['Hello, what is your name?', 'Nice. Where do you live?', JSON.stringify(fin)],
});
try {
  await page.click('[data-part="1"]');
  await page.waitForSelector('.bubble.tutor');
  check((await page.textContent('#conv')).includes('your name'), 'examiner asks');
  await page.fill('#say', 'My name is Ali. I go yesterday to Cairo.');
  await page.press('#say', 'Enter');
  await page.waitForFunction(() => document.querySelectorAll('.bubble.tutor').length === 2);
  await page.click('#finish');
  await page.waitForSelector('.mistakes li');
  check((await page.textContent('#feedback')).includes('I went yesterday'), 'speaking feedback shown');
  check(calls[2].contents.at(-1).parts[0].text === 'FINISH', 'FINISH sent');
  check(calls[2].generationConfig.responseMimeType === 'application/json', 'finish asks JSON');
  // mic unavailable in headless without permission -> falls back to text
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('denied')); });
  await page.click('#mic');
  await page.waitForFunction(() => document.querySelector('#mic').hidden);
  check((await page.textContent('#hint')).includes('الكيبورد'), 'mic denied -> keyboard hint');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} finally { await close(); }
