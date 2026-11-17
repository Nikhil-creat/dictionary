// Page definitions. The build script wraps each `body` in the shared header/footer and emits per-page SEO + JSON-LD.
import { site } from '../site.config.mjs';
import { NAMES, LM, LM_ORDER } from '../src/assets/js/names-data.js';
import { CERTS, CERT_ISSUERS } from './credentials.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const a = site.author;

const card = (href, ico, h, p) => `<a class="card" href="${href}"><div class="ico-badge" aria-hidden="true">${ico}</div><h3>${h}</h3><p>${p}</p><span class="more">Learn more →</span></a>`;
const cardStatic = (ico, h, p) => `<div class="card"><div class="ico-badge" aria-hidden="true">${ico}</div><h3>${h}</h3><p>${p}</p></div>`;
const crumb = (items) => items; // [{name, path}] without Home (added by the builder)

/* ============================== HOME ============================== */
const faq = [
  ['What is Dictionary?', 'Dictionary is an intelligent multi-modal dictionary. It looks up English words with definitions, IPA, register tags and etymology, and it explains personal names — their origin and meaning — in ten languages and scripts.'],
  ['Where do the definitions come from?', 'English entries come from a Wiktionary-derived corpus (via dictionaryapi.dev). Names come from a curated lexicon where every claim carries a Verified, Likely or Unverified tag. Anything the corpus cannot support is flagged “Unverified / Emerging usage” instead of being invented.'],
  ['Does it work offline?', 'Words you have already looked up are cached in your browser, and the curated name lexicon is bundled, so those work without a connection. New English words need a network request.'],
  ['Is my camera or photo data stored?', 'No. OCR and object recognition run in your browser tab, and images are never uploaded or written to disk. The optional server-side vision service processes frames in memory only and discards them after inference.'],
  ['Do I need an API key for LexiBot?', 'Not on this site if the owner has added keys to the Vercel project: the built-in /api proxy then holds them in environment variables and the browser never sees them. Otherwise you can paste your own free Groq and/or Gemini keys under ⚙; they stay in your tab’s session storage.'],
];

