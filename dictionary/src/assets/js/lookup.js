// Lookup page: word + name search, semantic graph, spaced-repetition cards, LexiBot UI, voice/OCR/object scan.
import { LM, LM_ORDER, findName, suggest, numerology, norm } from './names-data.js';
import { clamp, esc, clean, ls, speak, lookupWord, syl, tagsFor, inflect } from './lexicon.js';
import * as bot from './bot.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const S = { q: '', word: null, names: null, nt: 0, tab: 'word', ai: {}, acc: 'US', focusLang: 'te' };
const pane = $('#pane');
const ICON_SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/></svg>';

function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2800); }
function setNet(on) { const n = $('#net'); n.className = on ? 'ok' : 'warn'; n.textContent = on ? '● online' : '● offline cache'; }
addEventListener('offline', () => setNet(false));
addEventListener('online', () => setNet(true));
const say = (t, l) => speak(t, l, toast);

/* ================= renderers ================= */
function paint() {
  $$('#tabs button').forEach((b) => { const on = b.dataset.tab === S.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  const nc = $('#nameCount');
  if (S.names) { nc.hidden = false; nc.textContent = S.names.filter((n) => n.hit || S.ai[n.raw.toLowerCase()]?.d).length + '/' + S.names.length; } else nc.hidden = true;
  const due = dueCards().length, cc = $('#cardCount'); cc.hidden = !due; cc.textContent = due;
  stopGraph();
  pane.innerHTML = S.tab === 'word' ? renderWord() : S.tab === 'name' ? renderNames() : S.tab === 'graph' ? renderGraphShell() : renderCards();
  if (S.tab === 'graph') startGraph();
}
const skel = '<div class="card skel"><i style="width:40%;height:34px"></i><i></i><i style="width:80%"></i><i style="width:60%"></i></div>';
const empty = (h, p) => `<div class="card empty"><h3>${h}</h3><p>${p}</p></div>`;

function renderWord() {
  const w = S.word;
  if (!w) return empty('Search any English word', 'Definitions, IPA with accent audio, register tags, inflections and a semantic graph — grounded in a Wiktionary-derived corpus. Try “serendipity”, or press / to focus the search.');
  if (w.loading) return skel;
  if (w.err) return `<div class="card"><h3><span class="chip u">Unverified</span></h3><p style="line-height:1.6">${esc(w.err)}</p><div class="row"><button class="btn" data-act="ai-word">Ask AI to explain (flagged unverified)</button></div>${aiBlock('w:' + S.q)}</div>`;
  const d = w.data, first = d.meanings[0];
  const allText = d.meanings.flatMap((m) => m.defs.map((x) => x.definition)).join(' ');
  const regs = [...new Set(tagsFor(allText).filter((t) => t[0] === 'reg').map((t) => t[1]))];
  const ipas = [...new Set(d.phonetics.map((p) => p.text).filter(Boolean))].slice(0, 3);
  const meanings = d.meanings.map((m) => `<section class="pos"><h4>${esc(m.pos)}</h4><ol>${m.defs.slice(0, 6).map((df) => `<li>${esc(df.definition)}${tagsFor(df.definition).map(([c, n]) => `<span class="chip ${c}" style="margin-left:6px">${esc(n)}</span>`).join('')}${df.example ? `<q>“${esc(df.example)}”</q>` : ''}</li>`).join('')}</ol>
    ${m.syn.length ? `<div class="row"><span class="note">Synonyms</span>${m.syn.slice(0, 10).map((s) => `<button class="chip syn" data-act="go" data-w="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
    ${m.ant.length ? `<div class="row"><span class="note">Antonyms</span>${m.ant.slice(0, 10).map((s) => `<button class="chip ant" data-act="go" data-w="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}</section>`).join('');
  const infl = first ? inflect(d.word.toLowerCase(), first.pos) : [];
  return `<div class="grid2"><div>
   <div class="card"><div class="hw"><strong>${esc(syl(d.word))}</strong><small>syllables ≈ rule-based</small></div>
    <div class="row">${ipas.map((i) => `<span class="ipa">${esc(i)}</span>`).join('')}
     <span class="seg" role="group" aria-label="Accent">${['US', 'UK', 'IN'].map((a) => `<button data-act="acc" data-a="${a}" class="${S.acc === a ? 'on' : ''}">${a === 'IN' ? 'India' : a}</button>`).join('')}</span>
     <button class="spk" data-act="play" aria-label="Play pronunciation">${ICON_SPK}</button></div>
    <div class="row">${(regs.length ? regs : ['Neutral']).map((r) => `<span class="chip reg">Register · ${esc(r)}</span>`).join('')}${first ? `<span class="chip">${esc(first.pos)}</span>` : ''}${w.offline ? '<span class="chip l">offline cache</span>' : ''}</div>
    ${meanings}</div></div>
   <aside>
    <div class="card"><h3>Etymology</h3>${d.origin ? `<p style="line-height:1.6">${esc(d.origin)}</p><span class="chip v">Grounded · corpus</span>` : '<p class="note">No etymology in the grounded corpus for this entry.</p><span class="chip u">Unverified / Emerging usage</span>'}
     <div class="row"><button class="btn sm" data-act="ai-word">Enrich with AI</button></div></div>
    ${infl.length ? `<div class="card"><h3>Inflections</h3><table class="tbl">${infl.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table><p class="note" style="margin-top:8px">Regular-rule forms only; irregulars aren’t detected.</p></div>` : ''}
    ${aiBlock('w:' + S.q)}
    <div class="card"><h3>Provenance</h3><p class="note">Source: dictionaryapi.dev (Wiktionary-derived, CC BY-SA). ${d.src.filter((u) => /^https:\/\//.test(u)).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="link">${esc(u.replace(/^https:\/\//, '').slice(0, 44))}</a>`).join(' · ')}</p></div>
   </aside></div>`;
}

function aiBlock(key) {
  const a = S.ai[key];
  if (!a) return '';
  if (a.loading) return skel;
  if (a.err) return `<div class="card"><h3>AI enrichment</h3><p class="note">${esc(a.err)}</p></div>`;
  const d = a.d, tr = d.translations || {};
  return `<div class="card"><h3>AI enrichment <span class="chip u" style="margin-left:6px">${a.status === 'grounded' ? 'Grounded · validated' : 'AI-generated · verify'}</span></h3>
   ${d.cefr ? `<p><span class="chip">CEFR ${esc(d.cefr)}</span></p>` : ''}${d.etymology ? `<p style="line-height:1.6;margin:8px 0">${esc(d.etymology)}</p>` : ''}
   ${Object.keys(tr).length ? `<table class="tbl">${Object.entries(tr).filter(([k]) => LM[k]).map(([k, v]) => `<tr><th scope="row">${esc(LM[k].n)}</th><td lang="${k}">${esc(v)}</td></tr>`).join('')}</table>` : ''}
   <p class="note" style="margin-top:8px">via ${esc(a.provider)}. ${a.status === 'grounded' ? 'Checked against the retrieval corpus.' : 'Not checked against the corpus.'}</p></div>`;
}

function renderNames() {
  if (!S.names) return empty('Search a name', 'Type any name — “Nikhil Chary Sriramoju”, “Arjun”, “Priya”, “Muhammad” — and see its origin, meaning and script in many languages, with a confidence tag on every claim.');
  const toks = S.names, i = Math.min(S.nt, toks.length - 1), tk = toks[i];
  const d = tk.hit || S.ai[tk.raw.toLowerCase()]?.d;
  const hits = toks.map((t) => t.hit).filter(Boolean);
  const summary = toks.length > 1 && hits.length ? `<div class="card"><h3>Full name</h3><div class="sum">${esc(toks.map((t) => t.raw).join(' '))} — <em>${hits.map((h) => esc(h.en.split(',')[0])).join(' · ')}</em></div><p class="note" style="margin-top:8px">${hits.length}/${toks.length} parts resolved from the curated lexicon. Open each part below for scripts, translations and confidence.</p></div>` : '';
  const tabs = toks.length > 1 ? `<div class="toks" role="group" aria-label="Name parts">${toks.map((t, j) => `<button data-act="tok" data-i="${j}" class="${j === i ? 'on' : ''}">${esc(t.raw)}</button>`).join('')}</div>` : '';
  let body = '';
  if (!d) {
    const sg = suggest(tk.raw), a = S.ai[tk.raw.toLowerCase()];
    body = `<div class="card"><h3><span class="chip u">Unverified</span> No curated entry for “${esc(tk.raw)}”</h3>${sg ? `<p style="margin-bottom:10px">Did you mean <button class="chip syn" data-act="go" data-w="${esc(sg.t)}">${esc(sg.t)}</button>?</p>` : ''}<p class="note">Rather than guess an etymology, the Dictionary flags it. ${bot.serverMode ? 'The server agent can propose an origin and translations and will mark them unverified unless the corpus supports them.' : 'With a Groq or Gemini key, LexiBot can propose an origin and translations — marked AI-generated.'}</p><div class="row"><button class="btn" data-act="ai-name">Resolve with AI</button></div>${a?.loading ? skel : ''}${a?.err ? `<p class="note" style="margin-top:8px">${esc(a.err)}</p>` : ''}</div>`;
  } else {
    const aiMade = !tk.hit, st = S.ai[tk.raw.toLowerCase()]?.status;
    const conf = aiMade ? (st === 'grounded' ? '<span class="chip v">Grounded · validated</span>' : '<span class="chip u">AI-generated · unverified</span>') : d.conf === 'verified' ? '<span class="chip v">Verified</span>' : '<span class="chip l">Likely</span>';
    const order = [S.focusLang, ...LM_ORDER.filter((x) => x !== S.focusLang)].filter((x) => LM[x] && (d.scripts?.[x] || d.gloss?.[x]));
    const num = numerology(tk.raw);
    body = `<div class="card"><div class="hw">${esc(d.t || tk.raw)}<small>${conf}</small></div>
     <p class="sum" style="margin:10px 0">“<em>${esc(d.en)}</em>”</p>
     <table class="tbl"><tr><th scope="row">Origin</th><td>${esc(d.origin)}</td></tr><tr><th scope="row">Family</th><td>${esc(d.fam || '—')}</td></tr></table>
     ${d.note ? `<p class="note" style="margin-top:10px">${esc(d.note)}</p>` : ''}
     ${d.parts ? `<div class="row">${d.parts.map((p) => `<span class="chip syn" style="cursor:default"><b lang="te">${esc(p.s)}</b> ${esc(p.t)} — ${esc(p.m)}</span>`).join('')}</div>` : ''}
     <div class="row"><button class="btn sm" data-act="ai-name">Add more languages with AI</button><button class="btn sm" data-act="save-name">Save to flashcards</button></div></div>
     <div class="card"><h3>Meaning &amp; script across languages</h3>${order.map((k) => `<div class="lrow ${k === S.focusLang ? 'f' : ''}"><div class="ln"><b>${esc(LM[k].n)}</b><small lang="${k}">${esc(LM[k].nat)}</small></div><div class="sc" lang="${k}">${esc(d.scripts?.[k] || '—')}</div><div class="gl" lang="${k}">${esc(d.gloss?.[k] || '—')}</div><button class="spk" data-act="say" data-t="${esc(d.scripts?.[k] || d.t)}" data-l="${LM[k].tts}" aria-label="Pronounce in ${esc(LM[k].n)}">${ICON_SPK}</button></div>`).join('')}
     <p class="note" style="margin-top:10px">Transliterations are conventional renderings; pronunciation uses your browser’s installed voices.</p></div>
     ${num ? `<div class="card"><h3>Numerology (cultural tradition)</h3><p class="sum">${num.sum} → <em>${num.n}</em> · ${esc(num.m)}</p><p class="note" style="margin-top:6px">Pythagorean letter-sum of “${esc(tk.raw)}”. A cultural curiosity, not science.</p></div>` : ''}`;
  }
  return summary + tabs + body;
}

/* ---------- flashcards (Leitner spaced repetition: 0, 1, 3, 7, 14 days) ---------- */
const hist = () => ls.get('dict:hist', []);
function addHist(k, t, back) {
  const h = hist(), id = k + ':' + t.toLowerCase();
  if (!h.find((x) => x.id === id)) { h.unshift({ id, k, t, back: String(back).slice(0, 200), box: 0, due: Date.now() }); ls.set('dict:hist', h.slice(0, 200)); }
}
const dueCards = () => hist().filter((c) => c.due <= Date.now());
let flipped = false;
function renderCards() {
  const h = hist(), due = dueCards();
  if (!h.length) return empty('No cards yet', 'Every word or name you look up joins your deck. Cards return on a spaced schedule: 0, 1, 3, 7 then 14 days.');
  if (!due.length) return `<div class="card empty"><h3>All caught up</h3><p>${h.length} cards in your deck. Come back later, or look up something new.</p></div>`;
  const c = due[0];
  return `<button class="card fc" data-act="flip" style="width:100%"><span>${esc(c.t)}<small>${c.k === 'name' ? 'name' : 'word'} · box ${c.box + 1}/5 · ${due.length} due</small>${flipped ? `<span style="display:block;font-size:16px;font-weight:400;margin-top:18px;line-height:1.5;color:var(--cy)">${esc(c.back)}</span>` : '<small>tap to reveal</small>'}</span></button>
   <div class="row center"><button class="btn" data-act="grade" data-g="0">Again</button><button class="btn" data-act="grade" data-g="1">Good</button></div>`;
}

/* ---------- semantic graph (force-directed, canvas) ---------- */
function graphData() {
  const nodes = [];
  if (S.word?.data) {
    const d = S.word.data; nodes.push({ l: d.word, t: 'c' });
    const seen = new Set([d.word]);
    for (const m of d.meanings) {
      m.syn.slice(0, 8).forEach((s) => { if (!seen.has(s)) { seen.add(s); nodes.push({ l: s, t: 's' }); } });
      m.ant.slice(0, 6).forEach((s) => { if (!seen.has(s)) { seen.add(s); nodes.push({ l: s, t: 'a' }); } });
    }
    return nodes;
  }
  if (S.names) {
    const tk = S.names[Math.min(S.nt, S.names.length - 1)], d = tk.hit || S.ai[tk.raw.toLowerCase()]?.d;
    if (!d) return null;
    nodes.push({ l: d.t || tk.raw, t: 'c' });
    (d.parts || []).forEach((p) => nodes.push({ l: p.t, t: 'n' }));
    Object.values(d.scripts || {}).forEach((v) => nodes.push({ l: v, t: 'n' }));
    return nodes;
  }
  return null;
}
function renderGraphShell() {
  if (!graphData()) return empty('Nothing to map yet', 'Look up a word to see its synonym and antonym network, or a name to see it fan out across scripts.');
  return '<div class="card"><h3>Semantic node graph</h3><canvas id="gcv" role="img" aria-label="Force-directed graph linking the headword to its synonyms, antonyms or scripts"></canvas><div class="row"><span class="chip">● headword</span><span class="chip syn">● synonym</span><span class="chip ant">● antonym</span><span class="chip l">● script / part</span><span class="note">Click a synonym or antonym to look it up.</span></div></div>';
}
let gRaf = 0;
function stopGraph() { cancelAnimationFrame(gRaf); gRaf = 0; }
function startGraph() {
  const cv = $('#gcv'); if (!cv) return;
  const nodes = graphData(); if (!nodes) return;
  const g = cv.getContext('2d'), dp = Math.min(devicePixelRatio || 1, 2), cw = cv.clientWidth, ch = cv.clientHeight;
  cv.width = cw * dp; cv.height = ch * dp; g.setTransform(dp, 0, 0, dp, 0, 0);
  nodes.forEach((n, i) => { const an = (i / nodes.length) * 6.283; n.x = cw / 2 + Math.cos(an) * (n.t === 'c' ? 0 : 120); n.y = ch / 2 + Math.sin(an) * (n.t === 'c' ? 0 : 120); n.vx = n.vy = 0; });
  const col = { c: '#ffffff', s: '#5ef0ff', a: '#ff4d8d', n: '#ffb86b' };
  let hov = -1;
  cv.onmousemove = (e) => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; hov = nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < (n.t === 'c' ? 26 : 16)); cv.style.cursor = hov > 0 && (nodes[hov].t === 's' || nodes[hov].t === 'a') ? 'pointer' : 'default'; };
  cv.onclick = () => { if (hov > 0 && (nodes[hov].t === 's' || nodes[hov].t === 'a')) search(nodes[hov].l); };
  (function tick() {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) { const b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy + 0.01, f = 2600 / d2, d = Math.sqrt(d2); dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; }
      if (i > 0) { const c = nodes[0], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - (a.t === 'a' ? 190 : 140)) * 0.012; a.vx += (dx / d) * k; a.vy += (dy / d) * k; }
      a.vx += (cw / 2 - a.x) * 0.0008; a.vy += (ch / 2 - a.y) * 0.0008;
    }
    for (const n of nodes) { n.vx *= 0.86; n.vy *= 0.86; n.x = clamp(n.x + n.vx, 30, cw - 30); n.y = clamp(n.y + n.vy, 24, ch - 24); }
    g.clearRect(0, 0, cw, ch);
    for (let i = 1; i < nodes.length; i++) { g.strokeStyle = i === hov ? 'rgba(255,255,255,.8)' : 'rgba(140,170,255,.25)'; g.beginPath(); g.moveTo(nodes[0].x, nodes[0].y); g.lineTo(nodes[i].x, nodes[i].y); g.stroke(); }
    nodes.forEach((n, i) => {
      const r = n.t === 'c' ? 24 : i === hov ? 14 : 10, gr = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.4);
      gr.addColorStop(0, col[n.t] + '66'); gr.addColorStop(1, 'transparent');
      g.fillStyle = gr; g.beginPath(); g.arc(n.x, n.y, r * 2.4, 0, 7); g.fill();
      g.fillStyle = col[n.t]; g.beginPath(); g.arc(n.x, n.y, r * 0.6, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = `${n.t === 'c' ? 600 : 500} ${n.t === 'c' ? 15 : 12}px Montserrat,"Noto Sans Telugu","Noto Sans Devanagari","Noto Sans Tamil","Noto Sans Arabic","Noto Sans JP","Noto Sans SC",sans-serif`; g.textAlign = 'center'; g.fillText(n.l, n.x, n.y - r - 6);
    });
    gRaf = requestAnimationFrame(tick);
  })();
}

/* ================= search flow ================= */
function setTab(t) { S.tab = t; paint(); }
async function search(raw) {
  const q = clean(raw);
  if (!q) return;
  S.q = q; $('#q').value = q;
  try { history.replaceState(null, '', '/lookup?q=' + encodeURIComponent(q)); } catch { /* ignore */ }
  const toks = q.split(' ').filter(Boolean).slice(0, 6);
  S.names = toks.map((t) => ({ raw: t, hit: findName(t) })); S.nt = 0;
  const anyHit = S.names.some((n) => n.hit);
  S.tab = anyHit || toks.length > 1 ? 'name' : 'word';
  S.word = null;
  if (toks.length === 1) {
    S.word = { loading: true }; paint();
    const r = await lookupWord(toks[0], setNet);
    if (S.q !== q) return;
    S.word = r;
    if (r.data) { addHist('word', r.data.word, r.data.meanings[0]?.defs[0]?.definition || ''); if (!anyHit) S.tab = 'word'; }
  }
  S.names.forEach((n) => { if (n.hit) addHist('name', n.hit.t, `${n.hit.en} — ${n.hit.origin}`); });
  paint();
}
$('#bar').addEventListener('submit', (e) => { e.preventDefault(); search($('#q').value); });
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTab(b.dataset.tab); });
$('#chips').innerHTML = ['Nikhil Chary Sriramoju', 'serendipity', 'Arjun', 'Priya', 'Muhammad', 'ephemeral', 'Sofia'].map((x) => `<button type="button">${esc(x)}</button>`).join('');
$('#chips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) search(b.textContent); });
addEventListener('keydown', (e) => { if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); } });

function playAcc() {
  const d = S.word?.data; if (!d) return;
  const re = { US: /-us\./i, UK: /-uk\./i, IN: /-in\./i }[S.acc], hit = d.phonetics.find((p) => p.audio && re.test(p.audio));
  const tts = () => say(d.word, { US: 'en-US', UK: 'en-GB', IN: 'en-IN' }[S.acc]);
  if (hit && /^https:\/\//.test(hit.audio)) new Audio(hit.audio).play().catch(tts); else tts();
}
pane.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  if (a === 'go') search(b.dataset.w);
  else if (a === 'acc') { S.acc = b.dataset.a; paint(); playAcc(); }
  else if (a === 'play') playAcc();
  else if (a === 'say') say(b.dataset.t, b.dataset.l);
  else if (a === 'tok') { S.nt = +b.dataset.i; paint(); }
  else if (a === 'ai-word') aiEnrichWord();
  else if (a === 'ai-name') aiResolveName();
  else if (a === 'save-name') { const tk = S.names[S.nt], d = tk.hit || S.ai[tk.raw.toLowerCase()]?.d; if (d) { addHist('name', d.t || tk.raw, `${d.en} — ${d.origin}`); toast('Saved to flashcards'); paint(); } }
  else if (a === 'flip') { flipped = !flipped; paint(); }
  else if (a === 'grade') { const c = dueCards()[0], h = hist(), x = h.find((y) => y.id === c.id), iv = [0, 1, 3, 7, 14]; if (b.dataset.g === '1') { x.box = Math.min(x.box + 1, 4); x.due = Date.now() + iv[x.box] * 864e5; } else { x.box = 0; x.due = Date.now() + 6e5; } ls.set('dict:hist', h); flipped = false; paint(); }
});

/* ================= LexiBot UI ================= */
function ctxJSON() {
  const o = { query: S.q };
  if (S.word?.data) { const d = S.word.data; o.word = { headword: d.word, ipa: d.phonetics[0]?.text, etymology: d.origin || null, senses: d.meanings.slice(0, 3).map((m) => ({ pos: m.pos, def: m.defs.slice(0, 2).map((x) => x.definition) })) }; }
  if (S.names) o.names = S.names.map((n) => (n.hit ? { name: n.hit.t, origin: n.hit.origin, meaning: n.hit.en, confidence: n.hit.conf } : { name: n.raw, unresolved: true }));
  return JSON.stringify(o).slice(0, 6000);
}
async function aiEnrichWord() {
  const w = S.word?.data?.word || S.q, key = 'w:' + S.q;
  S.ai[key] = { loading: true }; paint();
  try { const r = await bot.enrichWord(w, ctxJSON()); S.ai[key] = { d: r.d, provider: r.provider, status: r.status }; } catch (e) { S.ai[key] = { err: e.message }; }
  paint();
}
async function aiResolveName() {
  const tk = S.names[S.nt], k = tk.raw.toLowerCase();
  S.ai[k] = { loading: true }; paint();
  try { const r = await bot.resolveName(tk.raw, ctxJSON()); S.ai[k] = { d: r.d, provider: r.provider, status: r.status }; } catch (e) { S.ai[k] = { err: e.message }; }
  paint();
}
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
function pushMsg(cls, html, meta) { const d = document.createElement('div'); d.className = 'm ' + cls; d.innerHTML = html + (meta ? `<small>${esc(meta)}</small>` : ''); $('#bmsgs').appendChild(d); $('#bmsgs').scrollTop = 1e9; return d; }
function chips() {
  const s = bot.status(), g = $('#cG'), m = $('#cM');
  if (s.server) { g.textContent = 'Server · RAG'; g.className = 'chip v'; m.textContent = 'Groq ⇄ Gemini'; m.className = 'chip v'; return; }
  const f = (el, n, x) => { el.textContent = !x.on ? `${n} · off` : x.cooling ? `${n} · cooling` : x.model ? `${n} · ${x.model.slice(0, 22)}` : `${n} · detecting`; el.className = 'chip ' + (!x.on ? '' : x.cooling ? 'l' : 'v'); };
  f(g, 'Groq', s.groq); f(m, 'Gemini', s.gem);
}
async function botAsk(text) {
  const t = clean(text); if (!t) return;
  pushMsg('u', esc(t));
  const holder = pushMsg('a', '…'), ctx = ctxJSON(), long = ctx.length > 5000 || /^\/deep\b/i.test(t);
  try {
    const r = await bot.chat(t, ctx, long);
    holder.innerHTML = md(r.text) + `<small>${esc(r.provider)}${r.cached ? ' · cache' : ''}${long ? ' · long-context' : ''}</small>`;
  } catch (e) { holder.textContent = /Add a free/.test(e.message) ? e.message : 'LexiBot is rate-limited or offline: ' + e.message; }
  chips(); $('#bmsgs').scrollTop = 1e9;
}
function openBot(open) {
  const b = $('#bot'); b.classList.toggle('open', open); $('#botFab').setAttribute('aria-expanded', String(open));
  if (open && !$('#bmsgs').children.length) pushMsg('a', bot.serverMode ? 'Hi — I’m LexiBot. Answers are grounded in the retrieval corpus and validated; start with <b>/deep</b> for long-context analysis.' : bot.hasKeys() ? 'Hi — ask me about the word or name on screen. Start with <b>/deep</b> for long-context analysis on Gemini.' : 'Hi, I’m LexiBot. Add a free <b>Groq</b> and/or <b>Gemini</b> key under ⚙ — I’ll auto-detect the best free-tier model, use Groq for speed and fail over to Gemini on rate limits.');
  chips();
}
$('#botFab').addEventListener('click', () => openBot(!$('#bot').classList.contains('open')));
$('#bgear').addEventListener('click', () => $('#bset').classList.toggle('open'));
$('#bsave').addEventListener('click', async () => {
  bot.setKeys($('#kG').value, $('#kM').value); $('#kG').value = $('#kM').value = ''; chips(); toast('Detecting models…');
  await bot.detectAll(toast); chips(); $('#bset').classList.remove('open');
  const s = bot.status(); toast('Models bound: ' + ([s.groq.model && 'Groq', s.gem.model && 'Gemini'].filter(Boolean).join(' + ') || 'none'));
});
$('#bform').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#bin'), v = i.value; i.value = ''; botAsk(v); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') openBot(false); });
if (bot.serverMode) $('#bgear').hidden = true;
chips();
if (!bot.serverMode && bot.hasKeys()) bot.detectAll(toast).then(chips);

/* ================= voice, OCR, object recognition (all on-device) ================= */
const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load a vision library')); document.head.appendChild(s); });
$('#mic').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast('Voice search isn’t supported in this browser');
  const r = new SR(), b = $('#mic');
  r.lang = 'en-IN'; r.onstart = () => b.classList.add('rec'); r.onend = () => b.classList.remove('rec');
  r.onresult = (e) => search(e.results[0][0].transcript); r.onerror = () => toast('Couldn’t hear that'); r.start();
});
let fileMode = 'ocr';
$('#scan').addEventListener('click', () => { fileMode = 'ocr'; $('#file').click(); });
$('#obj').addEventListener('click', () => { fileMode = 'obj'; $('#file').click(); });
$('#file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const url = URL.createObjectURL(f); // stays in this tab's memory — never uploaded
  try {
    if (fileMode === 'ocr') {
      toast('Reading text on-device…');
      const T = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
      const w = await T.createWorker('eng'); const { data } = await w.recognize(f); await w.terminate();
      const words = (data.text.match(/[A-Za-zÀ-ɏ]{3,}/g) || []).sort((a, b) => b.length - a.length);
      if (!words[0]) return toast('No readable text found');
      toast('Found “' + words[0] + '”'); search(words[0]);
    } else {
      toast('Loading vision model…');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4/dist/tf.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2/dist/coco-ssd.min.js');
      const img = new Image(); img.src = url; await img.decode();
      const m = await window.cocoSsd.load(), p = await m.detect(img);
      if (!p.length) return toast('No object recognised');
      p.sort((a, b) => b.score - a.score); toast(`Detected ${p[0].class} (${Math.round(p[0].score * 100)}%)`); search(p[0].class);
    }
  } catch (err) { toast('Scan failed: ' + err.message); } finally { URL.revokeObjectURL(url); }
});

/* ================= boot ================= */
const params = new URLSearchParams(location.search);
const lang = params.get('lang'); if (lang && LM[lang]) S.focusLang = lang;
try { if (sessionStorage.getItem('dict:dive')) { sessionStorage.removeItem('dict:dive'); document.body.classList.add('dive-in'); } } catch { /* ignore */ }
if (norm(params.get('q') || '')) { search(params.get('q')); } else paint();
if (location.hash === '#bot') openBot(true);
