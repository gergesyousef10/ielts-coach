import { getSettings, saveSettings } from '../storage.js';
import { h } from '../ui.js';
import { loadVoices, voicesFor, voiceQuality, speak } from '../voice.js';
import { listVoices, elevenFriendlyError } from '../eleven.js';

const SUGGESTED = {
  ar: [['x6fvBLXv9YxzoVJQ0wp6', 'Momen – مصري هادي ودافي (مقترح)'], ['PmRaqkJ2uk3Y9jrp9UjJ', 'Mawardy – شاب مصري'], ['NwMzeQCEU9Ecy3zXYTkV', 'Asmaa – بنت مصرية'], ['YwQu4f7UeJh7h0uWMnEn', 'Seham – ست مصرية']],
  en: [['lrivmCHEM3HUU4GFbeDS', 'Catherine – British (مقترح)'], ['tWZ6sbznORyzWaRkNJTg', 'Phil Smith – British']],
};
const MODELS = [['eleven_multilingual_v2', 'Multilingual v2 (أحسن جودة)'], ['eleven_flash_v2_5', 'Flash v2.5 (أسرع ونص التكلفة)'], ['eleven_v3', 'v3 (أكتر تعبير)']];

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

  function elevenCard() {
    const keyIn = h('input', { type: 'password', id: 'elevenKey', value: s.elevenKey, placeholder: 'sk_...', autocomplete: 'off', class: 'en' });
    const status = h('p', { class: 'muted', id: 'eleven-status' });
    const select = (kind) => {
      const current = kind === 'ar' ? s.elevenVoiceAr : s.elevenVoiceEn;
      const sel = h('select', { id: `eleven-${kind}` }, ...SUGGESTED[kind].map(([id, name]) => h('option', { value: id, selected: id === current }, name)));
      if (current && !SUGGESTED[kind].some(([id]) => id === current)) sel.append(h('option', { value: current, selected: true }, current));
      return sel;
    };
    const selAr = select('ar');
    const selEn = select('en');
    const model = h('select', { id: 'elevenModel' }, ...MODELS.map(([id, name]) => h('option', { value: id, selected: id === s.elevenModel }, name)));
    const tryBtn = (kind, sample) => {
      const b = h('button', { type: 'button', class: 'secondary', id: `try-eleven-${kind}` }, '▶️ جرّب');
      b.addEventListener('click', () => {
        saveSettings({ elevenKey: keyIn.value.trim(), elevenModel: model.value, [kind === 'ar' ? 'elevenVoiceAr' : 'elevenVoiceEn']: (kind === 'ar' ? selAr : selEn).value });
        speak(sample, kind === 'ar' ? 'ar' : 'en-GB');
      });
      return b;
    };
    const load = h('button', { type: 'button', class: 'secondary', id: 'eleven-load' }, '📥 هات الأصوات اللي في حسابي');
    load.addEventListener('click', async () => {
      status.textContent = 'بجيب الأصوات...';
      try {
        const voices = await listVoices({ apiKey: keyIn.value.trim() });
        for (const v of voices) {
          for (const [sel, kind] of [[selAr, 'ar'], [selEn, 'en']]) {
            if (![...sel.options].some((o) => o.value === v.id)) sel.append(h('option', { value: v.id }, `${v.name}${v.language ? ` (${v.language})` : ''}`));
          }
        }
        status.textContent = `تمام ✅ لقيت ${voices.length} صوت في حسابك، وضفتهم للقايمة.`;
      } catch (e) {
        status.textContent = elevenFriendlyError(e);
      }
    });
    return h('div', { class: 'card' },
      h('h3', {}, '🎙️ صوت طبيعي من ElevenLabs (اختياري)'),
      h('p', { class: 'muted' }, 'لو حطيت مفتاح ElevenLabs، كل الأصوات في الموقع هتطلع منه. ولو حصلت مشكلة أو الـ credits خلصت، هيرجع لصوت جهازك لوحده. الجملة اللي اتقرت مرة مش بتتدفع تاني لو سمعتها تاني في نفس الجلسة.'),
      h('ol', { class: 'muted' },
        h('li', {}, 'افتح ', h('a', { href: 'https://elevenlabs.io/app/settings/api-keys', target: '_blank', rel: 'noopener' }, 'صفحة API Keys'), ' ودوس Create API Key.'),
        h('li', {}, 'خلي الصلاحيات: Text to Speech بس (و Voices: Read لو عايز زرار "هات الأصوات")، وحط حد للـ credits.'),
        h('li', {}, 'لو الصوت مش شغال: افتح ', h('a', { href: 'https://elevenlabs.io/app/voice-library?search=Momen', target: '_blank', rel: 'noopener' }, 'Voice Library'), ' ودوس "Add to my voices" على الصوت.')),
      keyIn,
      h('div', { class: 'q' }, h('b', {}, '🇪🇬 صوت المدرس'), h('div', { class: 'row' }, selAr, tryBtn('ar', 'أهلا يا بطل! يلا بينا نذاكر، وماتقلقش، أنا هطلّعلك كل غلطة 😄'))),
      h('div', { class: 'q' }, h('b', {}, '🇬🇧 صوت الممتحن'), h('div', { class: 'row' }, selEn, tryBtn('en', "Good morning. Can you tell me your full name, please?"))),
      h('div', { class: 'q' }, h('b', {}, 'الموديل'), model),
      load, status);
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
    elevenCard(),
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
          elevenKey: container.querySelector('#elevenKey').value.trim(),
          elevenVoiceAr: container.querySelector('#eleven-ar').value,
          elevenVoiceEn: container.querySelector('#eleven-en').value,
          elevenModel: container.querySelector('#elevenModel').value,
        });
        msg.textContent = 'اتحفظ ✅ يلا بينا نذاكر!';
      },
    }, 'حفظ'),
    msg,
  );
}
