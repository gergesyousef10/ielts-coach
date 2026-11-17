import { openApp, check } from './harness.mjs';
const fb = { overallBand: 6, criteria: { task: { band: 6, comment: 'تمام' } }, mistakes: [{ original: 'I am agree', correction: 'I agree', explanation: 'غلط' }], improvedVersion: 'Better.', tutorMessage: 'يا سلام عليك' };
const { page, calls, errors, close } = await openApp({
  storage: { 'ic.apiKey': 'K' }, hash: '#/writing2',
  replies: ['{"prompt":"Some people think X. Discuss."}', '```json\n' + JSON.stringify(fb) + '\n```', 'ماشي يا عم، بص...', { status: 429 }],
});
try {
  await page.click('#gen');
  await page.waitForFunction(() => document.querySelector('#question').value.includes('Discuss'));
  check(true, 'generated question');
  await page.fill('#answer', Array(260).fill('word').join(' ') + ' I am agree');
  await page.click('#correct');
  await page.waitForSelector('.mistakes li');
  check((await page.textContent('#feedback')).includes('I agree'), 'shows correction');
  check(calls[1].system_instruction.parts[0].text.includes('ماتسيبش ولا غلطة'), 'persona sent');
  const notebook = await page.evaluate(() => JSON.parse(localStorage.getItem('ic.mistakes')).length);
  check(notebook === 1, 'mistake saved to notebook');
  await page.fill('#followup', 'ليه؟');
  await page.press('#followup', 'Enter');
  await page.waitForSelector('.bubble.tutor');
  check((await page.textContent('.bubble.tutor')).includes('ماشي'), 'follow-up reply');
  await page.fill('#followup', 'تاني');
  await page.press('#followup', 'Enter');
  await page.waitForSelector('.error');
  check((await page.textContent('.error')).includes('الحد المجاني'), 'quota shows friendly message');
  await page.reload();
  check((await page.inputValue('#answer')).includes('I am agree'), 'draft survives reload');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} finally { await close(); }
