// POST /signup -- Dadiosity holding-page email capture.
//
// Trust model (mirrors Pick My Costume's reminder-signup.js):
// - The client may ONLY supply {email}. No other fields are accepted.
// - Storage: the address is stored in a Cloudflare KV namespace
//   (env.SIGNUPS), one key per address, with a timestamp. Nothing is
//   sent from this function; a launch note goes out only with Billy's
//   explicit approval of the exact content.
// - Without the KV binding the function answers {ok:false,
//   reason:"unconfigured"} so the frontend degrades honestly instead
//   of pretending to save.
// - Per-IP rate limit (in-memory, per isolate; fine at this volume).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map(); // ip -> {start, count}
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > WINDOW_MS) { hits.set(ip, { start: now, count: 1 }); return false; }
  h.count++;
  return h.count > MAX_PER_WINDOW;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body = {};
  try { body = await request.json(); } catch (e) { return json({ ok: false, reason: 'bad-body' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ ok: false, reason: 'bad-email' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, reason: 'rate-limited' }, 429);

  if (!env.SIGNUPS) return json({ ok: false, reason: 'unconfigured' });

  try {
    const existing = await env.SIGNUPS.get(email);
    await env.SIGNUPS.put(email, JSON.stringify({
      email: email,
      ts: new Date().toISOString(),
      source: 'holding-page'
    }));
    return json({ ok: true, duplicate: !!existing });
  } catch (e) {
    return json({ ok: false, reason: 'provider-error' }, 502);
  }
}
