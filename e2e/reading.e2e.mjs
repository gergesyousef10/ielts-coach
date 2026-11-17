import { openApp, check } from './harness.mjs';
const ex = { title: 'Bees', text: 'Bees live in London.\nThey make honey.', questions: [
  { id: 'q1', type: 'gap', question: 'Bees live in ____.', answer: 'London', explanation: 'السطر الأول' },
  { id: 'q2', type: 'tfng', question: 'Bees make jam.', answer: 'False', explanation: 'بيعملوا عسل' },
  { id: 'q3', type: 'mcq', question: 'What do they make?', options: ['milk', 'honey'], answer: 'honey', explanation: 'honey' },
] };
for (const kind of ['reading', 'listening']) {
  const { page, errors, close } = await openApp({ storage: { 'ic.apiKey': 'K' }, hash: '#/' + kind, replies: [JSON.stringify(ex), 'not json at all'] });
  try {
    await page.click('#gen');
    await page.waitForSelector('#questions');
    check(await page.isHidden('#passage') === (kind === 'listening'), `${kind}: passage visibility`);
    await page.fill('input[name=q_q1]', ' london ');
    await page.check('input[name=q_q2][value=True]');
    await page.check('input[name=q_q3][value=honey]');
    await page.click('#check');
    await page.waitForSelector('#score');
    check((await page.textContent('#score')).includes('2/3'), `${kind}: score 2/3`);
    check(await page.isVisible('#passage'), `${kind}: transcript shown after grading`);
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('ic.mistakes')).length);
    check(m === 1, `${kind}: wrong answer saved`);
    await page.click('#gen');
    await page.waitForSelector('.error');
    check((await page.textContent('.error')).includes('رد غريب'), `${kind}: invalid AI JSON -> friendly error`);
    check(errors.length === 0, `${kind}: no page errors: ` + errors.join(' | '));
  } finally { await close(); }
}
