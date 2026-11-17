// Shared request pipeline for the AI endpoints: method, origin, size, rate limits, error mapping. No secrets are ever echoed.
import { AIError, createAI, createLimiter, originOk } from './ai.js';

export const ai = createAI();
const perIp = createLimiter({ limit: 20, windowMs: 60_000 });
const budget = createLimiter({ limit: 900, windowMs: 3600_000 }); // protects the free-tier quota across all visitors (per instance)
const MAX_BODY = 16 * 1024;

export function send(res, status, body, extra = {}) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.status(status).json(body);
}

export const route = (run, { limiter = perIp, shared = budget } = {}) => async (req, res) => {
  try {
    if (req.method !== 'POST') return send(res, 405, { detail: 'POST only' }, { Allow: 'POST' });
    if (!originOk(req.headers)) return send(res, 403, { detail: 'cross-origin requests are not allowed' });
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const a = limiter(ip);
    if (!a.ok) return send(res, 429, { detail: 'Too many requests, slow down a little.' }, { 'Retry-After': String(a.retry) });
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (JSON.stringify(body).length > MAX_BODY) return send(res, 413, { detail: 'request too large' });
    const b = shared('all');
    if (!b.ok) return send(res, 429, { detail: 'The free AI quota is busy, try again shortly.' }, { 'Retry-After': String(b.retry) });
    return send(res, 200, await run(body));
  } catch (e) {
    if (e instanceof AIError) return send(res, e.status === 429 ? 503 : e.status >= 400 && e.status < 600 && e.code !== 'http' ? e.status : 502, { detail: e.message });
    return send(res, 500, { detail: 'Unexpected server error' });
  }
};
