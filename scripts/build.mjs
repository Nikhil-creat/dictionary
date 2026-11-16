// Static site generator: src/ + scripts/pages.mjs -> dist/
// No source maps are ever written. JS/CSS are minified with esbuild when it is installed (it is on Vercel).
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../site.config.mjs';
import { pages } from './pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function resolveSiteUrl() {
  const env = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (env) return /^https?:\/\//.test(env) ? env : 'https://' + env;
  const v = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (v) return 'https://' + v.replace(/^https?:\/\//, '');
  return site.fallbackUrl;
}
const SITE = resolveSiteUrl();
const API_BASE = (process.env.API_BASE || '').trim().replace(/\/+$/, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => SITE + (p === '/' ? '/' : p);

let esbuild = null;
try { esbuild = await import('esbuild'); } catch { /* optional */ }

async function copyDir(src, dst, stats) {
  await fs.mkdir(dst, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { await copyDir(s, d, stats); continue; }
    if (e.name.endsWith('.map')) continue; // never ship source maps
    if (esbuild && (e.name.endsWith('.js') || e.name.endsWith('.css'))) {
      const code = await fs.readFile(s, 'utf8');
      const r = await esbuild.transform(code, { loader: e.name.endsWith('.js') ? 'js' : 'css', minify: true, target: 'es2020', sourcemap: false, legalComments: 'none' });
      await fs.writeFile(d, r.code);
      stats.min += 1;
    } else await fs.copyFile(s, d);
  }
}

const businessLd = () => {
  const b = site.business;
  if (!b.enabled) return null;
  return {
    '@context': 'https://schema.org', '@type': b.type, '@id': SITE + '/#business', name: b.name, description: b.description, url: SITE + '/',
    image: SITE + '/og-default.png', logo: SITE + '/icon-512.png',
    address: { '@type': 'PostalAddress', addressLocality: b.address.locality, addressRegion: b.address.region, addressCountry: b.address.country },
    areaServed: b.areaServed.map((n) => ({ '@type': 'Place', name: n })),
    founder: { '@type': 'Person', name: site.author.name },
    email: site.author.email, sameAs: [site.author.github, site.author.linkedin],
  };
};

const NAV = [['/names', 'Names'], ['/agents', 'Agents'], ['/features', 'Features'], ['/architecture', 'Architecture'], ['/security', 'Security'], ['/about', 'About']];

function header(page) {
  const here = (p) => (page.path === p || page.path.startsWith(p + '/') ? ' aria-current="page"' : '');
  return `<header class="site-header">
  <a class="brand" href="/" aria-label="${esc(site.name)} home"><img src="/favicon.svg" width="30" height="30" alt="" decoding="async">${esc(site.name)}</a>
  <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="site-nav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M7 12h10M5 16h14"/></svg></button>
  <nav class="nav" id="site-nav" aria-label="Primary" data-open="false">
    ${NAV.map(([p, n]) => `<a href="${p}"${here(p)}>${n}</a>`).join('\n    ')}
    <a class="cta" href="/lookup"${here('/lookup')}>Lookup</a>
  </nav>
</header>`;
}
function footer() {
  const a = site.author, y = new Date().getFullYear();
  return `<footer class="site-footer"><div class="wrap">
  <div class="foot">
    <div><a class="brand" href="/"><img src="/favicon.svg" width="30" height="30" alt="" loading="lazy" decoding="async">${esc(site.name)}</a><p>${esc(site.tagline)}. Definitions, etymology and name meanings in ten languages, with AI that shows its sources.</p></div>
    <div><h2>Explore</h2><ul><li><a href="/lookup">Lookup</a></li><li><a href="/names">Name meanings</a></li><li><a href="/word-of-the-day">Word of the day</a></li><li><a href="/agents">Agentic AI demo</a></li><li><a href="/features">Features</a></li></ul></div>
    <div><h2>Project</h2><ul><li><a href="/architecture">Architecture</a></li><li><a href="/security">Security &amp; limitations</a></li><li><a href="${site.repo}" rel="noopener">Source on GitHub</a></li></ul></div>
    <div><h2>Connect</h2><ul><li><a href="/about">About ${esc(a.name.split(' ')[0])}</a></li><li><a href="${a.github}" rel="me noopener">GitHub</a></li><li><a href="${a.linkedin}" rel="me noopener">LinkedIn</a></li><li><a href="mailto:${a.email}">Email</a></li></ul></div>
  </div>
  <div class="legal"><span>© ${y} ${esc(a.name)}. Warangal, Telangana, India.</span><span><a href="/privacy">Privacy</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="/llms.txt">llms.txt</a></span></div>
</div></footer>`;
}
function breadcrumbs(page) {
  if (!page.crumbs) return { html: '', ld: null };
  const items = [{ name: 'Home', path: '/' }, ...page.crumbs];
  const html = `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map((c, i) => (i === items.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${c.path}">${esc(c.name)}</a></li>`)).join('')}</ol></nav>`;
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })) };
  return { html, ld };
}

function render(page) {
  const { html: crumbHtml, ld: crumbLd } = breadcrumbs(page);
  const url = abs(page.path === '/404' ? '/' : page.path);
  const og = `${SITE}/${page.og || 'og-default.png'}`;
  const ogAlt = `${site.name}: ${page.title.split('|')[0].trim()}`;
  const ld = [...(page.jsonld ? page.jsonld() : []), ...(crumbLd ? [crumbLd] : []), ...(page.business ? [businessLd()].filter(Boolean) : [])];
  const ldJson = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/__SITE__/g, SITE).replace(/</g, '\\u003c')}</script>`).join('\n');
  const styles = ['site.css', ...(page.hero ? ['hero.css'] : []), ...(page.styles || [])];
  const scripts = ['site.js', ...(page.hero ? ['hero.js'] : []), ...(page.scripts || [])];
  const body = page.body().replace('__CRUMBS__', crumbHtml);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="${site.themeColor}">