const home = {
  path: '/', slug: 'home', hero: true,
  title: 'Dictionary — words, names & meanings in every language',
  description: 'Look up any English word or personal name and see definitions, etymology, IPA and meanings in Telugu, Hindi, Tamil, Arabic, Mandarin and more — with grounded AI.',
  og: 'og-default.png', priority: 1.0, changefreq: 'weekly',
  jsonld: () => [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: '__SITE__/', description: site.description, inLanguage: 'en',
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: '__SITE__/lookup?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, ans]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: ans } })) },
  ],
  business: true,
  body: () => `
<section class="hero" id="hero" aria-label="Interactive globe">
  <h1 id="word0">Dictionary<span class="sr"> — words, names and meanings in every language</span></h1>
  <div id="eyebrow" aria-hidden="true">Meaning for every word · name · script</div>
  <div id="flare" aria-hidden="true"></div>
  <canvas id="gl" aria-hidden="true"></canvas>
  <canvas id="dust" aria-hidden="true"></canvas>
  <div id="pin" aria-hidden="true"><i></i><span>Telugu</span></div>
  <div id="word1" aria-hidden="true">LANGUAGES</div>
  <ul id="sites" aria-label="Languages"></ul>
  <div id="card"><div id="cl"></div><div id="cg"></div><div id="cs"></div><a href="/lookup" id="explore">Explore</a></div>
  <div id="region" aria-hidden="true"></div>
  <div id="fog" aria-hidden="true"></div>
  <form id="hq" action="/lookup" method="get" role="search">
    <label class="sr" for="hq-q">Search a word or a name</label>
    <input id="hq-q" name="q" type="search" placeholder="Try “serendipity” or a name" maxlength="80" autocomplete="off" spellcheck="false" enterkeyhint="search">
    <button type="submit">Search</button>
  </form>
  <div id="rail" aria-label="Hero steps"><button type="button" aria-label="Step 1: Dictionary"></button><button type="button" aria-label="Step 2: Languages"></button><button type="button" aria-label="Step 3: Explore the lookup"></button></div>
  <div id="hint" aria-hidden="true">Drag to spin · click the planet to explore</div>
  <div id="tech" aria-hidden="true"><span>AGENTIC ROUTER</span><span>RAG + CITATIONS</span><span>GROQ ⇄ GEMINI</span><span>ON-DEVICE OCR</span><span>OFFLINE CACHE</span></div>
  <a id="cue" href="#content">Skip to content ↓</a>
</section>

<div id="content">
<section class="block"><div class="wrap">
  <span class="eyebrow">What you can do</span>
  <h2>One search box for words, names and the scripts they live in</h2>
  <p class="lead">Dictionary pairs traditional lexicography with grounded AI. Every answer says how sure it is.</p>
  <div class="grid g3" style="margin-top:28px">
    ${card('/lookup', '📖', 'Word lookup', 'Definitions ordered by sense, IPA with US, UK and India accents, register tags, inflections, synonyms and antonyms.')}
    ${card('/names', '🌏', 'Name meanings', 'Search a name and see its origin and meaning written in Telugu, Hindi, Tamil, Arabic, Mandarin, Japanese, Korean, Russian, French and Spanish.')}
    ${card('/features', '🤖', 'Agentic AI + RAG', 'A router, lexicographer, etymologist and a grounding validator that rejects claims the corpus cannot support.')}
    ${card('/features#vision', '📷', 'Scan with your camera', 'Point at printed text or an object. Recognition runs on your device and nothing is uploaded.')}
    ${card('/architecture', '🧩', 'Docker microservices', 'FastAPI gateway, agent orchestrator, hybrid retrieval, vision service, Redis, Postgres and Qdrant — one compose file.')}
    ${card('/security', '🛡️', 'Security & limits', 'Prompt-injection defences, role-based access, rate limiting, zero-retention media — and a candid list of what it cannot do.')}
  </div>
</div></section>

<section class="block"><div class="wrap">
  <span class="eyebrow">Try a name</span>
  <h2>See a name travel across languages</h2>
  <p class="lead">Each curated name has its own page. A few to start with:</p>
  <div class="grid g4" style="margin-top:24px">
    ${['nikhil', 'sriramoju', 'chary', 'priya'].map((k) => { const n = NAMES[k]; return `<a class="card" href="/names/${k}"><div class="script-big" lang="te">${esc(n.scripts.te)}</div><h3 style="margin-top:6px">${esc(n.t)}</h3><p>${esc(n.en)}</p></a>`; }).join('')}
  </div>
  <div class="row"><a class="btn primary" href="/lookup?q=Nikhil%20Chary%20Sriramoju">Look up a full name</a><a class="btn" href="/names">Browse all names</a></div>
</div></section>

<section class="block"><div class="wrap">
  <span class="eyebrow">Built to be trusted</span>
  <h2>Grounded first, generative second</h2>
  <div class="grid g4" style="margin-top:24px">
    <div class="card"><div class="stat">3</div><div class="stat-l">confidence tiers on every name</div></div>
    <div class="card"><div class="stat">10</div><div class="stat-l">languages and scripts per name</div></div>
    <div class="card"><div class="stat">0</div><div class="stat-l">images uploaded or stored</div></div>
    <div class="card"><div class="stat">2</div><div class="stat-l">LLM providers with automatic failover</div></div>
  </div>
  <p class="lead">Read how retrieval, validation and the circuit-breaker routing work on the <a class="link" href="/architecture">architecture page</a>, or what we deliberately do not claim on <a class="link" href="/security">security &amp; limitations</a>.</p>
</div></section>

<section class="block"><div class="wrap">
  <span class="eyebrow">Built by</span>
  <h2>${esc(a.name)}</h2>
  <p class="lead">${esc(a.role)}. Final-year B.Tech Computer Science &amp; Engineering student in Warangal, Telangana, with a growing credential log in cloud, security, data and AI. <a class="link" href="/about">See the credentials and projects →</a></p>
  <div class="sig-grid" aria-label="The builder's name in eight scripts">${['te', 'hi', 'ta', 'ar', 'zh', 'ja', 'ko', 'ru'].map((k) => `<div class="sig"><b lang="${k}">${['nikhil', 'chary', 'sriramoju'].map((n) => NAMES[n].scripts[k]).join(' ')}</b><span>${LM[k].n}</span></div>`).join('')}</div>
  <div class="grid g3" style="margin-top:20px">
    <div class="card"><div class="stat">${CERTS.length}</div><div class="stat-l">credentials listed in detail (33+ logged)</div></div>
    <div class="card"><div class="stat">9</div><div class="stat-l">flagship AI, data and systems projects</div></div>
    <div class="card"><div class="stat">4</div><div class="stat-l">cooperating AI agents inside this product</div></div>
  </div>
  <div class="row"><a class="btn primary" href="/agents">Watch the agents work →</a><a class="btn" href="/about">Credentials &amp; projects</a></div>
</div></section>

<section class="block faq"><div class="wrap">
  <span class="eyebrow">FAQ</span>
  <h2>Questions people ask</h2>
  ${faq.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('')}
</div></section>
</div>`,
};

