// Dadiosity Daily sender -- Cloudflare Pages Function at an unguessable path.
// One GET with ?key=<SEND_TRIGGER_KEY> runs one daily pass:
//   * reads the "Dadiosity Daily" Resend audience
//   * every active contact gets the lesson numbered by its next_lesson
//     property (new subscribers start at Lesson 1)
//   * after a send is accepted by Resend, next_lesson advances by 1
//   * contacts past the end of the lesson store get nothing (no repeats,
//     no filler) and are counted as skipped
// It refuses to send anything unless every config value is present AND
// SEND_ENABLED is exactly "1". Any missing piece returns
// { ok:false, error:"unconfigured" } and zero sends happen.
// Test mode (?test=1&lesson=N) sends one lesson to TEST_EMAIL only and
// never touches real contacts or their progress.
// No tracking pixels, no click tracking, no read receipts.

import { LESSONS, subjectFor } from "../lessons-data.js";
import { unsubToken, unsubUrl } from "../lib/unsub.js";

const FROM = "Dadiosity <hello@dadiosity.com>";
const API = "https://api.resend.com";

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function bodyText(lesson, unsub, addr) {
  return [
    "Dadiosity Daily, Lesson " + lesson.n + ": " + lesson.theme,
    "",
    "THE IDEA",
    lesson.idea,
    "",
    "TONIGHT'S MOVE",
    lesson.move,
    "",
    "TONIGHT'S PLAY",
    lesson.play,
    "",
    "WHY IT WORKS",
    lesson.why,
    "",
    "Core move: " + lesson.core,
    "",
    "--",
    "You are getting this because you signed up for Dadiosity Daily at dadiosity.com.",
    "One lesson a day. No spam. No ads. We never sell your email.",
    "Stop lessons any time: " + unsub,
    "Dadiosity, " + addr
  ].join("\n");
}

