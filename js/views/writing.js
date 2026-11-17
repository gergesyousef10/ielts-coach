import { askTutor } from '../ai.js';
import { addMistakes, addResult } from '../storage.js';
import { feedbackHtml } from '../feedback.js';
import { h, busy, tutorBubble, myBubble } from '../ui.js';

const MIN = { 1: 150, 2: 250 };

function countWords(t) { return (t.trim().match(/\S+/g) || []).length; }

export function renderWriting(container, task) {
  const draftKey = `ic.draft.writing${task}`;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(draftKey)) || {}; } catch { saved = {}; }
  const question = h('textarea', { id: 'question', class: 'en', rows: 4, placeholder: 'اكتب السؤال هنا، أو دوس "اديني سؤال" 👇', style: 'min-height:90px' });
  question.value = saved.question || '';
  const answer = h('textarea', { id: 'answer', class: 'en', placeholder: 'Start writing your answer here...' });
  answer.value = saved.answer || '';
  const counter = h('span', { class: 'muted', id: 'count' });
  const out = h('div', { id: 'feedback' });
  const updateCount = () => {
    const n = countWords(answer.value);
    counter.textContent = `${n} كلمة ${n < MIN[task] ? `(المطلوب ${MIN[task]} على الأقل)` : '✅'}`;
  };
  const persist = () => localStorage.setItem(draftKey, JSON.stringify({ question: question.value, answer: answer.value }));
  answer.addEventListener('input', () => { updateCount(); persist(); });
  question.addEventListener('input', persist);
  updateCount();

  const genBtn = h('button', { class: 'secondary', id: 'gen' }, '🎲 اديني سؤال');
  genBtn.addEventListener('click', () => busy(genBtn, container, async () => {
    const r = await askTutor({ mode: `writing${task}-task`, json: true, messages: [{ role: 'user', text: 'Give me a new task please.' }] });
    question.value = r.prompt || '';
    persist();
  }));

  const correctBtn = h('button', { id: 'correct' }, '✅ صحّحلي');
  correctBtn.addEventListener('click', () => {
    if (countWords(answer.value) < 20) { out.replaceChildren(tutorBubble('اكتب حاجة الأول يا معلم 😄 مش هصحح ورقة فاضية!')); return; }
    busy(correctBtn, container, async () => {
      const essayMsg = `TASK QUESTION:\n${question.value || '(no question given)'}\n\nMY ANSWER:\n${answer.value}`;
      const fb = await askTutor({ mode: `writing${task}`, json: true, messages: [{ role: 'user', text: essayMsg }] });
      addMistakes('writing', fb.mistakes || []);
      if (fb.overallBand != null) addResult(`writing${task}`, fb.overallBand);
      out.innerHTML = `<div class="card">${feedbackHtml(fb)}</div>`;
      out.append(followUp(essayMsg, fb));
      out.scrollIntoView({ behavior: 'smooth' });
    });
  });

  container.append(
    h('h2', {}, task === 1 ? '📊 Writing Task 1' : '✍️ Writing Task 2'),
    h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', {}, 'السؤال'), genBtn), question),
    h('div', { class: 'card' }, answer, h('div', { class: 'row' }, counter, correctBtn)),
    out,
  );
}

function followUp(essayMsg, fb) {
  const history = [
    { role: 'user', text: essayMsg },
    { role: 'model', text: `My correction (JSON): ${JSON.stringify(fb)}` },
  ];
  const list = h('div', { class: 'bubbles' });
  const input = h('input', { type: 'text', placeholder: 'عندك سؤال أو مش مقتنع؟ قولّي...', id: 'followup' });
  const send = h('button', {}, 'ابعت');
  const wrap = h('div', { class: 'card' }, h('h3', {}, '💬 ناقش المدرس'), list, h('div', { class: 'row' }, input, send));
  const go = () => {
    const text = input.value.trim();
    if (!text) return;
    list.append(myBubble(text));
    history.push({ role: 'user', text });
    input.value = '';
    busy(send, wrap, async () => {
      const reply = await askTutor({ mode: 'chat', messages: history.slice(-20) });
      history.push({ role: 'model', text: reply });
      list.append(tutorBubble(reply));
    });
  };
  send.addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  return wrap;
}
