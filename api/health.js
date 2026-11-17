import { ai, send } from './_lib/http.js';
// Tells the browser whether server-side AI is configured (booleans only, never key material).
export default function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { detail: 'GET only' }, { Allow: 'GET' });
  return send(res, 200, { ok: true, mode: 'serverless', providers: ai.providers() });
}