/* ============================== LOOKUP ============================== */
const lookup = {
  path: '/lookup', slug: 'lookup', crumbs: crumb([{ name: 'Lookup', path: '/lookup' }]),
  title: 'Word & name lookup — definitions, IPA, meanings | Dictionary',
  description: 'Search any English word or personal name. Definitions, IPA with accent audio, etymology, synonym graph, flashcards and name meanings in ten languages.',
  og: 'og-lookup.png', priority: 0.9, changefreq: 'weekly', styles: ['lookup.css'], scripts: ['lookup.js'],
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Dictionary lookup', url: '__SITE__/lookup', applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <div class="lookup-head">
    <h1>Look up a word or a name</h1>
    <p class="lead">Type an English word, or a name in any script. Press <kbd class="inline-code">/</kbd> to focus the search.</p>
  </div>
  <form id="bar" autocomplete="off" role="search">
    <label class="q"><span>Search · word or name · any script</span><input id="q" type="search" placeholder="serendipity · Nikhil Chary Sriramoju · నిఖిల్" maxlength="80" spellcheck="false" enterkeyhint="search"></label>
    <button type="button" class="bi" id="mic" aria-label="Voice search" title="Voice search"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
    <button type="button" class="bi" id="scan" aria-label="Scan printed text from an image" title="Scan text (OCR)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8"/></svg></button>
    <button type="button" class="bi" id="obj" aria-label="Identify an object in a photo" title="Identify object"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/></svg></button>
    <button class="go" aria-label="Search">→</button>
    <input type="file" id="file" accept="image/*" capture="environment" hidden>
  </form>
  <div id="chips" aria-label="Example searches"></div>
  <div class="c-top">
    <nav id="tabs" role="tablist" aria-label="Result views">
      <button type="button" data-tab="word" class="on" role="tab">Word</button>
      <button type="button" data-tab="name" role="tab">Names<b id="nameCount" hidden></b></button>
      <button type="button" data-tab="graph" role="tab">Graph</button>
      <button type="button" data-tab="cards" role="tab">Cards<b id="cardCount" hidden></b></button>
    </nav>
    <div id="status"><span id="net" class="ok">● online</span><span>RAG-grounded</span><span>Zero-retention media</span></div>
  </div>
  <div id="pane" aria-live="polite"></div>
  <noscript><p class="card">The lookup tool needs JavaScript. Browse the <a class="link" href="/names">name pages</a> for static meanings.</p></noscript>
  <p class="note" style="margin-top:20px">New here? Read <a class="link" href="/features">how the AI features work</a> or browse <a class="link" href="/names">curated names</a>.</p>
</div>
<button id="botFab" type="button" aria-label="Open LexiBot assistant" aria-expanded="false" aria-controls="bot"><i></i>LexiBot</button>
<aside id="bot" aria-label="LexiBot assistant">
  <div class="bh"><b>LexiBot</b><span class="chip" id="cG">Groq · off</span><span class="chip" id="cM">Gemini · off</span><button type="button" id="bgear" aria-label="API key settings" title="API keys">⚙</button></div>
  <div id="bset">
    <input id="kG" type="password" placeholder="Groq API key (free tier)" autocomplete="off" aria-label="Groq API key">
    <input id="kM" type="password" placeholder="Gemini API key (free tier)" autocomplete="off" aria-label="Gemini API key">
    <button type="button" class="btn sm" id="bsave">Save for this tab &amp; auto-detect models</button>
    <p class="note">Keys stay in this tab (sessionStorage) and go only to the provider. Get free keys at console.groq.com/keys and aistudio.google.com/apikey.</p>
  </div>
  <div id="bmsgs" aria-live="polite"></div>
  <form id="bform"><input id="bin" placeholder="Ask about the word or name on screen…" maxlength="500" autocomplete="off" aria-label="Message LexiBot"><button>Send</button></form>
</aside>
<div id="toast" role="status"></div>`,
};

/* ============================== NAMES ============================== */
const namesIndex = {
  path: '/names', slug: 'names', crumbs: crumb([{ name: 'Names', path: '/names' }]),
  title: 'Name meanings in 10 languages and scripts | Dictionary',
  description: 'Browse curated personal names with their origin, meaning and written form in Telugu, Hindi, Tamil, Arabic, Mandarin, Japanese, Korean, Russian, French and Spanish.',
  og: 'og-names.png', priority: 0.9, changefreq: 'monthly',
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Name meanings', url: '__SITE__/names', hasPart: Object.values(NAMES).map((n) => ({ '@type': 'DefinedTerm', name: n.t, url: `__SITE__/names/${n.key}` })) }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Name meanings across languages</h1>
  <p class="lead">Every name below has an origin, a literal meaning and a rendering in ten scripts. Each claim is tagged <span class="chip v">Verified</span> or <span class="chip l">Likely</span>; names we have not curated are shown as <span class="chip u">Unverified</span> in the <a class="link" href="/lookup">live lookup</a> rather than guessed.</p>
  <div class="grid g3" style="margin:28px 0">
    ${Object.values(NAMES).map((n) => `<a class="card" href="/names/${n.key}"><div class="script-big" lang="te">${esc(n.scripts.te)}</div><h2 style="font-size:20px;margin:6px 0">${esc(n.t)}</h2><p>${esc(n.en)}</p><span class="chip ${n.conf === 'verified' ? 'v' : 'l'}" style="margin-top:10px">${n.conf === 'verified' ? 'Verified' : 'Likely'}</span><span class="more">Meaning in 10 languages →</span></a>`).join('')}
  </div>
  <div class="card"><h2>Looking for a different name?</h2><p>Use the <a class="link" href="/lookup">lookup tool</a>. If it is not in the curated lexicon, you can ask the AI agent to propose an origin and translations — clearly labelled as unverified unless the retrieval corpus supports it.</p><div class="row"><a class="btn primary" href="/lookup">Open the lookup</a></div></div>
</div>`,
};

