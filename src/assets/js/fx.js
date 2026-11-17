// Futuristic UI layer for every page: command palette (Ctrl/Cmd+K or "/"), cursor spotlight, 3D card tilt,
// scroll reveals, aurora backdrop, live AI status badge and the PWA service worker. All progressive enhancement.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* aurora + spotlight */
const au = document.createElement('div'); au.className = 'aurora'; au.setAttribute('aria-hidden', 'true'); au.innerHTML = '<i></i><i></i><i></i>';
document.body.prepend(au);
if (fine && !reduce) {
  let raf = 0;
  addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; document.documentElement.style.setProperty('--mx', e.clientX + 'px'); document.documentElement.style.setProperty('--my', e.clientY + 'px'); });
  }, { passive: true });
  document.documentElement.classList.add('spot');
}

/* 3D tilt on cards */
if (fine && !reduce) {
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest?.('.card,.feature,.tile,.sig');
    document.querySelectorAll('.tilting').forEach((x) => { if (x !== c) { x.classList.remove('tilting'); x.style.transform = ''; } });
    if (!c || c.closest('#pane')) return;
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    c.classList.add('tilting');
    c.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateZ(0)`;
  }, { passive: true });
}

/* scroll reveal — never hides tall blocks (tables, long lists): only short elements fade in, with a failsafe */
const rev = [...document.querySelectorAll('main section, main .card, main .feature, main .tile, main .sig, main article')];
if ('IntersectionObserver' in window && !reduce) {
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0, rootMargin: '0px 0px -4% 0px' });
  const pend = [];
  rev.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top > innerHeight * .9 && r.height < innerHeight * 1.2 && !el.querySelector('table,.tbl-wrap')) { el.classList.add('rv'); io.observe(el); pend.push(el); }
  });
  setTimeout(() => pend.forEach((el) => el.classList.add('in')), 4000); // failsafe: nothing stays invisible
}

/* AI status badge (is the serverless proxy live?) */
const hdr = $('.site-header');
if (hdr && /^https?:$/.test(location.protocol)) {
  const b = document.createElement('a'); b.href = '/lookup'; b.className = 'ai-badge'; b.textContent = 'AI · …'; b.title = 'Server-side AI status'; b.hidden = true;
  hdr.insertBefore(b, $('.nav'));
  fetch('/api/health', { cache: 'no-store' }).then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null)).then((j) => {
    if (!j?.ok) return;
    const on = [j.providers?.groq && 'Groq', j.providers?.gemini && 'Gemini'].filter(Boolean);
    b.hidden = false; b.textContent = on.length ? 'AI · ' + on.join(' + ') : 'AI · keys missing'; b.dataset.on = on.length ? '1' : '0';
  }).catch(() => {});
}

/* command palette */
const ITEMS = [
  ['Look up a word or name', '/lookup', 'Search'], ['Names index', '/names', 'Browse'], ['Word of the day', '/word-of-the-day', 'Daily'],
  ['Agent pipeline demo', '/agents', 'AI'], ['Features', '/features', 'Explore'], ['Architecture', '/architecture', 'Explore'],
  ['Security & limits', '/security', 'Trust'], ['About & credentials', '/about', 'Builder'], ['Privacy', '/privacy', 'Legal'],
  ['Name: Nikhil', '/lookup?q=Nikhil', 'Name'], ['Name: Krishna', '/lookup?q=Krishna', 'Name'], ['Name: Priya', '/lookup?q=Priya', 'Name'], ['Name: Arjun', '/lookup?q=Arjun', 'Name'],
];
let pal, sel = 0, shown = [];
function build() {
  pal = document.createElement('div'); pal.className = 'pal'; pal.hidden = true; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Command palette');
  pal.innerHTML = '<div class="pal-box"><input class="pal-in" type="text" placeholder="Type a word, a name or a page…" aria-label="Command palette search" autocomplete="off" spellcheck="false"><ul class="pal-list" role="listbox"></ul><p class="pal-hint"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</p></div>';
  document.body.appendChild(pal);
  pal.addEventListener('click', (e) => { if (e.target === pal) close(); const li = e.target.closest('li'); if (li) go(+li.dataset.i); });
  $('.pal-in', pal).addEventListener('input', render);
  $('.pal-in', pal).addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); mark(); e.preventDefault(); }
    else if (e.key === 'Enter') { go(sel); e.preventDefault(); }
  });
}
function render() {
  const q = $('.pal-in', pal).value.trim(), ql = q.toLowerCase();
  shown = ITEMS.filter((i) => !ql || i[0].toLowerCase().includes(ql));
  if (q) shown = [[`Look up “${q}”`, '/lookup?q=' + encodeURIComponent(q), 'Search'], ...shown];
  sel = 0;
  $('.pal-list', pal).innerHTML = shown.map((i, n) => `<li role="option" data-i="${n}"><span>${esc(i[0])}</span><em>${esc(i[2])}</em></li>`).join('') || '<li class="none">No match</li>';
  mark();
}
function mark() { pal.querySelectorAll('li[data-i]').forEach((li) => { const on = +li.dataset.i === sel; li.setAttribute('aria-selected', on); if (on) li.scrollIntoView({ block: 'nearest' }); }); }
function go(n) { const it = shown[n]; if (it) location.href = it[1]; }
let last;
function open() { if (!pal) build(); last = document.activeElement; pal.hidden = false; document.body.style.overflow = 'hidden'; $('.pal-in', pal).value = ''; render(); $('.pal-in', pal).focus(); }
function close() { if (!pal || pal.hidden) return; pal.hidden = true; document.body.style.overflow = ''; last?.focus?.(); }
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pal && !pal.hidden ? close() : open(); }
  else if (e.key === '/' && !typing && !(pal && !pal.hidden)) { e.preventDefault(); open(); }
  else if (e.key === 'Escape') close();
});
if (hdr) {
  const k = document.createElement('button'); k.type = 'button'; k.className = 'kbtn'; k.setAttribute('aria-label', 'Open command palette'); k.innerHTML = '<span>Search</span><kbd>Ctrl K</kbd>';
  k.addEventListener('click', open); hdr.insertBefore(k, $('.burger') || null);
}

/* PWA: offline shell + installable */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
