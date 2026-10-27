// Dadiosity Daily signup endpoint: POST /signup  { email }
// Two storage modes, picked by what is configured on the project:
//   1. Resend mode (RESEND_API_KEY + DADIOSITY_AUDIENCE_ID set): the
//      address joins the "Dadiosity Daily" audience with properties
//      signup_date, next_lesson=1, status=active, source=holding-page.
//      A repeat signup reports a duplicate and changes nothing, EXCEPT a
//      person who left (status "left" / unsubscribed): signing up again
//      is a fresh, explicit opt-in, so they rejoin at Lesson 1.
//   2. KV fallback (keys not set yet): today's original behavior -- the
//      address is stored in the SIGNUPS KV namespace. Keeps the live form
//      working before the Resend keys land; behavior is identical either
//      way from the visitor's side.
// Same rate limit and honest errors as the original: 10 signups per hour
// per IP, and the endpoint never claims success it did not get.

const API = "https://api.resend.com";

function j(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

async function resend(env, method, path, body) {
  const res = await fetch(API + path, {
    method: method,
    headers: {
      "Authorization": "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "curl/8.5.0"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* keep null */ }
  return { status: res.status, json: json };
}

function freshProps() {
  return {
    signup_date: new Date().toISOString(),
    next_lesson: 1,
    status: "active",
    source: "holding-page"
  };
}

async function signupResend(env, email) {
  const aud = env.DADIOSITY_AUDIENCE_ID;
  const created = await resend(env, "POST", "/audiences/" + aud + "/contacts", {
    email: email,
    unsubscribed: false,
    properties: freshProps()
  });
  if (created.status >= 200 && created.status < 300) {
    return j({ ok: true });
  }
  // Already on the list? Then it is a duplicate (or a rejoin after leaving).
  const got = await resend(env, "GET", "/audiences/" + aud + "/contacts/" + encodeURIComponent(email));
  if (got.status === 200 && got.json) {
    const c = got.json;
    const statusProp = ((c.properties || {}).status || {}).value;
    if (c.unsubscribed || statusProp === "left") {
      const re = await resend(env, "PATCH", "/audiences/" + aud + "/contacts/" + c.id, {
        unsubscribed: false,
        properties: freshProps()
      });
      if (re.status >= 200 && re.status < 300) return j({ ok: true, rejoined: true });
      return j({ ok: false, error: "rejoin-failed" }, 502);
    }
    return j({ ok: true, duplicate: true });
  }
  return j({ ok: false, error: "list-unavailable" }, 502);
}

async function signupKV(env, email) {
  const store = env.SIGNUPS;
  if (!store) {
    return j({ ok: false, error: "unconfigured" }, 503);
  }
  const existing = await store.get(email);
  if (existing) {
    return j({ ok: true, duplicate: true });
  }
  await store.put(email, JSON.stringify({
    email: email,
    ts: new Date().toISOString(),
    source: "holding-page"
  }));
  return j({ ok: true });
}

export async function onRequestPost(context) {
  const env = context.env;

  // Rate limit: 10 signups per hour per IP. Honest failure mode: when
  // storage API rejects, return the real error status instead of a
  // fake success. Counts attempts only.
  const store = env.SIGNUPS;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  if (store && ip !== "unknown") {
    const rlKey = "rl:" + ip;
    const rlRaw = await store.get(rlKey);
    const now = Date.now();
    let hits = rlRaw ? JSON.parse(rlRaw) : [];
    hits = hits.filter(function (t) { return now - t < 3600000; });
    if (hits.length >= 10) {
      return j({ ok: false, error: "rate-limited" }, 429);
    }
    hits.push(now);
    await store.put(rlKey, JSON.stringify(hits), { expirationTtl: 3600 });
  }

  let email = "";
  try {
    const ct = context.request.headers.get("Content-Type") || "";
    if (ct.indexOf("application/json") !== -1) {
      const body = await context.request.json();
      email = (body && body.email) || "";
    } else {
      const form = await context.request.formData();
      email = form.get("email") || "";
    }
  } catch (e) {
    // fall through to validation below
  }
  email = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return j({ ok: false, error: "bad-email" }, 400);
  }

  if (env.RESEND_API_KEY && env.DADIOSITY_AUDIENCE_ID) {
    return signupResend(env, email);
  }
  return signupKV(env, email);
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return j({ ok: false, error: "method" }, 405);
  }
  return onRequestPost(context);
}
