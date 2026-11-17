import { openApp, check } from './harness.mjs';
const { page, errors, close } = await openApp();
try {
  check(page.url().endsWith('#/settings'), 'no key -> lands on settings');
  await page.fill('#apiKey', 'TESTKEY');
  await page.check('input[value=general]');
  await page.check('#readAloud');
  await page.click('#save');
  await page.reload();
  await page.goto(page.url().replace(/#.*/, '#/settings'));
  check(await page.inputValue('#apiKey') === 'TESTKEY', 'key persists after reload');
  check(await page.isChecked('input[value=general]'), 'exam type persists');
  check(await page.isChecked('#readAloud'), 'readAloud persists');
  check(errors.length === 0, 'no page errors: ' + errors.join(' | '));
} finally { await close(); }
