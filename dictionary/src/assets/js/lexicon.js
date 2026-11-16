// Lexicon engine: text utilities, dictionary lookup with offline cache, linguistic helpers.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, k) => a + (b - a) * k;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Strip control chars, angle brackets and bidi/zero-width tricks; collapse whitespace; cap length. */
export const clean = (s) => String(s || '').replace(/[\u0000-\u001f\u007f<>​-‏‪-‮⁦-⁩]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

export const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
export const ss = {
  get(k) { try { return sessionStorage.getItem(k) || ''; } catch { return ''; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

export function speak(text, lang, onMissing) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return onMissing?.('Speech is not supported in this browser');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voices = synth.getVoices();
    const base = lang.slice(0, 2).toLowerCase();
    const v = voices.find((x) => x.lang.toLowerCase() === lang.toLowerCase()) || voices.find((x) => x.lang.toLowerCase().startsWith(base));
    if (v) u.voice = v; else onMissing?.(`No installed voice for ${lang} — using the system default`);
    synth.cancel();
    synth.speak(u);
  } catch { onMissing?.('Speech is not supported in this browser'); }
}

/* ---------- dictionary lookup (dictionaryapi.dev, Wiktionary-derived) with offline cache ---------- */
export async function lookupWord(w, setNet = () => {}) {
  const key = 'dict:w:' + w.toLowerCase();
  const cached = ls.get(key, null);
  try {
    const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w));
    if (r.status === 404) return { err: `No verified entry for “${w}” in the English corpus. It is flagged “Unverified / Emerging usage” — try the Names tab or ask LexiBot.` };
    if (!r.ok) throw new Error(String(r.status));
    const data = mergeEntries(await r.json());
    ls.set(key, data); setNet(true);
    return { data };
  } catch {
    setNet(false);
    if (cached) return { data: cached, offline: true };
    return { err: 'Could not reach the dictionary service and nothing is cached for this word yet. Name lookups still work offline.' };
  }
}

export function mergeEntries(arr) {
  const m = new Map(), ph = [], src = [];
  let origin = '';
  for (const e of arr) {
    for (const p of e.phonetics || []) if (p.text || p.audio) ph.push({ text: p.text || '', audio: p.audio || '' });
    if (e.origin && !origin) origin = e.origin;
    (e.sourceUrls || []).forEach((u) => src.push(u));
    for (const mm of e.meanings || []) {
      const o = m.get(mm.partOfSpeech) || { pos: mm.partOfSpeech, defs: [], syn: new Set(), ant: new Set() };
      o.defs.push(...(mm.definitions || []));
      (mm.synonyms || []).forEach((s) => o.syn.add(s));
      (mm.antonyms || []).forEach((s) => o.ant.add(s));
      (mm.definitions || []).forEach((d) => { (d.synonyms || []).forEach((s) => o.syn.add(s)); (d.antonyms || []).forEach((s) => o.ant.add(s)); });
      m.set(mm.partOfSpeech, o);
    }
  }
  return { word: arr[0].word, phonetics: ph, origin, src: [...new Set(src)].slice(0, 2), meanings: [...m.values()].map((o) => ({ pos: o.pos, defs: o.defs, syn: [...o.syn], ant: [...o.ant] })) };
}

/** Rule-based syllable estimate (approximate by design — shown as such in the UI). */
export const syl = (w) => {
  const m = w.toLowerCase().match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/g);
  return m && m.length > 1 ? m.join('·') : w;
};

const REG = [[/\b(informal|colloquial|slang)\b/i, 'Informal'], [/\b(derogatory|pejorative|offensive|disparaging)\b/i, 'Derogatory'], [/\b(vulgar|taboo|obscene)\b/i, 'Taboo'], [/\b(archaic|obsolete|dated|no longer used)\b/i, 'Obsolete'], [/\b(literary|poetic)\b/i, 'Poetic'], [/\b(humorous|jocular|facetious)\b/i, 'Humorous'], [/\bformal\b/i, 'Formal']];
const DOM = [[/\b(law|legal|court|statute|contract)\b/i, 'Legal'], [/\b(medical|disease|patient|symptom|surgery|medicine)\b/i, 'Medical'], [/\b(engineering|mechanical|electrical|circuit|machine)\b/i, 'Engineering']];
export const tagsFor = (t) => [...REG.filter(([r]) => r.test(t)).map(([, n]) => ['reg', n]), ...DOM.filter(([r]) => r.test(t)).map(([, n]) => ['v', n])];

export function inflect(w, pos) {
  const e = /[sxz]$|ch$|sh$/.test(w), cy = /[^aeiou]y$/.test(w);
  if (pos === 'noun') return [['plural', cy ? w.slice(0, -1) + 'ies' : e ? w + 'es' : w + 's']];
  if (pos === 'verb') return [['3rd person', cy ? w.slice(0, -1) + 'ies' : e ? w + 'es' : w + 's'], ['past', w.endsWith('e') ? w + 'd' : cy ? w.slice(0, -1) + 'ied' : w + 'ed'], ['present participle', /[^e]e$/.test(w) ? w.slice(0, -1) + 'ing' : w + 'ing']];
  if (pos === 'adjective') return [['comparative', w.endsWith('e') ? w + 'r' : cy ? w.slice(0, -1) + 'ier' : w + 'er'], ['superlative', w.endsWith('e') ? w + 'st' : cy ? w.slice(0, -1) + 'iest' : w + 'est']];
  return [];
}
