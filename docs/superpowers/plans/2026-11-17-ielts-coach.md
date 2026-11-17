# IELTS Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A free, personal, mobile-first IELTS study web app whose AI tutor corrects every mistake and chats in funny Egyptian colloquial Arabic.

**Architecture:** Static site (no server, no build step): `index.html` + vanilla ES modules. Pure logic (storage, Gemini client, prompt building, JSON parsing, grading) lives in small modules tested with `node:test`; views are thin DOM modules switched by a hash router. The user's own Gemini API key is stored in `localStorage` and sent directly from the browser to the Gemini REST API.

**Tech Stack:** HTML/CSS/vanilla JS (ES modules), Node 22 `node:test` for unit tests, Playwright (pre-installed) for one smoke test, Google Gemini REST API (`generateContent`), browser `MediaRecorder` and `speechSynthesis`.

**Spec:** `docs/superpowers/specs/2026-11-17-ielts-coach-design.md`

## Global Constraints

- Costs nothing: no paid services, no server; hosting must work as plain static files (GitHub Pages / Netlify).
- Original name and look ("IELTS Coach" / "مدرس الآيلتس"); nothing copied from GoPrep or official IELTS test material.
- Tutor talks in Egyptian colloquial Arabic (عامية), funny and friendly, real back-and-forth; jokes never replace a correction — every mistake is listed.
- Practice content (essays prompts, passages, questions, examiner turns) is in English; feedback/explanations in عامية.
- Exam type setting: `"academic"` | `"general"`, default `"academic"`.
- Gemini model is a setting, default `"gemini-flash-latest"` (free-tier Flash; user can change it if Google renames models).
- API key stored only in `localStorage` key `ic.apiKey`; never logged, never committed.
- Mobile-first, RTL for Arabic UI text, LTR for English practice text; must work in iPhone Safari.

## Review Focus

1. Free-tier quota hit (HTTP 429) → friendly عامية message ("الـ AI خد نفسه...حاول كمان دقيقة"), no crash, user's typed text not lost. Tested in Task 2.
2. Gemini returns JSON wrapped in ```json fences or with extra prose → still parsed; truly invalid → readable error, not blank screen. Tested in Task 3.
3. No API key set → every AI action routes the user to Settings with an explanation instead of failing. Tested in Task 4.
4. iPhone Safari records `audio/mp4`; if Gemini rejects it or mic permission is denied → fall back to text box (keyboard dictation works). Tested in Task 6.
5. Corrupt/old data in `localStorage` (invalid JSON) → app treats it as empty, doesn't crash. Tested in Task 1.

---

### Task 1: Project skeleton + storage

**Files:**
- Create: `index.html`, `styles.css`, `js/storage.js`, `package.json` (`"type": "module"`, script `"test": "node --test tests/"`), `.gitignore` (`node_modules`)
- Test: `tests/storage.test.js`

**Interfaces:**
- Produces (`js/storage.js`), all take optional `store = globalThis.localStorage`:
  - `getSettings(store) -> { apiKey: string, examType: "academic"|"general", model: string }`
  - `saveSettings(partial, store) -> Settings` (merges)
  - `addMistakes(skill: string, mistakes: {original, correction, explanation}[], store) -> void` (each saved with `skill`, `date` ISO string)
  - `getMistakes(store) -> Mistake[]` (newest first)
  - `addResult(skill: string, band: number, store) -> void`; `getResults(store) -> {skill, band, date}[]`
  - Keys: `ic.apiKey`, `ic.settings`, `ic.mistakes`, `ic.results`.

- [ ] **Step 1: Write failing tests** using an in-memory fake store (`{getItem,setItem,removeItem}` over a Map):
  - `defaults`: empty store → `{apiKey:"", examType:"academic", model:"gemini-flash-latest"}`
  - `saveSettings merges`: save `{examType:"general"}` then `{apiKey:"k"}` → both kept; apiKey stored under `ic.apiKey`.
  - `mistakes newest first`: two `addMistakes` calls → second batch first, each has `skill` and `date`.
  - `corrupt data`: `ic.mistakes = "{not json"` → `getMistakes()` returns `[]`.
  - `results`: `addResult("writing", 6.5)` → `getResults()[0].band === 6.5`.
- [ ] **Step 2:** `npm test` → FAIL (module not found).
- [ ] **Step 3:** Implement `js/storage.js`. Create `index.html` (lang="ar", dir="rtl", viewport meta, `<header>` with app name, `<nav>` links `#/writing2 #/writing1 #/speaking #/reading #/listening #/chat #/notebook #/progress #/settings`, `<main id="view">`, `<script type="module" src="js/app.js">`) and a mobile-first `styles.css` (original palette, `.en {direction:ltr;text-align:left}` for English blocks).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: project skeleton and local storage`.

