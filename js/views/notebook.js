import { getMistakes } from '../storage.js';
import { esc } from '../ui-esc.js';
import { h } from '../ui.js';
import { startChatWith } from './chat.js';

const SKILLS = { writing: '✍️ Writing', speaking: '🎤 Speaking', reading: '📖 Reading', listening: '🎧 Listening' };

export function render(container) {
  const mistakes = getMistakes();
  container.append(h('h2', {}, '📒 كشكول غلطاتي'));
  if (!mistakes.length) {
    container.append(h('div', { class: 'card' }, 'الكشكول فاضي… يا إما إنت عبقري، يا إما لسه مذاكرتش 😏 روح اعمل تمرين وتعالى.'));
    return;
  }
  const quiz = h('button', { id: 'quizme' }, '🧠 اختبرني في آخر 10 غلطات');
  quiz.addEventListener('click', () => {
    const lines = mistakes.slice(0, 10).map((m, i) => `${i + 1}. ${m.original} → ${m.correction}`).join('\n');
    startChatWith(`These are my recent mistakes:\n${lines}\n\nQuiz me on them one question at a time (new sentences, not the same ones). Wait for my answer each time and correct me.`);
  });
  container.append(h('div', { class: 'card' }, h('p', {}, `عندك ${mistakes.length} غلطة متسجلة. راجعهم كل شوية عشان متكررهمش 💪`), quiz));

  const groups = {};
  for (const m of mistakes) (groups[m.skill] ||= []).push(m);
  for (const [skill, items] of Object.entries(groups)) {
    const card = h('div', { class: 'card' }, h('h3', {}, `${SKILLS[skill] || skill} (${items.length})`));
    const ul = h('ul', { class: 'mistakes' });
    ul.innerHTML = items.map((m) => `<li><div class="en"><span class="wrong">${esc(m.original)}</span> → <span class="right">${esc(m.correction)}</span></div><div>${esc(m.explanation)}</div><div class="muted">${esc(new Date(m.date).toLocaleDateString('ar-EG'))}</div></li>`).join('');
    card.append(ul);
    container.append(card);
  }
}
