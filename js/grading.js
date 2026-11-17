const TFNG = { t: 'true', true: 'true', f: 'false', false: 'false', ng: 'not given', 'not given': 'not given', notgiven: 'not given', y: 'yes', yes: 'yes', n: 'no', no: 'no' };

function norm(s) {
  const v = String(s ?? '').toLowerCase().replace(/[.,;:!?"']/g, '').replace(/\s+/g, ' ').trim();
  return TFNG[v] ?? v;
}

export function grade(questions, answers) {
  const results = (questions || []).map((q) => {
    const given = answers?.[q.id] ?? '';
    const ok = given !== '' && norm(given) === norm(q.answer);
    return { id: q.id, ok, expected: q.answer, given, explanation: q.explanation || '' };
  });
  return { correct: results.filter((r) => r.ok).length, total: results.length, results };
}

export function estimateBand(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 9 * 2) / 2;
}
