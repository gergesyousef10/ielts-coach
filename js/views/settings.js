import { getSettings, saveSettings } from '../storage.js';
import { h } from '../ui.js';
import { loadVoices, voicesFor, voiceQuality, speak } from '../voice.js';

export function render(container) {
  const s = getSettings();
  const key = h('input', { type: 'password', id: 'apiKey', value: s.apiKey, placeholder: 'AIza...', autocomplete: 'off', class: 'en' });
  const model = h('input', { type: 'text', id: 'model', value: s.model, class: 'en' });
  const radio = (v, label) => h('label', {}, h('input', { type: 'radio', name: 'exam', value: v, checked: s.examType === v }), ' ', label);
  const readAloud = h('input', { type: 'checkbox', id: 'readAloud', checked: s.readAloud });
  const msg = h('p', { class: 'muted', id: 'saved' });

  function voiceRow(kind, label, sample) {
    const sel = h('select', { id: `voice-${kind}` }, h('option', { value: '' }, '⭐ تلقائي (أحسن صوت موجود)'));
    const test = h('button', { type: 'button', class: 'secondary', id: `test-${kind}` }, '▶️ جرّب');
    loadVoices().then((voices) => {
      const list = voicesFor(voices, kind === 'en' ? 'en-GB' : 'ar-EG');
      for (const v of list) {
        const star = voiceQuality(v) >= 3 ? ' ✨' : '';
        sel.append(h('option', { value: v.name, selected: v.name === (kind === 'en' ? s.voiceEn : s.voiceAr) }, `${v.name} (${v.lang})${star}`));
      }
      if (!list.length) sel.append(h('option', { value: '', disabled: true }, 'مفيش أصوات للغة دي على الجهاز 😕'));
    });
    test.addEventListener('click', () => {
      // save the choice first so speak() uses it
      saveSettings({ [kind === 'en' ? 'voiceEn' : 'voiceAr']: sel.value });
      speak(sample, kind === 'en' ? 'en-GB' : 'ar');
    });
    return h('div', { class: 'q' }, h('b', {}, label), h('div', { class: 'row' }, sel, test));
  }

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
      voiceRow('en', '🇬🇧 صوت الممتحن (English)', 'Hello! Let us practise IELTS speaking together.'),
      voiceRow('ar', '🇪🇬 صوت المدرس (عربي)', 'أهلا يا بطل، يلا نذاكر سوا'),
      h('p', { class: 'muted' }, 'الأصوات دي جاية من جهازك. لو كلها وحشة: على الماك افتح System Settings ← Accessibility ← Spoken Content ← System Voice ← Manage Voices، ونزّل صوت مكتوب جنبه Premium أو Enhanced (إنجليزي وعربي)، وبعدين اقفل المتصفح وافتحه تاني. على الآيفون: Settings ← Accessibility ← Spoken Content ← Voices.')),
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
          voiceEn: container.querySelector('#voice-en')?.value || '',
          voiceAr: container.querySelector('#voice-ar')?.value || '',
        });
        msg.textContent = 'اتحفظ ✅ يلا بينا نذاكر!';
      },
    }, 'حفظ'),
    msg,
  );
}
