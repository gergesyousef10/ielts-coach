import { openApp, check } from './harness.mjs';

const mistakes = [
  { original: 'I am agree', correction: 'I agree', explanation: 'x', skill: 'writing', date: '2026-11-17T10:00:00Z' },
  { original: 'peoples', correction: 'people', explanation: 'y', skill: 'speaking', date: '2026-11-16T10:00:00Z' },
];
const results = [
  { skill: 'writing2', band: 6.5, date: '2026-11-17T10:00:00Z' },
  { skill: 'writing2', band: 6, date: '2026-11-16T10:00:00Z' },
  { skill: 'reading', band: 7, date: '2026-11-15T10:00:00Z' },
];

const { page, calls, errors, close } = await openApp({
  storage: { 'ic.apiKey': 'K', 'ic.mistakes': JSON.stringify(mistakes), 'ic.results': JSON.stringify(results) },
  hash: '#/notebook',
  replies: ['تمام، السؤال الأول: ...', 'أهلا يا باشا 😄'],
});

try {
  await page.waitForSelector('.mistakes li', { timeout: 5000 });
  check((await page.$$('.mistakes li')).length === 2, 'notebook lists 2 mistakes');
  await page.click('#quizme');
  await page.waitForSelector('.bubble.tutor', { timeout: 5000 });
  check(calls[0].contents[0].parts[0].text.includes('I am agree'), 'quiz sends mistakes to chat');

  await page.goto(page.url().replace(/#.*/, '#/progress'));
  await page.waitForSelector('[data-skill="writing2"]', { timeout: 5000 });
  check((await page.textContent('[data-skill="writing2"]')).includes('6.5'), 'progress latest band');
  check(await page.isVisible('[data-skill="writing2"] svg'), 'progress chart');

  await page.goto(page.url().replace(/#.*/, '#/chat'));
  await page.fill('#msg', 'hello');
  await page.press('#msg', 'Enter');
  // the chat may already hold the quiz exchange from this session, so wait for the new reply text itself
  await page.waitForFunction(() => document.querySelector('.bubbles').textContent.includes('يا باشا'), null, { timeout: 5000 });
  check((await page.textContent('.bubbles')).includes('يا باشا'), 'chat reply');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} catch (e) {
  check(false, String(e.message).split('\n')[0]);
} finally {
  await close();
}
