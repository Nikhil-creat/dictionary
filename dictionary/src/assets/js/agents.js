// Interactive agent pipeline: router -> retriever -> specialist -> validator, with a visible trace.
// Retrieval and validation run for real in the browser. The specialist drafts from retrieved facts; if a Groq/Gemini key
// is present (or the backend is configured) an LLM drafts instead, and the validator then checks that draft sentence by sentence.
import { NAMES, LM, LM_ORDER, findName, suggest, norm } from './names-data.js';
import { lookupWord, esc, sleep, clean } from './lexicon.js';
import * as bot from './bot.js';

const $ = (s) => document.querySelector(s);
const TAU = 0.35; // grounding threshold: same default as the backend validator
const STOP = new Set('the a an of to and in is are was for on with as by it that this be or from at its'.split(' '));
const toks = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]{3,}/g)?.filter((t) => !STOP.has(t)) ?? [];

/** Share of a sentence's content words found in the retrieved chunks. */
export function support(sentence, chunks) {
  const t = toks(sentence); if (!t.length) return 1;
  const pool = new Set(chunks.flatMap((c) => toks(c)));
  return t.filter((x) => pool.has(x)).length / t.length;
}
const sentences = (s) => String(s).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 2);

function route(q) {
  const n = findName(q), s = !n && suggest(q);
  if (n) return { kind: 'name', why: `“${q}” matches the curated names lexicon`, name: n };
  if (s) return { kind: 'name', why: `closest curated name is “${s.t}” (edit distance ≤ 1)`, name: s, fuzzy: true };
  if (/^[A-Za-z][A-Za-z'-]{1,29}$/.test(q.trim())) return { kind: 'word', why: 'a single English token: sent to the lexicographer' };
  return { kind: 'chat', why: 'free-form question: sent to the conversation agent' };
}

async function retrieve(r, q) {
  if (r.kind === 'name') {
    const n = r.name;
    const chunks = [`${n.t}: ${n.origin}. Meaning: ${n.en}. ${n.note}`, ...LM_ORDER.filter((k) => n.gloss[k]).map((k) => `${n.t} in ${LM[k].n}: ${n.gloss[k]}`)];
    return { chunks, source: 'curated names lexicon', conf: n.conf };
  }
  if (r.kind === 'word') {
    const { data, err } = await lookupWord(q.trim());
    if (err) return { chunks: [], source: 'dictionaryapi.dev (Wiktionary-derived)', err };
    const chunks = data.meanings.flatMap((m) => m.defs.slice(0, 2).map((d) => `${q.trim()} (${m.pos}): ${d.definition}`));
    if (data.origin) chunks.push(`Origin of ${q.trim()}: ${data.origin}`);
    return { chunks, source: 'dictionaryapi.dev (Wiktionary-derived)' };
  }
  const hits = Object.values(NAMES).filter((n) => toks(q).some((t) => norm(n.t).includes(t) || toks(n.en).includes(t)));
  return { chunks: hits.slice(0, 3).map((n) => `${n.t}: ${n.en}. ${n.note}`), source: 'curated names lexicon' };
}

async function specialist(r, q, ret) {
  const ctx = ret.chunks.join('\n');
  if (bot.hasKeys() && ret.chunks.length) {
    try {
      const out = await bot.chat(`Using ONLY the facts below, answer: ${q}\n\nFACTS:\n${ctx}`, ctx, false);
      const text = out.text ?? '';
      if (text) return { text, mode: `LLM (${out.provider || 'configured provider'})` };
    } catch (e) { /* fall through to the deterministic drafter */ }
  }
  const head = r.kind === 'name' ? ret.chunks.slice(0, 1) : ret.chunks.slice(0, 3);
  return { text: head.join(' '), mode: 'deterministic drafter (no API key set)' };
}

const STEPS = ['Router', 'Retriever', 'Specialist agent', 'Validator'];
const card = (i) => `<li class="step" id="st${i}"><div class="step-n">${i + 1}</div><div><h3>${STEPS[i]}</h3><p class="muted" id="sd${i}">waiting…</p></div><span class="chip" id="sc${i}">idle</span></li>`;
const setStep = (i, state, text) => { $('#sd' + i).innerHTML = text; const c = $('#sc' + i); c.textContent = state; c.className = 'chip ' + (state === 'done' ? 'v' : state === 'running' ? 'c' : state === 'flagged' ? 'u' : ''); };

async function run(q) {
  q = clean(q); if (!q) return;
  $('#trace').innerHTML = STEPS.map((_, i) => card(i)).join(''); $('#answer').hidden = true;
  const t0 = performance.now(), lap = () => `${Math.round(performance.now() - t0)} ms`;

  setStep(0, 'running', 'classifying…'); await sleep(250);
  const r = route(q); setStep(0, 'done', `<b>${r.kind}</b>: ${esc(r.why)} · ${lap()}`);

  setStep(1, 'running', 'searching…'); await sleep(250);
  const ret = await retrieve(r, q);
  setStep(1, ret.chunks.length ? 'done' : 'flagged', ret.chunks.length ? `${ret.chunks.length} passage(s) from ${esc(ret.source)} · ${lap()}` : esc(ret.err || 'no passages found') + ' — nothing to ground an answer on');
  if (!ret.chunks.length) { setStep(2, 'flagged', 'skipped: refuses to answer without evidence'); setStep(3, 'flagged', 'no grounded claims'); show(q, 'Unverified / emerging usage', 'No evidence was retrieved, so the pipeline declines to invent an answer. Try the Lookup page or ask LexiBot with a key.', 0, 'unverified', []); return; }

  setStep(2, 'running', 'drafting…'); await sleep(250);
  const sp = await specialist(r, q, ret);
  setStep(2, 'done', `drafted with ${esc(sp.mode)} · ${lap()}`);

  setStep(3, 'running', 'checking each sentence against the evidence…'); await sleep(250);
  const rows = sentences(sp.text).map((s) => ({ s, p: support(s, ret.chunks) }));
  const score = rows.length ? rows.reduce((a, x) => a + x.p, 0) / rows.length : 0;
  const bad = rows.filter((x) => x.p < TAU);
  setStep(3, bad.length ? 'flagged' : 'done', `${rows.length - bad.length}/${rows.length} sentences supported (τ = ${TAU}) · score ${score.toFixed(2)} · ${lap()}`);
  show(q, bad.length ? 'Partly unverified' : (r.name?.conf === 'likely' ? 'Likely' : 'Grounded'), sp.text, score, bad.length ? 'unverified' : 'grounded', rows);
}

function show(q, tag, text, score, kind, rows) {
  $('#answer').hidden = false;
  $('#ans-tag').className = 'chip ' + (kind === 'grounded' ? 'v' : 'u'); $('#ans-tag').textContent = tag;
  $('#ans-score').textContent = score ? `grounding score ${score.toFixed(2)}` : '';
  $('#ans-text').innerHTML = rows.length ? rows.map((x) => `<span class="${x.p < TAU ? 'unsup' : ''}" title="support ${x.p.toFixed(2)}">${esc(x.s)}</span>`).join(' ') : esc(text);
}

const ex = ['Nikhil', 'Sriramoju', 'serendipity', 'Lakshmi', 'What does Chary mean?'];
$('#ex').innerHTML = ex.map((e) => `<button type="button" class="chip c" data-q="${esc(e)}">${esc(e)}</button>`).join('');
$('#ex').addEventListener('click', (e) => { const q = e.target.dataset?.q; if (q) { $('#aq').value = q; run(q); } });
$('#aform').addEventListener('submit', (e) => { e.preventDefault(); run($('#aq').value); });
$('#mode').textContent = bot.hasKeys() ? 'An LLM key is active: the specialist drafts with the model and the validator checks that draft.' : 'No LLM key set: the specialist drafts deterministically from retrieved facts. Add a free Groq or Gemini key on the Lookup page (⚙) in this tab to see the LLM path.';
