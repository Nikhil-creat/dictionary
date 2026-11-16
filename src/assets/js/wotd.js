// Word of the day: deterministic by calendar day (same word all day for everyone in the same timezone).
import { lookupWord, esc, speak } from './lexicon.js';

const WORDS = ['serendipity', 'ephemeral', 'luminous', 'quixotic', 'sonder', 'petrichor', 'ubiquitous', 'eloquent', 'resilient', 'ineffable', 'mellifluous', 'ethereal', 'pragmatic', 'laconic', 'surreptitious', 'benevolent', 'cacophony', 'diligent', 'enigma', 'felicity', 'gregarious', 'halcyon', 'idiosyncrasy', 'juxtapose', 'kinetic', 'labyrinth', 'magnanimous', 'nebulous', 'obfuscate', 'paradigm', 'quintessential', 'reverie', 'sagacious', 'tenacious', 'umbra', 'venerable', 'whimsical', 'zenith', 'altruism', 'brevity', 'candor', 'dexterity', 'empathy', 'fortitude', 'gravitas', 'harmony', 'integrity', 'jubilant', 'knack', 'lucid', 'meticulous', 'nuance', 'optimism', 'perspicacious', 'quell', 'rhetoric', 'solace', 'tranquil', 'unwavering', 'vivid', 'wanderlust'];

const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const word = WORDS[day % WORDS.length];
const root = document.getElementById('wotd');
const title = document.getElementById('wotd-word');
title.textContent = word;
document.getElementById('wotd-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('wotd-link').href = '/lookup?q=' + encodeURIComponent(word);

const { data, err, offline } = await lookupWord(word);
if (err) { root.innerHTML = `<p class="muted">${esc(err)}</p>`; }
else {
  const ph = data.phonetics.find((p) => p.text);
  root.innerHTML =
    (ph ? `<p class="ipa">${esc(ph.text)} <button type="button" class="btn" id="say" aria-label="Pronounce ${esc(word)}">▶ Listen</button></p>` : '') +
    data.meanings.slice(0, 3).map((m) => `<h3>${esc(m.pos)}</h3><ol>${m.defs.slice(0, 2).map((d) => `<li>${esc(d.definition)}${d.example ? `<br><em class="muted">“${esc(d.example)}”</em>` : ''}</li>`).join('')}</ol>${m.syn.length ? `<p class="muted">Synonyms: ${m.syn.slice(0, 6).map(esc).join(', ')}</p>` : ''}`).join('') +
    (data.origin ? `<h3>Origin</h3><p>${esc(data.origin)}</p>` : '') +
    (offline ? '<p class="muted">Showing a cached copy (offline).</p>' : '');
  document.getElementById('say')?.addEventListener('click', () => speak(word, 'en-US'));
}
