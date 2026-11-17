import { getResults } from '../storage.js';
import { h } from '../ui.js';

const NAMES = { writing2: '✍️ Writing Task 2', writing1: '📊 Writing Task 1', speaking: '🎤 Speaking', reading: '📖 Reading', listening: '🎧 Listening' };

function sparkline(bands) {
  const pts = [...bands].reverse(); // oldest -> newest
  const w = 300, hgt = 80, pad = 8;
  const step = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
  const y = (b) => hgt - pad - (b / 9) * (hgt - pad * 2);
  const coords = pts.map((b, i) => `${pad + i * step},${y(b)}`).join(' ');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
  svg.setAttribute('class', 'chart');
  svg.innerHTML = `<polyline fill="none" stroke="#0f4c5c" stroke-width="3" stroke-linejoin="round" points="${coords}"/>`
    + pts.map((b, i) => `<circle cx="${pad + i * step}" cy="${y(b)}" r="4" fill="#f2a541"/>`).join('');
  return svg;
}

export function render(container) {
  const results = getResults();
  container.append(h('h2', {}, '📈 تقدّمي'));
  if (!results.length) {
    container.append(h('div', { class: 'card' }, 'لسه مفيش درجات… الصفحة دي مستنياك تعمل أول تمرين 👀'));
    return;
  }
  for (const skill of Object.keys(NAMES)) {
    const items = results.filter((r) => r.skill === skill);
    if (!items.length) continue;
    const bands = items.slice(0, 10).map((r) => r.band);
    const best = Math.max(...items.map((r) => r.band));
    container.append(h('div', { class: 'card', 'data-skill': skill },
      h('h3', {}, NAMES[skill]),
      h('p', {}, 'آخر درجة: ', h('span', { class: 'band' }, String(items[0].band)), `  •  أحسن درجة: ${best}  •  عدد التمارين: ${items.length}`),
      sparkline(bands)));
  }
}
