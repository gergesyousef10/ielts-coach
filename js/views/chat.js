import { askTutor } from '../ai.js';
import { h, busy, tutorBubble, myBubble } from '../ui.js';

// History lives for the browser session so leaving the tab and coming back keeps the chat.
const KEY = 'ic.chat';
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } };
const save = (hist) => sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-40)));

/** Opens the chat with a first message sent automatically (used by the notebook quiz). */
export function startChatWith(text) {
  sessionStorage.setItem('ic.chatSeed', text);
  location.hash = '#/chat';
}

export function render(container) {
  const history = load();
  const list = h('div', { class: 'bubbles' });
  const input = h('input', { type: 'text', id: 'msg', placeholder: 'اسأل أي حاجة، أو اتكلم معايا إنجليزي وأنا أصححلك...' });
  const send = h('button', { id: 'send' }, 'ابعت');
  const clear = h('button', { class: 'secondary' }, '🧹 محادثة جديدة');
  const card = h('div', { class: 'card' }, list, h('div', { class: 'row' }, input, send));

  list.append(tutorBubble('أهلا يا بطل 👋 أنا الأستاذ. اسألني في الجرامر، الكلمات، نصايح الامتحان، أو كلمني إنجليزي وأنا أطلّعلك غلطاتك واحدة واحدة 😄'));
  for (const m of history) list.append(m.role === 'user' ? myBubble(m.text) : tutorBubble(m.text));

  const ask = (text, shown = text) => {
    list.append(myBubble(shown));
    history.push({ role: 'user', text });
    save(history);
    return busy(send, card, async () => {
      const reply = await askTutor({ mode: 'chat', messages: history.slice(-20) });
      history.push({ role: 'model', text: reply });
      save(history);
      list.append(tutorBubble(reply));
      list.lastChild.scrollIntoView({ behavior: 'smooth' });
    }).then(() => { if (history.at(-1)?.role === 'user') { history.pop(); save(history); } });
  };

  const go = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    ask(text);
  };
  send.addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  clear.addEventListener('click', () => { sessionStorage.removeItem(KEY); container.replaceChildren(); render(container); });

  container.append(h('div', { class: 'row' }, h('h2', {}, '💬 دردش مع المدرس'), clear), card);

  const seed = sessionStorage.getItem('ic.chatSeed');
  if (seed) {
    sessionStorage.removeItem('ic.chatSeed');
    ask(seed, '📒 اختبرني في غلطاتي');
  }
}
