// Site-wide LexiBot (every page except /lookup, which has its own). Retrieval runs in the browser over a build-time
// knowledge base (/assets/site-kb.json: every page + every credential). With AI available (Vercel /api proxy or the
// visitor's own free keys) the top passages ground the model; without it the assistant still answers locally with
// the best-matching pages and, for names, the curated meaning. bot.js is loaded only when the panel first opens.
if (!document.getElementById('botFab')) {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const STOP = new Set('the and for are you your with that this what how can does about from have has was were who why when where which into any all not but our out use used using tell show give please site page nikhil meaning meanings name names origin language languages word words'.split(' '));
  const toks = (s) => (String(s).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter((t) => !STOP.has(t));

  const fab = document.createElement('button');
  fab.id = 'aFab'; fab.type = 'button'; fab.className = 'as-fab'; fab.setAttribute('aria-label', 'Open LexiBot assistant'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'aBox');
  fab.innerHTML = '<i></i>Ask LexiBot';
  const box = document.createElement('aside');
  box.id = 'aBox'; box.className = 'as-box'; box.setAttribute('aria-label', 'LexiBot assistant'); box.hidden = true;
  box.innerHTML = `<div class="as-h"><b>LexiBot</b><span class="chip" id="aSt">checking…</span><button type="button" id="aGear" aria-label="API key settings" title="Use your own free keys">⚙</button><button type="button" id="aX" aria-label="Close assistant">✕</button></div>
  <div id="aSet" class="as-set" hidden><input id="aKG" type="password" placeholder="Groq API key (free)" autocomplete="off" aria-label="Groq API key"><input id="aKM" type="password" placeholder="Gemini API key (free)" autocomplete="off" aria-label="Gemini API key"><button type="button" class="btn sm" id="aSave">Save for this tab</button><p class="note">Kept in this tab only. Free keys: console.groq.com/keys · aistudio.google.com/apikey</p></div>
  <div id="aMsgs" class="as-msgs" aria-live="polite"></div>
  <div class="as-chips" id="aChips"></div>
  <form id="aForm" class="as-form"><input id="aIn" placeholder="Ask about this site, a word or a name…" maxlength="300" autocomplete="off" aria-label="Message LexiBot"><button>Send</button></form>`;
  document.body.append(fab, box);

  let bot, kb, namesMod, busy = false;
  const msgs = $('#aMsgs', box);
  const push = (cls, html, meta) => { const d = document.createElement('div'); d.className = 'as-m ' + cls; d.innerHTML = html + (meta ? `<small>${esc(meta)}</small>` : ''); msgs.appendChild(d); msgs.scrollTop = 1e9; return d; };

  async function init() {
    if (bot) return;
    [bot, kb] = await Promise.all([import('./bot.js'), fetch('/assets/site-kb.json').then((r) => r.json()).catch(() => [])]);
    await bot.ready;
    status();
  }
  function status() {
    const s = bot.status(), el = $('#aSt', box);
    if (s.server) { const on = [s.providers?.groq && 'Groq', s.providers?.gemini && 'Gemini'].filter(Boolean); el.textContent = on.length ? on.join(' + ') : 'Server AI'; el.className = 'chip v'; $('#aGear', box).hidden = true; }
    else if (bot.hasKeys()) { el.textContent = 'Your keys'; el.className = 'chip v'; }
    else { el.textContent = 'Local mode'; el.className = 'chip l'; }
  }
  function retrieve(q, n = 3) {
    const qt = toks(q); if (!qt.length) return [];
    const here = location.pathname.replace(/\/$/, '') || '/';
    return kb.map((e) => {
      const tt = toks(e.t), xt = toks(e.x + ' ' + (e.d || ''));
      const set = new Map(); xt.forEach((w) => set.set(w, (set.get(w) || 0) + 1));
      let sc = 0;
      for (const w of qt) { if (tt.includes(w)) sc += 4; const c = set.get(w) || 0; if (c) sc += 1 + Math.min(c, 4) * .35; }
      if (e.p === here) sc += .3;
      return [sc, e];
    }).filter(([sc]) => sc >= 2).sort((a, b) => b[0] - a[0]).slice(0, n).map(([, e]) => e);
  }
  const links = (hits) => hits.length ? '<div class="as-src">' + hits.map((h) => `<a href="${esc(h.p)}">${esc(h.t.slice(0, 64))}</a>`).join('') + '</div>' : '';

  async function nameAnswer(q) {
    const w = (q.match(/[\p{L}]{3,}/gu) || []).slice(-4);
    namesMod ||= await import('./names-data.js');
    for (const t of w) {
      const hit = namesMod.findName(t);
      if (hit) return `<b>${esc(hit.t)}</b> — “${esc(hit.en)}”. Origin: ${esc(hit.origin)}. ${esc(hit.note || '')}`.trim() + `\n<a href="/names/${hit.key}">Full entry with 10 languages →</a>`;
    }
    return '';
  }

  async function ask(text) {
    const q = text.replace(/\s+/g, ' ').trim().slice(0, 300); if (!q || busy) return;
    busy = true; push('u', esc(q)); $('#aChips', box).innerHTML = ''; const holder = push('a', '…');
    try {
      await init();
      const hits = retrieve(q), local = await nameAnswer(q);
      if (bot.hasKeys()) {
        const ctx = `Current page: ${document.title}\n` + hits.map((h, i) => `[${i + 1}] ${h.t} (${h.p}): ${h.x.slice(0, 700)}`).join('\n') + (local ? `\nCurated name entry: ${local.replace(/<[^>]+>/g, '')}` : '');
        try {
          const r = await bot.chat(q, ctx.slice(0, 3800), /^\/deep\b/i.test(q));
          holder.innerHTML = md(r.text) + links(hits) + `<small>${esc(r.provider || 'AI')}${r.cached ? ' · cache' : ''}</small>`;
        } catch (e) {
          holder.innerHTML = (local ? local.replace(/\n(<a)/, '<br>$1') : 'The AI is rate-limited right now, but these pages match:') + links(hits) + '<small>local fallback</small>';
        }
      } else if (local || hits.length) {
        holder.innerHTML = (local ? local.replace(/\n(<a)/, '<br>$1') : 'Best matches on this site:') + links(hits) + '<small>local mode · the site owner can enable AI answers with free Groq/Gemini keys</small>';
      } else holder.innerHTML = 'I couldn’t find that on this site. Try the <a href="/lookup">lookup page</a> for any word or name.' + '<small>local mode</small>';
    } catch { holder.textContent = 'Something went wrong. Please try again.'; }
    busy = false; status(); msgs.scrollTop = 1e9;
  }

  const open = async (on) => {
    box.hidden = !on; fab.setAttribute('aria-expanded', String(on));
    if (on) {
      if (!msgs.children.length) {
        push('a', 'Hi, I’m LexiBot. Ask me about this site, Nikhil’s credentials, how the AI works, or the meaning of a name.');
        $('#aChips', box).innerHTML = ['What can this site do?', 'Show the credentials', 'How is my data handled?', 'Meaning of Krishna'].map((x) => `<button type="button">${esc(x)}</button>`).join('');
      }
      $('#aIn', box).focus(); init().catch(() => {});
    } else fab.focus();
  };
  fab.addEventListener('click', () => open(box.hidden));
  $('#aX', box).addEventListener('click', () => open(false));
  $('#aChips', box).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { $('#aChips', box).innerHTML = ''; ask(b.textContent); } });
  $('#aForm', box).addEventListener('submit', (e) => { e.preventDefault(); const i = $('#aIn', box), v = i.value; i.value = ''; ask(v); });
  $('#aGear', box).addEventListener('click', () => { const s = $('#aSet', box); s.hidden = !s.hidden; });
  $('#aSave', box).addEventListener('click', async () => {
    await init(); bot.setKeys($('#aKG', box).value, $('#aKM', box).value); $('#aKG', box).value = $('#aKM', box).value = '';
    await bot.detectAll(() => {}); status(); $('#aSet', box).hidden = true; push('a', 'Keys saved for this tab. AI answers are on.');
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) open(false); });
}
