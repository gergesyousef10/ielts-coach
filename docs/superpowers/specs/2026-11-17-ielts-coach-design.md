# IELTS Coach (personal, free) — Design

Date: 2026-11-17

## Intent / why
The user is preparing for IELTS, can't afford paid prep sites like GoPrep, and loves the idea of an
AI that interacts with them, corrects every mistake, and explains in Arabic. This is a personal,
free study tool — not a product for other people and not a copy of any existing site.

## Goals
- AI tutor that corrects every mistake and explains it in Egyptian colloquial Arabic, with humor and real back-and-forth conversation.
- Covers all four skills for both Academic and General Training (toggle in settings).
- Costs nothing to run: free hosting + a free-tier AI API key.
- Works well on the user's iPhone (mobile-first).

## Non-goals
- No accounts, payments, or multi-user features.
- No copying of GoPrep's name, logo, design, or content; no official IELTS test material.

## Anti-goals
- Vague feedback ("good job") instead of line-by-line corrections.
- Anything that silently starts costing money.

## Approaches considered
1. **Free-tier AI API (e.g. Google Gemini) inside the site** — chosen. Full interactive experience at no cost; risk: free limits/terms can change.
2. Paid API (Claude etc.) — better quality but costs per use; rejected because cost is the main constraint.
3. No AI in the site, correction done in this chat — free but not the experience the user wants.

## Design
- **Static web app** (HTML/CSS/JS, no server), hosted free (Netlify or GitHub Pages).
- **API key**: the user pastes their own free key once; stored only in the browser (localStorage) on their phone.
- **Tools**
  1. Writing Task 2 — essay correction: band estimate per criterion, every mistake highlighted with the fix and an Arabic explanation, improved version.
  2. Writing Task 1 — Academic (chart description) or General (letter), same correction style.
  3. Speaking — examiner-style conversation (Parts 1/2/3). User speaks; audio is recorded and sent to the AI (or browser speech-to-text as fallback); AI replies, corrects grammar/vocab, gives band estimate.
  4. Reading — AI generates an original passage + IELTS-style questions; auto-graded with explanations.
  5. Listening — AI generates an original script + questions; the browser reads it aloud (text-to-speech); auto-graded.
  6. Mistakes notebook — every correction saved so the user can review recurring errors.
  7. Progress — history of band estimates per skill.
- **Language**: interface in Arabic + English; explanations in Arabic.
- **Tutor personality** (user request): talks in Egyptian colloquial Arabic (عامية), funny and
  friendly, real back-and-forth chat (the user can argue, ask "ليه؟", joke back). Jokes never replace
  the correction: every mistake is still pointed out clearly.
  - Practice content (essays, reading, listening, speaking questions) stays in English, as in the exam.
  - Speaking: the examiner part runs in English like the real test; feedback afterwards is in عامية.
  - Voice (free, browser text-to-speech): the English examiner always speaks aloud; tutor replies in
    عامية are text with a 🔊 button, plus a setting "اقرأ كل الردود بصوت" (default off). Arabic device
    voices aren't Egyptian — accepted by the user.
  - A free "دردش مع المدرس" chat for any question (grammar, vocab, tips) in عامية.

## Left to the builder
- Exact free-tier model/limits (verify current terms before building).
- Visual style (original, clean, mobile-first).
- Whether iPhone Safari audio recording or speech-to-text works better for Speaking (test both).