const namePages = Object.values(NAMES).map((n, idx, all) => {
  const related = [all[(idx + 1) % all.length], all[(idx + 2) % all.length]];
  const conf = n.conf === 'verified' ? '<span class="chip v">Verified</span>' : '<span class="chip l">Likely</span>';
  return {
    path: `/names/${n.key}`, slug: `names-${n.key}`,
    crumbs: crumb([{ name: 'Names', path: '/names' }, { name: n.t, path: `/names/${n.key}` }]),
    title: `${n.t} name meaning & origin in 10 languages | Dictionary`,
    description: `${n.t} means “${n.en}”. Origin: ${n.origin}. See ${n.t} written in Telugu, Hindi, Tamil, Arabic, Mandarin, Japanese and more.`.slice(0, 158),
    og: 'og-names.png', priority: 0.7, changefreq: 'monthly',
    jsonld: () => [{ '@context': 'https://schema.org', '@type': 'DefinedTerm', name: n.t, description: `${n.en}. ${n.origin}.`, inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Dictionary name meanings', url: '__SITE__/names' }, url: `__SITE__/names/${n.key}` }],
    body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Meaning of the name ${esc(n.t)}</h1>
  <p class="lead">“${esc(n.en)}” ${conf}</p>
  <div class="grid g2" style="margin:24px 0">
    <div class="card"><h2>Origin</h2><table class="tbl"><tr><th scope="row">Name</th><td>${esc(n.t)}</td></tr><tr><th scope="row">Origin</th><td>${esc(n.origin)}</td></tr><tr><th scope="row">Family</th><td>${esc(n.fam)}</td></tr><tr><th scope="row">Confidence</th><td>${n.conf === 'verified' ? 'Verified — well-attested etymology' : 'Likely — widely held, but family lineages vary'}</td></tr></table><p class="note" style="margin-top:12px">${esc(n.note)}</p></div>
    ${n.parts ? `<div class="card"><h2>Parts of the name</h2><table class="tbl">${n.parts.map((p) => `<tr><th scope="row" lang="te">${esc(p.s)}</th><td><b>${esc(p.t)}</b> — ${esc(p.m)}</td></tr>`).join('')}</table></div>` : `<div class="card"><h2>Try it live</h2><p>Search ${esc(n.t)} in the lookup to hear it pronounced in each language, save it to flashcards and see its semantic graph.</p><div class="row"><a class="btn primary" href="/lookup?q=${encodeURIComponent(n.t)}">Open ${esc(n.t)} in the lookup</a></div></div>`}
  </div>
  <h2>${esc(n.t)} in ten languages</h2>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Language</th><th scope="col">Written as</th><th scope="col">Meaning</th></tr></thead><tbody>
  ${LM_ORDER.filter((k) => n.scripts[k] || n.gloss[k]).map((k) => `<tr><th scope="row">${esc(LM[k].n)}<br><span class="note" lang="${k}">${esc(LM[k].nat)}</span></th><td class="script-big" lang="${k}">${esc(n.scripts[k] || '—')}</td><td lang="${k}">${esc(n.gloss[k] || '—')}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="row"><a class="btn primary" href="/lookup?q=${encodeURIComponent(n.t)}">Hear it &amp; save to flashcards</a><a class="btn" href="/names">All names</a></div>
  <h2 style="margin-top:44px">Related names</h2>
  <div class="grid g2">${related.map((r) => `<a class="card" href="/names/${r.key}"><div class="script-big" lang="te">${esc(r.scripts.te)}</div><h3>${esc(r.t)}</h3><p>${esc(r.en)}</p></a>`).join('')}</div>
  <p class="note" style="margin-top:20px">Transliterations are conventional renderings, not official spellings. Meanings in other languages are translations of the English gloss.</p>
</div>`,
  };
});

/* ============================== FEATURES ============================== */
const features = {
  path: '/features', slug: 'features', crumbs: crumb([{ name: 'Features', path: '/features' }]),
  title: 'Features — agentic AI, RAG, vision and LexiBot | Dictionary',
  description: 'How Dictionary works: a four-agent pipeline, hybrid retrieval with a grounding validator, on-device OCR and object recognition, and a Groq/Gemini chatbot with failover.',
  og: 'og-features.png', priority: 0.8, changefreq: 'monthly',
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Dictionary features', url: '__SITE__/features', author: { '@type': 'Person', name: a.name }, inLanguage: 'en' }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Features</h1>
  <p class="lead">Everything the lookup does, and how each AI piece is kept honest.</p>
  <section class="block" id="agents"><span class="eyebrow">Agentic AI</span><h2>A four-agent pipeline with deterministic hand-offs</h2>
    <div class="grid g2">
      ${cardStatic('🧭', 'Router agent', 'Classifies each query as a word lookup, a name lookup, an image scan or a conversational question and dispatches it.')}
      ${cardStatic('📚', 'Lexicographer agent', 'Drafts definitions, CEFR level, collocations and example sentences from retrieved corpus passages.')}
      ${cardStatic('🏛️', 'Etymology & culture agent', 'Traces roots and cross-language name meanings, naming its uncertainty explicitly.')}
      ${cardStatic('✅', 'Grounding validator', 'Scores every drafted claim against retrieved chunks. Claims below the threshold are dropped or the entry is tagged “Unverified / Emerging usage”.')}
    </div>
    <p class="prose" style="margin-top:14px"><span class="note">The pipeline is a small explicit state machine in plain Python (no framework dependency) so each transition can be unit-tested. See <a class="link" href="/architecture">architecture</a>.</span></p>
  </section>
  <section class="block" id="rag"><span class="eyebrow">Retrieval-augmented generation</span><h2>Hybrid search with provenance</h2>
    <div class="prose"><ul>
      <li><b>Hybrid ranking:</b> BM25 lexical matching fused with dense vectors using reciprocal-rank fusion, so exact headwords and loose concepts both hit.</li>
      <li><b>Pluggable embeddings:</b> the default is a dependency-free character n-gram hashing embedder that runs anywhere; swap in a multilingual sentence-transformer for deeper cross-lingual alignment.</li>
      <li><b>Pluggable store:</b> in-memory for development, Qdrant for production.</li>
      <li><b>Chunk-level provenance:</b> every passage carries a source id and licence so answers can cite it.</li>
    </ul></div>
  </section>
  <section class="block" id="vision"><span class="eyebrow">Computer vision</span><h2>Scan text and identify objects</h2>
    <div class="prose"><ul>
      <li><b>In the browser:</b> Tesseract (an LSTM text recogniser) reads printed text; COCO-SSD identifies common objects. Both run locally and the photo never leaves your tab.</li>
      <li><b>On the server (optional):</b> a vision container runs Tesseract with OpenCV pre-processing and an EfficientNet-B0 classifier. Frames live in memory only.</li>
    </ul></div>
  </section>
  <section class="block" id="lexibot"><span class="eyebrow">LexiBot</span><h2>Dual-provider chat with automatic failover</h2>
    <div class="prose"><ul>
      <li>Model names are never hard-coded: Groq’s and Gemini’s <code>/models</code> endpoints are queried at start-up and every ten minutes, deprecated and non-chat models are filtered out, and the best active model is bound.</li>
      <li>Groq is tried first for latency. On HTTP 429 or 5xx a circuit breaker opens with exponential backoff and jitter and Gemini takes over. Long-context requests go to Gemini first.</li>
      <li>Identical questions are served from a cache to stay inside free-tier limits.</li>
    </ul></div>
  </section>
  <section class="block" id="learning"><span class="eyebrow">Learning</span><h2>Flashcards and the semantic graph</h2>
    <div class="prose"><ul><li>Every lookup joins a spaced-repetition deck (0, 1, 3, 7, 14 day boxes), stored in your browser.</li><li>A force-directed graph links a headword to synonyms and antonyms, or a name to its scripts.</li></ul></div>
  </section>
  <div class="row"><a class="btn primary" href="/lookup">Try the lookup</a><a class="btn" href="/security">Security &amp; limitations</a></div>
</div>`,
};

/* ============================== ARCHITECTURE ============================== */
const architecture = {
  path: '/architecture', slug: 'architecture', crumbs: crumb([{ name: 'Architecture', path: '/architecture' }]),
  title: 'Architecture — Docker microservices, FastAPI, Qdrant | Dictionary',
  description: 'System design for Dictionary: static front end on Vercel, FastAPI gateway, agent orchestrator, hybrid retrieval, vision service, Redis, Postgres and Qdrant in Docker.',
  og: 'og-architecture.png', priority: 0.8, changefreq: 'monthly',
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Dictionary architecture', url: '__SITE__/architecture', author: { '@type': 'Person', name: a.name }, inLanguage: 'en' }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Architecture</h1>
  <p class="lead">A static front end that works on its own, plus an optional containerised backend that adds server-side keys, grounded answers and vision.</p>
  <figure class="diagram"><img src="/assets/img/architecture.svg" width="1200" height="640" alt="Architecture diagram: the browser talks to a FastAPI gateway, which calls the agent orchestrator, retrieval engine and vision service, backed by Redis, Postgres and Qdrant." loading="lazy" decoding="async"></figure>
  <section class="block"><h2>Services</h2>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Service</th><th scope="col">Role</th><th scope="col">Tech</th></tr></thead><tbody>
    <tr><th scope="row">web</th><td>Serves the built site and proxies <code>/api</code></td><td>nginx</td></tr>
    <tr><th scope="row">api</th><td>Gateway, auth, RBAC, rate limits, agents, LexiBot</td><td>FastAPI, httpx</td></tr>
    <tr><th scope="row">vision</th><td>OCR and object recognition, memory-only</td><td>OpenCV, Tesseract, PyTorch</td></tr>
    <tr><th scope="row">qdrant</th><td>Vector store for dense retrieval</td><td>Qdrant</td></tr>
    <tr><th scope="row">redis</th><td>Sliding-window rate limits, response cache</td><td>Redis</td></tr>
    <tr><th scope="row">postgres</th><td>Saved vocabulary, quiz progress, vetted neologisms</td><td>PostgreSQL</td></tr>
  </tbody></table></div></section>
  <section class="block"><h2>Request flow</h2>
    <div class="prose"><ol><li>The gateway sanitises input and checks the caller’s role and rate limit.</li><li>The router agent classifies the intent.</li><li>Retrieval returns top passages by fused BM25 and vector rank.</li><li>A specialist agent drafts an answer from those passages through Groq (or Gemini on failover).</li><li>The grounding validator scores each claim; unsupported claims are removed or the entry is flagged unverified.</li><li>The result is cached in Redis and returned with its provenance.</li></ol></div></section>
  <section class="block"><h2>Deploying</h2>
    <div class="prose"><p>The front end deploys to Vercel as static files. The backend runs with <code>docker compose up --build</code> locally. Starter Kubernetes manifests (deployment, service and a CPU-based autoscaler for the API) live in <code>deploy/k8s</code>; scaling the vision service on GPU queue depth needs a metrics adapter in your cluster. The repository README walks through GitHub, Vercel and a custom domain step by step.</p>
    <pre><code>cp .env.example backend/.env
docker compose up --build</code></pre></div></section>
  <div class="row"><a class="btn primary" href="${site.repo}" rel="noopener">View the source</a><a class="btn" href="/security">Security</a><a class="btn" href="/features">Features</a></div>
</div>`,
};

/* ============================== SECURITY ============================== */
const security = {
  path: '/security', slug: 'security', crumbs: crumb([{ name: 'Security & limitations', path: '/security' }]),
  title: 'Security, privacy & known limitations | Dictionary',
  description: 'How Dictionary defends against prompt injection, protects API keys, avoids storing images, rate-limits abuse — and the limitations we state openly.',
  og: 'og-security.png', priority: 0.7, changefreq: 'monthly',
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Dictionary security and limitations', url: '__SITE__/security', author: { '@type': 'Person', name: a.name }, inLanguage: 'en' }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Security, privacy &amp; limitations</h1>
  <p class="lead">What is defended, what is not, and where the system is deliberately cautious.</p>
  <section class="block"><h2>Controls</h2><div class="grid g2">
    ${cardStatic('🧱', 'Prompt-injection defences', 'User text is stripped of control and bidi characters, length-capped and wrapped in explicit <user_query> delimiters; retrieved passages are validated before they reach the model, and the system prompt tells the model to treat both as data.')}
    ${cardStatic('🔑', 'Secret handling', 'Provider keys are read from environment variables by the Vercel functions (or the optional backend) and never sent to the browser. The functions enforce same-origin requests, input sanitisation, a 20 requests/minute per-visitor limit and a shared hourly budget that protects the free-tier quota. Keys a visitor pastes live only in sessionStorage and go straight to the provider.')}
    ${cardStatic('📵', 'Zero-retention media', 'Camera frames and uploads are processed in memory (or in your own tab) and discarded. Nothing is written to disk or logged.')}
    ${cardStatic('🚦', 'Rate limits & roles', 'A sliding-window limiter runs per IP and per key; guest, user, moderator and admin roles gate the heavier endpoints.')}
    ${cardStatic('🌐', 'Browser hardening', 'Strict content-security-policy, HSTS, no framing, no MIME sniffing, a locked-down referrer policy and permissions policy.')}
    ${cardStatic('🔍', 'Dependencies', 'The CI workflow builds the site, runs the launch-checklist audit and the backend tests, and runs a Trivy vulnerability scan on every push.')}
  </div></section>
  <section class="block"><h2>Known limitations</h2>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Limitation</th><th scope="col">Mitigation</th></tr></thead><tbody>
      <tr><th scope="row">LLMs can hallucinate on rare words and names</th><td>Answers must be supported by retrieved passages. Below the grounding threshold the entry is tagged “Unverified / Emerging usage”, and AI-generated name entries carry an unverified badge.</td></tr>
      <tr><th scope="row">The curated name lexicon is small</th><td>Unknown names are never given an invented etymology. The agent may propose one, clearly marked.</td></tr>
      <tr><th scope="row">Names with unrelated origins share a spelling</th><td>The entry notes the ambiguity (for example “Wei”, whose meaning depends on the written character).</td></tr>
      <tr><th scope="row">Free-tier API throttling</th><td>Response caching, Groq↔Gemini failover and exponential backoff with jitter.</td></tr>
      <tr><th scope="row">Syllables and inflections are rule-based</th><td>Labelled approximate; irregular forms are not detected.</td></tr>
      <tr><th scope="row">Browser OCR reads printed Latin text best</th><td>Handwriting and non-Latin scripts need the optional server vision service and extra language packs.</td></tr>
      <tr><th scope="row">Numerology is cultural, not scientific</th><td>Presented as a curiosity and labelled as such.</td></tr>
    </tbody></table></div></section>
  <section class="block"><h2>Reporting a problem</h2><p class="prose">Found a security issue or a wrong etymology? Email <a class="link" href="mailto:${a.email}">${a.email}</a> or open an issue on <a class="link" href="${site.repo}/issues" rel="noopener">GitHub</a>.</p>
  <div class="row"><a class="btn" href="/privacy">Privacy policy</a><a class="btn" href="/architecture">Architecture</a></div></section>
</div>`,
};

/* ============================== ABOUT ============================== */
const projects = [
  ['TrustGuard AI', 'Document/KYC verification, real-time fraud detection, risk-case prioritisation and MLOps in one platform.'],
  ['DistWorkspace', 'Real-time collaborative workspace combining CRDT editing, a Raft-based key-value store and an event stream.'],
  ['NeuroScan AI', 'Explainable deep-learning plus RAG clinical decision-support system for multi-class brain MRI diagnosis.'],
  ['AgentShield-X', 'Zero-trust AI security and governance engine with guardrails, a sandbox and a Merkle audit ledger.'],
  ['Omni-Cloud Sentinel', 'Multi-agent cloud operations platform covering FinOps, DevSecOps and incident response.'],
  ['ChurnScope', 'End-to-end customer-churn prediction pipeline with evaluation and reporting.'],
  ['AI PDF Chatbot', 'RAG chatbot: upload PDFs, chunk and embed them, and chat with grounded answers.'],
  ['NL2SQL Data Agent', 'Chat with your data: natural language to SQL with automatic insights.'],
  ['Task Manager', 'Full-stack task management app with JWT auth, MongoDB and real-time Socket.io updates.'],
];
const issuers = ['Skill India / NASSCOM', 'IBM SkillsBuild', 'UiPath', 'Reliance Foundation', 'Forage', 'Deloitte', 'TATA', 'BCG Platinion', 'Skyscanner', 'Vista', 'AIG', 'EAB', 'LifeArc', 'British Airways', 'Morrison Foerster', 'Ashurst', 'Perkins Coie', 'Latham & Watkins', 'Datacom', 'Clifford Chance', 'PwC', 'JPMorgan Chase', 'Quantium', 'Y Combinator', 'Thiranex', 'PHN Technology', 'Commonwealth Bank', 'Citi', 'BCG', 'BCG X', 'Blackbird', 'DLA Piper', 'Mastercard', 'Johnson & Johnson MedTech', 'Ashurst Perkins Coie'];
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const certsSorted = [...CERTS].sort((x, y) => y.date.localeCompare(x.date));
const certRows = certsSorted.map((c) => `<tr><td><b>${esc(c.title)}</b>${c.tasks ? `<br><span class="muted">${esc(c.tasks)}</span>` : ''}</td><td>${esc(c.issuer)}<br><span class="muted">via ${esc(c.via)}</span></td><td>${esc(c.kind)}</td><td>${c.period ? esc(c.period) : fmtDate(c.date)}${c.hours ? `<br><span class="muted">${c.hours} h</span>` : ''}${c.id ? `<br><span class="muted">ID ${esc(c.id)}</span>` : ''}</td></tr>`).join('');
const about = {
  path: '/about', slug: 'about', crumbs: crumb([{ name: 'About', path: '/about' }]),
  title: `About ${a.name} — credentials & projects | Dictionary`,
  description: `${a.name}: final-year B.Tech CSE student in Warangal building AI, data and web products. Credentials, internships, projects and how to get in touch.`,
  og: 'og-about.png', priority: 0.6, changefreq: 'monthly', business: true,
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: a.name, jobTitle: a.role, url: '__SITE__/about', email: `mailto:${a.email}`, sameAs: [a.github, a.linkedin], alumniOf: { '@type': 'CollegeOrUniversity', name: 'Vaagdevi College of Engineering' }, address: { '@type': 'PostalAddress', addressLocality: 'Warangal', addressRegion: 'Telangana', addressCountry: 'IN' }, hasCredential: CERTS.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c.title, credentialCategory: c.kind, dateCreated: c.date, recognizedBy: { '@type': 'Organization', name: c.issuer } })), knowsAbout: ['Machine learning', 'Data analytics', 'Retrieval-augmented generation', 'Python', 'SQL', 'React', 'Cloud computing'] } }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>About ${esc(a.name)}</h1>
  <p class="lead">${esc(a.role)}. Final-year B.Tech Computer Science &amp; Engineering student at Vaagdevi College of Engineering (2023–2027), based in Warangal, Telangana. I build AI, data and web products — Dictionary is one of them.</p>
  <div class="row"><a class="btn primary" href="mailto:${a.email}">Email me</a><a class="btn" href="${a.github}" rel="me noopener">GitHub</a><a class="btn" href="${a.linkedin}" rel="me noopener">LinkedIn</a></div>
  <section class="block"><span class="eyebrow">Credentials</span><h2>Certifications &amp; virtual internships</h2>
    <div class="grid g3">
      <div class="card"><div class="stat">33+</div><div class="stat-l">certifications logged so far, more on the way</div></div>
      <div class="card"><div class="stat">5+</div><div class="stat-l">internships &amp; micro-internships</div></div>
      <div class="card"><div class="stat">9</div><div class="stat-l">flagship AI, data and systems projects</div></div>
    </div>
    <p class="prose" style="margin-top:16px">Issuers and programmes include:</p>
    <p>${issuers.map((i) => `<span class="chip c">${esc(i)}</span>`).join('')}</p>
    <div class="prose"><ul>
      <li><b>Data Analytics Intern</b> — Thiranex (19 Jul – 18 Aug 2026)</li>
      <li><b>Graphic Designing Intern</b> — Thiranex (29 Jul – 28 Aug 2026)</li>
      <li><b>Machine Learning Engineer internship</b> — Yuva Intern (NSDC), six-week programme</li>
      <li><b>Forage virtual job simulations</b> — JPMorgan Chase, PwC (technology and cyber consulting), Y Combinator, Quantium, Datacom, Latham &amp; Watkins, Clifford Chance</li>
      <li><b>IBM SkillsBuild</b> — Artificial Intelligence Fundamentals</li>
    </ul></div>
    <h3 style="margin-top:28px">Credential log (${CERTS.length} entries, newest first)</h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Issuer</th><th>Type</th><th>Completed</th></tr></thead><tbody>${certRows}</tbody></table></div>
    <p class="muted">The 33+ total includes earlier certificates that are not in this table yet; the log grows as they are added.</p>
  </section>
  <section class="block"><span class="eyebrow">Projects</span><h2>Selected work</h2>
    <div class="grid g3">${projects.map(([n, d]) => cardStatic('◆', esc(n), esc(d))).join('')}</div>
  </section>
  <section class="block"><span class="eyebrow">Skills</span><h2>Toolbox</h2>
    <p>${['Python', 'pandas', 'SQL', 'Power BI', 'Excel', 'Django', 'React', 'FastAPI', 'Machine learning', 'Deep learning', 'RAG', 'Docker', 'Git & GitHub'].map((s) => `<span class="chip">${s}</span>`).join('')}</p>
  </section>
  <section class="block"><span class="eyebrow">Contact</span><h2>Based in Warangal, Telangana</h2>
    <div class="prose"><p>Open to internships and collaborations in software, AI/ML, data and cloud. The fastest way to reach me is <a class="link" href="mailto:${a.email}">${a.email}</a>.</p></div>
    <div class="row"><a class="btn" href="/lookup?q=${encodeURIComponent(a.name)}">See my name in 10 languages</a><a class="btn" href="/names/nikhil">Meaning of “Nikhil”</a></div>
  </section>
</div>`,
};


/* ============================== WORD OF THE DAY ============================== */
const wotd = {
  path: '/word-of-the-day', slug: 'word-of-the-day', crumbs: crumb([{ name: 'Word of the day', path: '/word-of-the-day' }]),
  title: 'Word of the day — a new word every day | Dictionary',
  description: 'A new English word every day with its definition, IPA pronunciation, example and origin, then jump into the full lookup to explore synonyms and flashcards.',
  og: 'og-lookup.png', priority: 0.7, changefreq: 'daily', scripts: ['wotd.js'],
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Word of the day', url: '__SITE__/word-of-the-day', isPartOf: { '@type': 'WebSite', name: site.name, url: '__SITE__' } }],
  body: () => `
<div class="wrap page-top prose">
  __CRUMBS__
  <h1>Word of the day</h1>
  <p class="lead" id="wotd-date">Today</p>
  <section class="card" style="padding:28px">
    <p class="script-big" id="wotd-word" style="font-size:clamp(36px,8vw,64px);margin:0">…</p>
    <div id="wotd-def" aria-live="polite"><div id="wotd"><p class="muted">Loading today’s definition…</p></div></div>
    <div class="row"><a class="btn primary" id="wotd-link" href="/lookup">Explore in Lookup →</a><a class="btn" href="/names">Browse name meanings</a></div>
  </section>
  <noscript><p>This page needs JavaScript to show today’s word. You can still use <a href="/lookup">Lookup</a>.</p></noscript>
</div>`,
};


/* ============================== AGENTS ============================== */
const agentsPage = {
  path: '/agents', slug: 'agents', crumbs: crumb([{ name: 'Agentic AI demo', path: '/agents' }]),
  title: 'Agentic AI demo — watch four agents answer | Dictionary',
  description: 'Run a live four-agent pipeline (router, retriever, specialist, validator) and see every hand-off, the evidence retrieved and a sentence-by-sentence grounding check.',
  og: 'og-features.png', priority: 0.8, changefreq: 'monthly', styles: ['lookup.css'], scripts: ['agents.js'],
  jsonld: () => [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Dictionary agent pipeline demo', url: '__SITE__/agents', applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, author: { '@type': 'Person', name: a.name } }],
  body: () => `
<div class="wrap page-top">
  __CRUMBS__
  <h1>Agentic AI, with the lid off</h1>
  <p class="lead">Ask for a word or a name. Four agents hand work to each other and you can see every step: what was retrieved, what was drafted, and which sentences the validator could not support.</p>
  <form id="aform" class="agent-form" autocomplete="off"><input id="aq" type="text" maxlength="120" placeholder="Nikhil · serendipity · What does Chary mean?" aria-label="Ask the agents"><button class="btn primary">Run agents</button></form>
  <p id="ex" aria-label="Examples"></p>
  <p class="muted" id="mode"></p>
  <ol class="steps" id="trace" aria-live="polite"></ol>
  <section class="card" id="answer" hidden>
    <div class="row"><span class="chip" id="ans-tag"></span><span class="muted" id="ans-score"></span></div>
    <p id="ans-text" style="margin-top:12px"></p>
    <p class="muted">Highlighted sentences scored below the grounding threshold, so they are flagged rather than trusted.</p>
  </section>
  <div class="prose"><h2>What is real here</h2><ul>
    <li><b>Routing, retrieval and validation run in your browser</b> on the curated names lexicon and the Wiktionary-derived dictionary.</li>
    <li><b>The drafting step</b> is deterministic until you add a free Groq or Gemini key on the Lookup page; then a model drafts and the same validator checks it.</li>
    <li><b>The production backend</b> (FastAPI) runs the same hand-offs with hybrid BM25 + vector retrieval and a stricter validator. See <a class="link" href="/architecture">architecture</a> and <a class="link" href="/security">security</a>.</li>
  </ul></div>
</div>`,
};

/* ============================== PRIVACY ============================== */
const privacy = {
  path: '/privacy', slug: 'privacy', crumbs: crumb([{ name: 'Privacy', path: '/privacy' }]),
  title: 'Privacy policy | Dictionary',
  description: 'What Dictionary stores in your browser, what it sends to third parties when you look things up, and what it never collects.',
  og: 'og-privacy.png', priority: 0.3, changefreq: 'yearly',
  jsonld: () => [],
  body: () => `
<div class="wrap page-top prose">
  __CRUMBS__
  <h1>Privacy policy</h1>
  <p class="lead">Short version: there are no accounts, no analytics and no ads. Your lookups stay in your browser.</p>
  <h2>Stored in your browser</h2>
  <ul><li><b>Lookup cache and flashcards</b> (localStorage) so previous words work offline and cards can be scheduled. Clear it any time in your browser settings.</li><li><b>Questions you send to LexiBot or “Resolve with AI”</b> go through this site’s <code>/api</code> functions to Groq or Gemini to be answered. They are not stored by this site, but the providers process them under their own terms. Names the AI resolves are cached in your browser (localStorage).</li><li><b>API keys you paste</b> for Groq or Gemini (sessionStorage) — removed when you close the tab.</li></ul>
  <h2>Sent to third parties</h2>
  <ul><li>An English word you search is sent to <b>dictionaryapi.dev</b> to fetch its entry.</li><li>If you use LexiBot or “Resolve with AI” with your own key, the question and the on-screen word or name context go to <b>Groq</b> and/or <b>Google Gemini</b> under their own terms.</li><li>Fonts are loaded from Google Fonts; the 3D library and on-device OCR and vision models are loaded from the jsDelivr CDN.</li></ul>
  <h2>Camera and photos</h2>
  <p>Text and object recognition run inside your browser tab. Images are not uploaded and are discarded after recognition.</p>
  <h2>Optional backend</h2>
  <p>If you deploy the optional server, it keeps no images, applies per-IP rate limits (counters expire automatically) and stores only data you choose to save, such as vocabulary lists or a submitted neologism.</p>
  <h2>Contact</h2>
  <p>Questions? Email <a class="link" href="mailto:${a.email}">${a.email}</a>. Last updated November 2026.</p>
</div>`,
};

/* ============================== 404 ============================== */
const notFound = {
  path: '/404', file: '404.html', slug: '404', noindex: true, noSitemap: true,
  title: 'Page not found | Dictionary',
  description: 'The page you were looking for does not exist. Search for a word or name instead.',
  og: 'og-default.png',
  body: () => `
<div class="wrap page-top nf">
  <div class="code" aria-hidden="true">404</div>
  <h1>This page doesn’t exist</h1>
  <p class="lead" style="margin-inline:auto">The link may be old or mistyped. Look up a word or name instead, or head back to a page that does exist.</p>
  <form class="hq" action="/lookup" method="get" role="search"><label class="sr" for="nf-q">Search a word or name</label><input id="nf-q" name="q" type="search" placeholder="Search a word or a name" maxlength="80" autocomplete="off"><button type="submit">Search</button></form>
  <div class="row" style="justify-content:center"><a class="btn primary" href="/">Home</a><a class="btn" href="/names">Browse names</a><a class="btn" href="/features">Features</a></div>
</div>`,
};

export const pages = [home, lookup, namesIndex, ...namePages, wotd, agentsPage, features, architecture, security, about, privacy, notFound];
