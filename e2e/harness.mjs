// Shared Playwright harness: serves the app with a tiny static server and stubs Gemini.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

export async function startServer() {
  const server = http.createServer(async (req, res) => {
    const p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^\/+/, '') || 'index.html';
    try {
      const data = await readFile(join(ROOT, p));
      res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404); res.end('nf'); }
  });
  await new Promise((r) => server.listen(0, r));
  return { server, url: `http://localhost:${server.address().port}/` };
}

/** replies: array of strings (or functions of request body) returned in order by the stubbed Gemini */
export async function openApp({ replies = [], storage = {}, hash = '', init = null } = {}) {
  const { server, url } = await startServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const calls = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
    const body = JSON.parse(route.request().postData());
    calls.push(body);
    const r = replies[calls.length - 1];
    if (r && typeof r === 'object' && r.status) return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify({ error: { message: r.message || 'err' } }) });
    const text = typeof r === 'function' ? r(body) : (r ?? 'OK');
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });
  await page.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, storage);
  if (init) await page.addInitScript(init);
  await page.goto(url + hash);
  const close = async () => { await browser.close(); server.close(); };
  return { page, calls, errors, close, url };
}

export function check(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('ok -', msg);
}