**Voice addendum (applies to Tasks 1, 4, 5, 6, 8):** Settings gains `readAloud: boolean` (default `false`). Create `js/voice.js` exporting `speak(text, lang: "en-GB"|"ar")` (cancels current speech; picks first matching `speechSynthesis` voice; no-op if unsupported) and `speakButton(text, lang) -> HTMLButtonElement` (🔊). Every tutor reply bubble gets a `speakButton(..., "ar")`; if `readAloud` it auto-speaks. Speaking examiner turns always auto-speak in `"en-GB"`.

### Task 2: Gemini client

**Files:**
- Create: `js/gemini.js`
- Test: `tests/gemini.test.js`

**Interfaces:**
- Produces:
  - `class GeminiError extends Error { kind: "quota"|"auth"|"network"|"bad_response" }`
  - `async callGemini({ apiKey, model, system, messages, json = false, fetchImpl = fetch }) -> string`
    - `messages`: `{ role: "user"|"model", text?: string, audio?: { mimeType, base64 } }[]`
    - POST `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, header `x-goog-api-key: apiKey`, body `{ system_instruction:{parts:[{text:system}]}, contents:[{role, parts:[{text}|{inline_data:{mime_type,data}}]}], generationConfig: json ? {responseMimeType:"application/json"} : {} }`.
    - Returns `candidates[0].content.parts.map(p=>p.text).join("")`.
  - `friendlyError(err) -> string` (عامية message per kind).

- [ ] **Step 1: Failing tests** with a fake `fetchImpl`:
  - request URL contains model name and `:generateContent`; header has key; body has `system_instruction` and audio becomes `inline_data`.
  - 200 response → returns joined text.
  - 429 → throws `GeminiError` kind `"quota"`; 400/403 with "API key" → kind `"auth"`; fetch rejects → `"network"`; 200 without candidates → `"bad_response"`.
  - `friendlyError` returns a non-empty Arabic string for each kind.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: gemini client with friendly errors`.

### Task 3: Tutor persona, prompts, and response parsing

**Files:**
- Create: `js/persona.js`, `js/parse.js`
- Test: `tests/persona.test.js`, `tests/parse.test.js`

**Interfaces:**
- Produces (`js/persona.js`):
  - `TUTOR_PERSONA: string` — Egyptian colloquial, funny, friendly, answers back-and-forth, never skips a mistake, explains in عامية with English examples.
  - `buildPrompt(mode, examType) -> string` where `mode ∈ "writing1"|"writing2"|"speaking"|"reading"|"listening"|"chat"`. Every prompt = persona + mode instructions + exam type. JSON modes state the exact schema below.
  - Schemas:
    - writing: `{ overallBand:number, criteria:{ task:{band,comment}, coherence:{band,comment}, vocabulary:{band,comment}, grammar:{band,comment} }, mistakes:[{original,correction,explanation}], improvedVersion:string, tutorMessage:string }`
    - writing task generator: `{ prompt:string }` (Academic task 1 = describe data given as a text table; General = letter).
    - reading/listening: `{ title, text, questions:[{ id, type:"mcq"|"tfng"|"gap", question, options?:string[], answer:string, explanation:string }] }` (listening `text` is a spoken script).
    - speaking: plain text examiner turn in English; when the user sends `"FINISH"` reply JSON `{ overallBand, mistakes:[...], tutorMessage }`.
