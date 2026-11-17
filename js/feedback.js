import { esc } from './ui-esc.js';

const LABELS = {
  task: 'Task Response / Achievement', coherence: 'Coherence & Cohesion', vocabulary: 'Lexical Resource',
  grammar: 'Grammar', fluency: 'Fluency & Coherence', pronunciation: 'Pronunciation',
};

export function feedbackHtml(fb = {}) {
  const parts = [];
  if (fb.overallBand != null) parts.push(`<p>الـ Band المتوقع: <span class="band">${esc(fb.overallBand)}</span></p>`);
  if (fb.tutorMessage) parts.push(`<p class="tutor-msg">${esc(fb.tutorMessage)}</p>`);
  if (fb.criteria && typeof fb.criteria === 'object') {
    const items = Object.entries(fb.criteria).map(([k, c]) =>
      `<div><b class="en">${esc(LABELS[k] || k)}</b> <span class="band">${esc(c?.band ?? '-')}</span><br>${esc(c?.comment ?? '')}</div>`);
    parts.push(`<div class="criteria">${items.join('')}</div>`);
  }
  const mistakes = Array.isArray(fb.mistakes) ? fb.mistakes : [];
  if (mistakes.length) {
    parts.push(`<h3>غلطاتك (${mistakes.length}) 🔍</h3><ul class="mistakes">${mistakes.map((m) =>
      `<li><div class="en"><span class="wrong">${esc(m.original)}</span> → <span class="right">${esc(m.correction)}</span></div><div>${esc(m.explanation)}</div></li>`).join('')}</ul>`);
  } else {
    parts.push('<p>مفيش غلطات المرة دي! 🎉 إنت كده بتحرجني.</p>');
  }
  if (fb.improvedVersion) parts.push(`<h3>نسخة أحسن ✨</h3><div class="en card">${esc(fb.improvedVersion).replace(/\n/g, '<br>')}</div>`);
  return parts.join('\n');
}
