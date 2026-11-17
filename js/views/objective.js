import { askTutor } from '../ai.js';
import { addMistakes, addResult } from '../storage.js';
import { grade, estimateBand } from '../grading.js';
import { speak, stopSpeaking } from '../voice.js';
import { h, busy, tutorBubble } from '../ui.js';

export function renderObjective(container, kind) {
  const isListening = kind === 'listening';
  const area = h('div', { id: 'exercise' });
  const genBtn = h('button', { id: 'gen' }, isListening ? '🎧 اديني تمرين Listening' : '📖 اديني قطعة Reading');

  genBtn.addEventListener('click', () => busy(genBtn, container, async () => {
    const ex = await askTutor({ mode: kind, json: true, messages: [{ role: 'user', text: 'New exercise please.' }] });
    if (!Array.isArray(ex.questions) || !ex.text) throw Object.assign(new Error('bad exercise'), { kind: 'bad_response' });
    showExercise(ex);
  }));

  function showExercise(ex) {
    stopSpeaking();
    area.replaceChildren();
    let plays = 0;
    const textBox = h('div', { class: 'card en', id: 'passage', hidden: isListening },
      h('h3', {}, ex.title || ''), ...String(ex.text).split(/\n+/).map((p) => h('p', {}, p)));
    if (isListening) {
      const play = h('button', { id: 'play' }, '▶️ شغّل (مرتين بس زي الامتحان)');
      play.addEventListener('click', () => {
        if (plays >= 2) { play.disabled = true; return; }
        plays++;
        speak(ex.text, 'en-GB');
        if (plays >= 2) play.textContent = '✋ خلاص سمعتها مرتين';
      });
      area.append(h('div', { class: 'card' }, h('h3', { class: 'en' }, ex.title || 'Listening'), play,
        h('p', { class: 'muted' }, 'اسمع وجاوب. النص هيظهر بعد التصحيح.')));
    }
    area.append(textBox);

    const form = h('div', { class: 'card en', id: 'questions' });
    ex.questions.forEach((q, i) => {
      const name = `q_${q.id ?? i}`;
      q.id = String(q.id ?? i);
      let field;
      if (q.type === 'mcq' && Array.isArray(q.options)) {
        field = h('div', {}, ...q.options.map((o) => h('label', { style: 'display:block' }, h('input', { type: 'radio', name, value: o }), ' ', o)));
      } else if (q.type === 'tfng') {
        const opts = /yes|no/i.test(q.answer) ? ['Yes', 'No', 'Not Given'] : ['True', 'False', 'Not Given'];
        field = h('div', { class: 'row' }, ...opts.map((o) => h('label', {}, h('input', { type: 'radio', name, value: o }), ' ', o)));
      } else {
        field = h('input', { type: 'text', name, autocomplete: 'off' });
      }
      form.append(h('div', { class: 'q', 'data-q': q.id }, h('b', {}, `${i + 1}. `), q.question, field));
    });
    const check = h('button', { id: 'check' }, '✅ صحّحلي');
    form.append(check);
    area.append(form);

    check.addEventListener('click', () => {
      const answers = {};
      ex.questions.forEach((q, i) => {
        const name = `q_${q.id ?? i}`;
        const el = form.querySelector(`input[name="${name}"]:checked`) || form.querySelector(`input[type=text][name="${name}"]`);
        answers[q.id] = el ? el.value : '';
      });
      const r = grade(ex.questions, answers);
      for (const res of r.results) {
        const box = form.querySelector(`[data-q="${CSS.escape(res.id)}"]`);
        box.classList.remove('ok', 'no');
        box.classList.add(res.ok ? 'ok' : 'no');
        box.querySelector('.why')?.remove();
        box.append(h('div', { class: 'why', dir: 'rtl' },
          res.ok ? '✅ صح' : `❌ الإجابة: ${res.expected}`, h('br'), res.explanation));
      }
      const band = estimateBand(r.correct, r.total);
      addResult(kind, band);
      addMistakes(kind, r.results.filter((x) => !x.ok).map((x) => {
        const q = ex.questions.find((qq) => qq.id === x.id);
        return { original: `${q.question} → ${x.given || '(فاضي)'}`, correction: x.expected, explanation: x.explanation };
      }));
      textBox.hidden = false;
      check.disabled = true;
      const msg = r.correct === r.total ? `${r.correct}/${r.total}! إيه ده يا وحش 🔥 band ${band} تقريبًا`
        : r.correct >= r.total / 2 ? `${r.correct}/${r.total}، مش بطال خالص 👌 band ${band} تقريبًا. بص على الغلطات تحت.`
          : `${r.correct}/${r.total}… معلش يا بطل 😅 band ${band} تقريبًا. اقرا الشرح وهتفهم.`;
      area.prepend(h('div', { class: 'card', id: 'score' }, tutorBubble(msg)));
      area.scrollIntoView({ behavior: 'smooth' });
    });
  }

  container.append(
    h('h2', {}, isListening ? '🎧 Listening' : '📖 Reading'),
    h('div', { class: 'card' }, h('p', {}, isListening
      ? 'هيتولد تمرين جديد، وموبايلك هيقراه بصوت إنجليزي. جاوب على الأسئلة ودوس صحّحلي.'
      : 'هيتولد قطعة جديدة وأسئلة زي الامتحان. اقرا وجاوب ودوس صحّحلي.'), genBtn),
    area,
  );
}