- Produces (`js/parse.js`): `parseJson(text) -> object` — strips ``` fences / leading prose, parses first `{...}` block; throws `GeminiError("bad_response")` if impossible.

- [ ] **Step 1: Failing tests:**
  - persona contains "عامية"-style instruction and the rule about never skipping mistakes (assert it includes the string `"ماتسيبش ولا غلطة"`).
  - `buildPrompt("writing2","general")` includes `"General Training"` and `"improvedVersion"`; `buildPrompt("reading","academic")` includes `"Academic"` and `"questions"`.
  - `buildPrompt("bogus")` throws.
  - `parseJson('```json\n{"a":1}\n```')` → `{a:1}`; `parseJson('Here you go: {"a":1} thanks')` → `{a:1}`; `parseJson("nope")` throws kind `"bad_response"`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: tutor persona, prompts, json parsing`.

### Task 4: Router, Settings view, shared AI helper

**Files:**
- Create: `js/app.js`, `js/views/settings.js`, `js/ai.js`
- Test: `tests/ai.test.js`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  - `js/ai.js`: `async askTutor({ mode, messages, json, deps = { getSettings, callGemini } }) -> string|object` — throws `GeminiError("auth")` with message about Settings if `apiKey` empty; parses JSON when `json`.
  - Each view module exports `render(container: HTMLElement) -> void`.
  - `js/app.js`: hash router mapping routes from Task 1 nav to views; default `#/writing2` (or `#/settings` if no key). Shows `friendlyError` in a `.error` box; on `auth` errors adds a link to `#/settings`.
  - Settings view: API key field (password type) with link to `https://aistudio.google.com/apikey` and a short عامية how-to; exam type radio; model text field; save button.

- [ ] **Step 1: Failing tests:** `askTutor` with empty key throws kind `"auth"` without calling `callGemini`; with key + `json:true` returns parsed object from a fake `callGemini` returning fenced JSON; passes `buildPrompt(mode, examType)` as `system`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement `ai.js`, router, settings view.
- [ ] **Step 4:** `npm test` → PASS; serve with `npx --yes http-server -p 8080 -c-1 .` and check in Playwright that `#/settings` saves the key and reload keeps it.
- [ ] **Step 5:** Commit `feat: router, settings, tutor helper`.

### Task 5: Writing Task 1 & Task 2 views

**Files:**
- Create: `js/views/writing.js` (exports `renderWriting(container, task: 1|2)`; routes `writing1`/`writing2` call it), `js/feedback.js`
- Test: `tests/feedback.test.js`

**Interfaces:**
- Produces: `feedbackHtml(fb: WritingFeedback) -> string` (escaped HTML: band, 4 criteria, mistakes list with ~~original~~ → correction + explanation, improved version in `.en`, tutorMessage) — reused by Speaking.
- Flow: "اديني سؤال" button → generator prompt; textarea (`.en`, word counter, min 150/250 hint); "صحح" → `askTutor` json → `feedbackHtml`, `addMistakes("writing", ...)`, `addResult("writing", overallBand)`. Below feedback, a reply box to argue/ask follow-ups (chat mode with essay + feedback as context).

- [ ] **Step 1: Failing tests:** `feedbackHtml` escapes `<script>` in user text; renders every mistake (3 in → 3 `<li>`); shows `overallBand`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS; Playwright smoke with `fetch` stubbed (route `generativelanguage.googleapis.com/**` to a canned response) shows feedback.
- [ ] **Step 5:** Commit `feat: writing practice with corrections`.

### Task 6: Speaking view

