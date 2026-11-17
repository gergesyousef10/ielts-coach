import { getSettings, saveSettings } from '../storage.js';
import { h } from '../ui.js';

export function render(container) {
  const s = getSettings();
  const key = h('input', { type: 'password', id: 'apiKey', value: s.apiKey, placeholder: 'AIza...', autocomplete: 'off', class: 'en' });
  const model = h('input', { type: 'text', id: 'model', value: s.model, class: 'en' });
  const radio = (v, label) => h('label', {}, h('input', { type: 'radio', name: 'exam', value: v, checked: s.examType === v }), ' ', label);
  const readAloud = h('input', { type: 'checkbox', id: 'readAloud', checked: s.readAloud });
  const msg = h('p', { class: 'muted', id: 'saved' });

  container.append(
    h('h2', {}, '⚙️ الإعدادات'),
    h('div', { class: 'card' },
      h('h3', {}, '🔑 مفتاح Gemini المجاني'),
      h('ol', {},
        h('li', {}, 'افتح ', h('a', { href: 'https://aistudio.google.com/apikey', target: '_blank', rel: 'noopener' }, 'Google AI Studio'), ' وسجل بحساب جوجل.'),
        h('li', {}, 'دوس "Create API key" وانسخ المفتاح.'),
        h('li', {}, 'حطه هنا ودوس حفظ. المفتاح بيتحفظ على موبايلك بس، ومحدش غيرك يشوفه.')),
      key),
    h('div', { class: 'card' },
      h('h3', {}, '📝 نوع الامتحان'),
      h('div', { class: 'row' }, radio('academic', 'Academic'), radio('general', 'General Training'))),
    h('div', { class: 'card' },
      h('h3', {}, '🔊 الصوت'),
      h('label', {}, readAloud, ' اقرأ كل ردود المدرس بصوت'),
      h('p', { class: 'muted' }, 'الممتحن في الـ Speaking بيتكلم بصوت دايمًا. الصوت العربي هو صوت موبايلك، فممكن ميبقاش مصري 😅')),
    h('div', { class: 'card' },
      h('h3', {}, '🤖 الموديل'),
      model,
      h('p', { class: 'muted' }, 'سيبه زي ما هو. لو جوجل غيرت الأسماء أو الحد المجاني خلص، جرب مثلًا gemini-flash-lite-latest.')),
    h('button', {
      id: 'save',
      onclick: () => {
        saveSettings({
          apiKey: key.value,
          model: model.value.trim() || 'gemini-flash-latest',
          examType: container.querySelector('input[name=exam]:checked')?.value || 'academic',
          readAloud: readAloud.checked,
        });
        msg.textContent = 'اتحفظ ✅ يلا بينا نذاكر!';
      },
    }, 'حفظ'),
    msg,
  );
}
