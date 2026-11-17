// Audits dist/ against the launch checklist. Exit code 1 on any failure. Run after `npm run build`.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [], notes = [];
const fail = (page, msg) => errors.push(`${page}: ${msg}`);

async function walk(d) { const out = []; for (const e of await fs.readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? out.push(...(await walk(p))) : out.push(p); } return out; }
const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
async function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]) || '/';
  if (clean === '/') return true;
  for (const c of [clean, clean + '.html', path.join(clean, 'index.html')]) if (await exists(path.join(dist, c))) return true;
  return false;
}

const files = await walk(dist);
const htmls = files.filter((f) => f.endsWith('.html') && path.basename(f) !== 'offline.html'); // offline.html is the PWA fallback shell (noindex, intentionally minimal)
const titles = new Map(), descs = new Map();
const BAD_TITLE = /\b(react app|vite|create react app|untitled|document|white|lorem|placeholder)\b/i;
const PLACEHOLDER = /lorem ipsum|your text here|coming soon|todo|placeholder text|example\.com|yourdomain/i;

for (const f of htmls) {
  const rel = path.relative(dist, f), html = await fs.readFile(f, 'utf8');
  const g = (re) => (html.match(re) || [])[1];
  const title = g(/<title>([^<]*)<\/title>/), desc = g(/<meta name="description" content="([^"]*)"/), canon = g(/<link rel="canonical" href="([^"]*)"/);
  if (!title) fail(rel, 'missing <title>'); else { if (title.length > 70) fail(rel, `title too long (${title.length})`); if (BAD_TITLE.test(title)) fail(rel, `generic title: ${title}`); if (titles.has(title)) fail(rel, `duplicate title with ${titles.get(title)}`); titles.set(title, rel); }
  if (!desc) fail(rel, 'missing meta description'); else { if (desc.length < 50 || desc.length > 170) fail(rel, `description length ${desc.length}`); if (descs.has(desc)) fail(rel, `duplicate description with ${descs.get(desc)}`); descs.set(desc, rel); }
  if (!canon || !/^https?:\/\//.test(canon)) fail(rel, 'canonical missing or not absolute');
  const h1 = (html.match(/<h1[\s>]/g) || []).length; if (h1 !== 1) fail(rel, `expected exactly 1 <h1>, found ${h1}`);
  if (!/<html lang="/.test(html)) fail(rel, 'missing html lang');
  for (const k of ['og:title', 'og:description', 'og:image', 'og:url']) if (!html.includes(`property="${k}"`)) fail(rel, `missing ${k}`);
  if (!html.includes('name="twitter:card"')) fail(rel, 'missing twitter:card');
  const og = g(/property="og:image" content="[^"]*?\/([^\/"]+)"/); if (og && !(await exists(path.join(dist, og)))) fail(rel, `og image file missing: ${og}`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) fail(rel, `<img> without alt: ${m[0].slice(0, 80)}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(rel, 'invalid JSON-LD'); } if (m[1].includes('__SITE__')) fail(rel, 'unreplaced __SITE__ in JSON-LD'); }
  if (html.includes('__CRUMBS__')) fail(rel, 'unreplaced breadcrumb token');
  if (PLACEHOLDER.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/placeholder="[^"]*"/g, ''))) fail(rel, 'placeholder-looking text found');
  for (const m of html.matchAll(/\b(?:href|src)="(\/[^"#?][^"]*|\/(?=["#?]))/g)) { const p = m[1]; if (p.startsWith('//')) continue; if (!(await resolves(p))) fail(rel, `broken internal reference ${p}`); }
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) { const h = m[1]; if (/^https?:\/\//.test(h) && !/rel="[^"]*noopener/.test(m[0]) && /target="_blank"/.test(m[0])) fail(rel, `external _blank link without noopener: ${h}`); }
  if (rel !== '404.html' && !/rel="canonical"/.test(html)) fail(rel, 'no canonical');
  if (rel === '404.html' && !/noindex/.test(html)) fail(rel, '404 should be noindex');
  if (rel !== '404.html' && /noindex/.test(html)) fail(rel, 'unexpected noindex');
  const bc = /BreadcrumbList/.test(html); if (rel !== 'index.html' && rel !== '404.html' && !bc) fail(rel, 'no breadcrumb schema');
}

// assets: no source maps; relative imports resolve; sizes
let jsTotal = 0;
for (const f of files) {
  const rel = path.relative(dist, f);
  if (f.endsWith('.map')) fail(rel, 'source map shipped');
  if (/\.(js|css)$/.test(f)) {
    const src = await fs.readFile(f, 'utf8'); if (/sourceMappingURL/.test(src)) fail(rel, 'sourceMappingURL comment present');
    if (f.endsWith('.js')) { jsTotal += src.length; for (const m of src.matchAll(/from\s*['"](\.[^'"]+)['"]/g)) if (!(await exists(path.resolve(path.dirname(f), m[1])))) fail(rel, `unresolved import ${m[1]}`); }
  }
}
notes.push(`JS shipped: ${(jsTotal / 1024).toFixed(1)} KB total across modules (largest single page loads: home ≈ site+hero, lookup ≈ site+lookup+bot+lexicon+names-data)`);

for (const need of ['sitemap.xml', 'robots.txt', 'llms.txt', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest', '404.html']) if (!(await exists(path.join(dist, need)))) fail(need, 'missing from dist');
const sm = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8').catch(() => '');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
for (const p of locs) if (!(await resolves(p))) fail('sitemap.xml', `lists ${p} which has no page`);
const indexable = htmls.filter((f) => !/404\.html$/.test(f)).length;
if (locs.length !== indexable) fail('sitemap.xml', `lists ${locs.length} URLs but ${indexable} indexable pages exist`);
const robots = await fs.readFile(path.join(dist, 'robots.txt'), 'utf8').catch(() => '');
if (!/Sitemap:\s*https?:\/\//.test(robots)) fail('robots.txt', 'no absolute Sitemap line');

console.log(notes.join('\n'));
console.log(`checked ${htmls.length} pages, ${files.length} files`);
if (errors.length) { console.error(`\n✗ ${errors.length} problem(s):\n` + errors.map((e) => '  - ' + e).join('\n')); process.exit(1); }
console.log('✓ all checks passed');
