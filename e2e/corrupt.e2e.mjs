import { openApp, check } from './harness.mjs';
const { page, errors, close } = await openApp({ storage: { 'ic.apiKey': 'K', 'ic.draft.writing2': '{broken', 'ic.chat': 'nope' }, hash: '#/writing2' });
try {
  await page.waitForSelector('#answer', { timeout: 3000 }).catch(() => {});
  check(await page.$('#answer') !== null, 'writing view renders with corrupt draft');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} finally { await close(); }
