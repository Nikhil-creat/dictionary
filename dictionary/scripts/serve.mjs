// Tiny static server that mimics Vercel's cleanUrls + custom 404 for local testing. Usage: node scripts/serve.mjs [port]
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2] || process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

async function find(p) {
  const clean = path.normalize(decodeURIComponent(p)).replace(/^(\.\.[/\\])+/, '');
  for (const c of [clean, clean + '.html', path.join(clean, 'index.html')]) {
    const f = path.join(dist, c);
    if (!f.startsWith(dist)) return null;
    try { const s = await fs.stat(f); if (s.isFile()) return f; } catch { /* next */ }
  }
  return null;
}
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const f = await find(url.pathname);
    if (f) { res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); return res.end(await fs.readFile(f)); }
    res.writeHead(404, { 'Content-Type': types['.html'] }); res.end(await fs.readFile(path.join(dist, '404.html')));
  } catch { res.writeHead(500); res.end('error'); }
}).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`));