**Files:**
- Create: `js/views/speaking.js`, `js/recorder.js`
- Test: `tests/recorder.test.js`

**Interfaces:**
- Produces (`js/recorder.js`): `pickMimeType(isSupported: (t)=>boolean) -> string|null` preferring `"audio/webm"`, `"audio/mp4"`, `"audio/ogg"`; `async blobToBase64(blob) -> string`.
- Flow: choose Part 1/2/3 → examiner asks (English). User taps 🎤 to record (MediaRecorder) or types. Audio sent as `audio` message. "خلصت" sends `"FINISH"` → JSON → `feedbackHtml`, `addMistakes("speaking")`, `addResult("speaking")`. If mic denied, no supported type, or Gemini returns an error for audio → hide mic, show text box with hint "استخدم المايك اللي في الكيبورد".

- [ ] **Step 1: Failing tests:** `pickMimeType(t => t==="audio/mp4")` → `"audio/mp4"`; nothing supported → `null`; `blobToBase64(new Blob(["hi"]))` → `"aGk="`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS; Playwright smoke (stubbed API, text mode) runs one exchange + FINISH.
- [ ] **Step 5:** Commit `feat: speaking practice`.

### Task 7: Reading & Listening views + grading

**Files:**
- Create: `js/grading.js`, `js/views/reading.js`, `js/views/listening.js`
- Test: `tests/grading.test.js`

**Interfaces:**
- Produces: `grade(questions, answers: Record<id,string>) -> { correct:number, total:number, results:{ id, ok:boolean, expected, given, explanation }[] }` — case/space-insensitive; `tfng` accepts "T"/"F"/"NG" short forms; `estimateBand(correct, total) -> number` (linear map to 0–9 in 0.5 steps).
- Reading: generate passage → render passage (`.en`) + questions → "صحح" → grade, show explanations, wrong answers saved as mistakes, `addResult("reading", band)`.
- Listening: same, but `text` hidden; ▶️ plays via `speechSynthesis` (`lang:"en-GB"`, rate 0.95), plays allowed twice; after grading, transcript is shown.

- [ ] **Step 1: Failing tests:** `" London "` vs `"london"` ok; `"NG"` vs `"Not Given"` ok; wrong answer not ok and returns explanation; `estimateBand(0,10)===0`, `estimateBand(10,10)===9`, `estimateBand(7,10)===6.5`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS; Playwright smoke for reading with stubbed API.
- [ ] **Step 5:** Commit `feat: reading and listening practice`.

### Task 8: Chat, Mistakes notebook, Progress

**Files:**
- Create: `js/views/chat.js`, `js/views/notebook.js`, `js/views/progress.js`

**Interfaces:**
- Consumes: `askTutor`, `getMistakes`, `getResults`.
- Chat: message list + input, history kept in memory for the session (last 20 turns sent).
- Notebook: mistakes grouped by skill, newest first, with "اختبرني فيهم" button that sends the last 10 mistakes to chat mode for a mini quiz.
- Progress: per skill, latest band, best band, simple inline-SVG line of last 10 results; empty state in عامية.

- [ ] **Step 1:** Playwright smoke: seed `localStorage` with 2 mistakes and 3 results → notebook lists 2, progress shows latest band; chat sends a message and shows the stubbed reply.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS, plus `npm test`.
- [ ] **Step 5:** Commit `feat: tutor chat, mistakes notebook, progress`.

### Task 9: Real-API check, README, deploy guide

**Files:**
- Create: `README.md` (Arabic: how to get a free Gemini key, how to open the site, how to publish on GitHub Pages/Netlify Drop)

- [ ] **Step 1:** Full `npm test` + all Playwright smokes pass.
- [ ] **Step 2:** If the session network allows `generativelanguage.googleapis.com` and the user provides a key via a secure route, run one real Writing correction; otherwise note it as untested and ask the user to try it on their phone.
- [ ] **Step 3:** Commit `docs: readme and deploy guide`.
