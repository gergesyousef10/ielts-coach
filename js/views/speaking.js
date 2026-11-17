import { askTutor } from '../ai.js';
import { addMistakes, addResult } from '../storage.js';
import { feedbackHtml } from '../feedback.js';
import { startRecording } from '../recorder.js';
import { speak, speakButton } from '../voice.js';
import { h, busy, tutorBubble, myBubble } from '../ui.js';

export function render(container) {
  let history = [];
  let recorder = null;
  let micOff = false;

  const list = h('div', { class: 'bubbles', id: 'conv' });
  const input = h('input', { type: 'text', class: 'en', id: 'say', placeholder: 'Type your answer (or use the keyboard mic 🎙️)' });
  const send = h('button', { id: 'send' }, 'ابعت');
  const mic = h('button', { id: 'mic', class: 'secondary' }, '🎤 سجّل');
  const finish = h('button', { id: 'finish', class: 'secondary' }, '🏁 خلصت، قيّمني');
  const hint = h('p', { class: 'muted', id: 'hint' });
  const out = h('div', { id: 'feedback' });
  const session = h('div', { class: 'card', hidden: true },
    list, hint, h('div', { class: 'row' }, mic, input, send), h('div', { class: 'row' }, finish));

  const examinerBubble = (text) => {
    const b = h('div', { class: 'bubble tutor en' }, text);
    b.append(speakButton(text, 'en-GB'));
    speak(text, 'en-GB');
    return b;
  };

  const disableMic = (why) => {
    micOff = true;
    mic.hidden = true;
    hint.textContent = why + ' اكتب إجابتك، أو استخدم المايك اللي في الكيبورد 🎙️ وهو هيكتب كلامك.';
  };

  async function turn(msg) {
    history.push(msg);
    const reply = await askTutor({ mode: 'speaking', messages: history });
    history.push({ role: 'model', text: reply });
    list.append(examinerBubble(reply));
    list.lastChild.scrollIntoView({ behavior: 'smooth' });
  }

  const start = (part) => {
    history = [];
    list.replaceChildren();
    out.replaceChildren();
    session.hidden = false;
    const btn = container.querySelector(`[data-part="${part}"]`);
    busy(btn, container, () => turn({ role: 'user', text: `Let's practise IELTS Speaking Part ${part}. Please start.` }));
  };

  const sendText = () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    list.append(myBubble(text));
    busy(send, container, () => turn({ role: 'user', text }));
  };
  send.addEventListener('click', sendText);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });

  mic.addEventListener('click', async () => {
    if (micOff) return;
    if (!recorder) {
      try {
        recorder = await startRecording();
        mic.textContent = '⏹️ وقّف وابعت';
        mic.classList.remove('secondary');
      } catch {
        recorder = null;
        disableMic('المايك مش شغال هنا (أو مفيش إذن) 🙈');
      }
      return;
    }
    const audio = await recorder.stop();
    recorder = null;
    mic.textContent = '🎤 سجّل';
    mic.classList.add('secondary');
    list.append(myBubble('🎤 (إجابة صوتية)'));
    await busy(mic, container, async () => {
      try {
        await turn({ role: 'user', audio });
      } catch (e) {
        history.pop();
        if (e.kind === 'bad_response') disableMic('الـ AI مقدرش يسمع التسجيل ده 😕');
        throw e;
      }
    });
  });

  finish.addEventListener('click', () => {
    if (history.length < 3) { out.replaceChildren(tutorBubble('استنى بس، إنت لسه مقولتش حاجة 😂 جاوب على كام سؤال الأول.')); return; }
    busy(finish, container, async () => {
      const fb = await askTutor({ mode: 'speaking', json: true, messages: [...history, { role: 'user', text: 'FINISH' }] });
      addMistakes('speaking', fb.mistakes || []);
      if (fb.overallBand != null) addResult('speaking', fb.overallBand);
      out.innerHTML = `<div class="card">${feedbackHtml(fb)}</div>`;
      if (fb.tutorMessage) out.firstChild.prepend(speakButton(fb.tutorMessage, 'ar'));
      out.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const partBtn = (n, label) => {
    const b = h('button', { 'data-part': n }, label);
    b.addEventListener('click', () => start(n));
    return b;
  };

  container.append(
    h('h2', {}, '🎤 Speaking'),
    h('div', { class: 'card' },
      h('p', {}, 'الممتحن هيتكلم إنجليزي زي الامتحان بالظبط 🇬🇧 جاوب بصوتك أو اكتب، ولما تخلص دوس "خلصت" وأنا أقولك غلطاتك بالمصري.'),
      h('div', { class: 'row' }, partBtn(1, 'Part 1'), partBtn(2, 'Part 2'), partBtn(3, 'Part 3'))),
    session,
    out,
  );
}
