import { getSettings } from './storage.js';
import { stopSpeaking } from './voice.js';
import { h } from './ui.js';

const ROUTES = {
  writing2: () => import('./views/writing.js').then((m) => (c) => m.renderWriting(c, 2)),
  writing1: () => import('./views/writing.js').then((m) => (c) => m.renderWriting(c, 1)),
  speaking: () => import('./views/speaking.js').then((m) => m.render),
  reading: () => import('./views/reading.js').then((m) => m.render),
  listening: () => import('./views/listening.js').then((m) => m.render),
  chat: () => import('./views/chat.js').then((m) => m.render),
  notebook: () => import('./views/notebook.js').then((m) => m.render),
  progress: () => import('./views/progress.js').then((m) => m.render),
  settings: () => import('./views/settings.js').then((m) => m.render),
};

async function route() {
  stopSpeaking();
  let name = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (!ROUTES[name]) {
    name = getSettings().apiKey ? 'writing2' : 'settings';
    history.replaceState(null, '', '#/' + name);
  }
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#/' + name));
  document.querySelector('#tabs a.active')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  const view = document.getElementById('view');
  view.replaceChildren();
  try {
    const render = await ROUTES[name]();
    render(view);
  } catch (e) {
    console.error(e);
    view.append(h('div', { class: 'card' }, 'الصفحة دي لسه بتتجهز 🛠️'));
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