<meta name="color-scheme" content="dark">
<meta name="author" content="${esc(site.author.name)}">
<meta name="keywords" content="${esc((page.keywords || site.keywords).join(', '))}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${og}">
<meta name="twitter:image:alt" content="${esc(ogAlt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${API_BASE && page.slug === 'lookup' ? `<meta name="dict-api-base" content="${esc(API_BASE)}">\n` : ''}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;800;900&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Sans+Tamil:wght@400;600&family=Noto+Sans+Arabic:wght@400;600&family=Noto+Sans+JP:wght@400;600&family=Noto+Sans+SC:wght@400;600&display=swap">
${styles.map((s) => `<link rel="stylesheet" href="/assets/css/${s}">`).join('\n')}
${ldJson}
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
${header(page)}
<main id="main">
${body}
</main>
${footer()}
${scripts.map((s) => `<script type="module" src="/assets/js/${s}"></script>`).join('\n')}
</body>
</html>
`;
}

const stats = { min: 0 };
await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });
await copyDir(path.join(root, 'src/assets'), path.join(dist, 'assets'), stats);
await copyDir(path.join(root, 'public'), dist, stats);

const today = new Date().toISOString().slice(0, 10);
for (const p of pages) {
  const file = p.file || (p.path === '/' ? 'index.html' : p.path.replace(/^\//, '') + '.html');
  const target = path.join(dist, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, render(p));
}

const indexable = pages.filter((p) => !p.noindex && !p.noSitemap);
await fs.writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq || 'monthly'}</changefreq><priority>${(p.priority ?? 0.5).toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`);
await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`);
const byPrefix = (pre) => indexable.filter((p) => p.path.startsWith(pre) && p.path !== pre);
await fs.writeFile(path.join(dist, 'llms.txt'), `# ${site.name}

> ${site.description}

Dictionary looks up English words (definitions, IPA, register, etymology) and personal names (origin and meaning in ten languages and scripts). Every claim carries a confidence tag; anything the retrieval corpus cannot support is marked unverified rather than invented. Built by ${site.author.name} (${site.author.role}).

## Main pages
${indexable.filter((p) => !p.path.startsWith('/names/')).map((p) => `- [${p.title.split('|')[0].trim()}](${abs(p.path)}): ${p.description}`).join('\n')}

## Curated name pages
${byPrefix('/names/').map((p) => `- [${p.title.split('|')[0].trim()}](${abs(p.path)})`).join('\n')}

## Source
- [GitHub repository](${site.repo})
`);

console.log(`✓ built ${pages.length} pages → dist/  (site url: ${SITE}${API_BASE ? ', api: ' + API_BASE : ''})`);
console.log(esbuild ? `✓ minified ${stats.min} JS/CSS files with esbuild` : '• esbuild not installed locally — assets copied unminified (Vercel installs it and minifies)');
