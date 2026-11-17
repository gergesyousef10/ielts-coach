import { friendlyError } from './gemini.js';
import { getSettings } from './storage.js';
import { speak, speakButton } from './voice.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function h(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
}

export function showError(container, err) {
  container.querySelectorAll('.error').forEach((x) => x.remove());
  const box = h('div', { class: 'error', role: 'alert' }, friendlyError(err));
  if (err?.kind === 'auth') box.append(' ', h('a', { href: '#/settings' }, 'افتح الإعدادات'));
  container.prepend(box);
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return box;
}

/** Run an async action with a busy button; shows friendly errors in `container`. */
export async function busy(button, container, fn) {
  const label = button.textContent;
  button.disabled = true;
  button.classList.add('loading');
  container.querySelectorAll('.error').forEach((x) => x.remove());
  try {
    return await fn();
  } catch (e) {
    console.error(e);
    showError(container, e);
    return undefined;
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = label;
  }
}

/** Tutor chat bubble (Arabic) with a speak button; auto-speaks if setting on. */
export function tutorBubble(text) {
  const b = h('div', { class: 'bubble tutor' }, text);
  b.append(speakButton(text, 'ar'));
  if (getSettings().readAloud) speak(text, 'ar');
  return b;
}

export function myBubble(text) { return h('div', { class: 'bubble me en' }, text); }