function bodyHtml(lesson, unsub, addr) {
  const p = "margin:0 0 14px 0;";
  const h = "margin:18px 0 6px 0;font-size:12px;letter-spacing:1px;color:#9a6a1f;";
  return "<!doctype html><html><body style=\"margin:0;padding:0;background:#fdf8f1;\">" +
    "<div style=\"max-width:560px;margin:0 auto;padding:28px 22px;font-family:Georgia,serif;color:#2b2118;line-height:1.55;\">" +
    "<p style=\"margin:0 0 4px 0;font-size:12px;letter-spacing:2px;color:#9a6a1f;\">DADIOSITY DAILY</p>" +
    "<h1 style=\"margin:0 0 16px 0;font-size:24px;line-height:1.25;\">Lesson " + lesson.n + ": " + esc(lesson.theme) + "</h1>" +
    "<p style=\"" + h + "\">THE IDEA</p><p style=\"" + p + "\">" + esc(lesson.idea) + "</p>" +
    "<p style=\"" + h + "\">TONIGHT'S MOVE</p><p style=\"" + p + "\">" + esc(lesson.move) + "</p>" +
    "<p style=\"" + h + "\">TONIGHT'S PLAY</p><p style=\"" + p + "\">" + esc(lesson.play) + "</p>" +
    "<p style=\"" + h + "\">WHY IT WORKS</p><p style=\"" + p + "\">" + esc(lesson.why) + "</p>" +
    "<p style=\"background:#f4e8d4;border-radius:8px;padding:12px 14px;margin:18px 0;\"><strong>Core move:</strong> " + esc(lesson.core) + "</p>" +
    "<hr style=\"border:none;border-top:1px solid #e3d5bd;margin:22px 0;\">" +
    "<p style=\"font-size:12px;color:#7a6a55;margin:0 0 6px 0;\">You are getting this because you signed up for Dadiosity Daily at dadiosity.com. One lesson a day. No spam. No ads. We never sell your email.</p>" +
    "<p style=\"font-size:12px;color:#7a6a55;margin:0 0 6px 0;\"><a href=\"" + unsub + "\" style=\"color:#7a6a55;\">Stop lessons any time</a></p>" +
    "<p style=\"font-size:12px;color:#7a6a55;margin:0;\">Dadiosity, " + esc(addr) + "</p>" +
    "</div></body></html>";
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

async function fetchAllContacts(env, aud) {
  const all = [];
  let after = null;
  for (let page = 0; page < 50; page++) {
    const q = "/audiences/" + aud + "/contacts?limit=100" + (after ? "&after=" + encodeURIComponent(after) : "");
    const r = await resend(env, "GET", q);
    if (r.status !== 200 || !r.json) throw new Error("contacts list failed: " + r.status);
    const data = r.json.data || [];
    all.push.apply(all, data);
    if (!r.json.has_more || data.length === 0) break;
    after = data[data.length - 1].id;
  }
  return all;
}

function prop(contact, key, fallback) {
  const p = (contact.properties || {})[key];
  if (p && p.value !== null && p.value !== undefined) return p.value;
  return fallback;
}

async function sendOne(env, to, lesson) {
  const token = await unsubToken(env.UNSUBSCRIBE_SECRET, to);
  const unsub = unsubUrl(to, token);
  const addr = env.DADIOSITY_POSTAL_ADDRESS;
  return resend(env, "POST", "/emails", {
    from: FROM,
    to: [to],
    subject: subjectFor(lesson),
    text: bodyText(lesson, unsub, addr),
    html: bodyHtml(lesson, unsub, addr),
    headers: {
      "List-Unsubscribe": "<" + unsub + ">",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    }
  });
}

function configured(env) {
  return !!(env.RESEND_API_KEY && env.DADIOSITY_AUDIENCE_ID &&
    env.DADIOSITY_POSTAL_ADDRESS && env.UNSUBSCRIBE_SECRET &&
    env.SEND_TRIGGER_KEY && env.SEND_ENABLED === "1");
}

function jsonOut(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const env = context.env;
  const url = new URL(context.request.url);

  if (!env.SEND_TRIGGER_KEY || url.searchParams.get("key") !== env.SEND_TRIGGER_KEY) {
    return new Response("not found", { status: 404 });
  }
  if (!configured(env)) {
    return jsonOut({ ok: false, error: "unconfigured" }, 200);
  }

  const aud = env.DADIOSITY_AUDIENCE_ID;

  // Test mode: one lesson to TEST_EMAIL only; real contacts untouched.
  if (url.searchParams.get("test") === "1") {
    if (!env.TEST_EMAIL) return jsonOut({ ok: false, error: "no-test-email" });
    const n = parseInt(url.searchParams.get("lesson") || "1", 10);
    const lesson = LESSONS.find(function (l) { return l.n === n; });
    if (!lesson) return jsonOut({ ok: false, error: "no-such-lesson" });
    const r = await sendOne(env, env.TEST_EMAIL, lesson);
    const ok = r.status >= 200 && r.status < 300;
    return jsonOut({ ok: ok, mode: "test", lesson: n, resend_status: r.status });
  }

  let contacts;
  try {
    contacts = await fetchAllContacts(env, aud);
  } catch (e) {
    return jsonOut({ ok: false, error: "contacts-fetch-failed" }, 502);
  }

  const summary = {
    ok: true,
    date: new Date().toISOString().slice(0, 10),
    contacts: contacts.length,
    due: 0, sent: 0, failed: 0, skipped_exhausted: 0, skipped_inactive: 0,
    lessons_available: LESSONS.length
  };

  for (const c of contacts) {
    const status = prop(c, "status", "active");
    if (c.unsubscribed || status !== "active") { summary.skipped_inactive++; continue; }
    const n = parseInt(prop(c, "next_lesson", 1), 10) || 1;
    const lesson = LESSONS.find(function (l) { return l.n === n; });
    if (!lesson) { summary.skipped_exhausted++; continue; }
    summary.due++;
    const r = await sendOne(env, c.email, lesson);
    if (r.status >= 200 && r.status < 300) {
      summary.sent++;
      await resend(env, "PATCH", "/audiences/" + aud + "/contacts/" + c.id, {
        properties: { next_lesson: n + 1 }
      });
    } else {
      summary.failed++;
    }
  }

  console.log(JSON.stringify(summary));
  return jsonOut(summary);
}
