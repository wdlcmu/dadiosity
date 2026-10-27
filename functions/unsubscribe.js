// Dadiosity Daily unsubscribe endpoint: GET or POST /unsubscribe?e=<email>&t=<token>
// The token is the per-subscriber HMAC from lib/unsub.js and travels only
// inside that subscriber's own lesson emails (List-Unsubscribe header and
// the footer link). A valid request marks the Resend contact unsubscribed
// and sets its status property to "left" -- permanent: the daily sender
// never emails that address again unless the person signs up fresh on
// the site (which resets them to Lesson 1, per the launch packet).
// Invalid or missing tokens get an honest error page. Nothing is logged
// beyond counts on the sender side; this page logs nothing at all.

import { unsubTokenValid } from "./lib/unsub.js";

const API = "https://api.resend.com";

function page(title, line) {
  const html = "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<title>" + title + " - Dadiosity</title></head>" +
    "<body style=\"margin:0;background:#fdf8f1;font-family:Georgia,serif;color:#2b2118;\">" +
    "<div style=\"max-width:520px;margin:12vh auto;padding:0 22px;text-align:center;\">" +
    "<p style=\"font-size:12px;letter-spacing:2px;color:#9a6a1f;\">DADIOSITY DAILY</p>" +
    "<h1 style=\"font-size:26px;\">" + title + "</h1>" +
    "<p style=\"line-height:1.55;\">" + line + "</p>" +
    "<p><a href=\"https://dadiosity.com\" style=\"color:#9a6a1f;\">Back to dadiosity.com</a></p>" +
    "</div></body></html>";
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function onRequest(context) {
  const env = context.env;
  const url = new URL(context.request.url);
  const email = (url.searchParams.get("e") || "").toLowerCase();
  const token = url.searchParams.get("t") || "";

  const ready = !!(env.RESEND_API_KEY && env.DADIOSITY_AUDIENCE_ID && env.UNSUBSCRIBE_SECRET);
  if (!ready) {
    return page("Not ready yet", "Unsubscribe is not switched on yet. If a lesson email reached you, reply to it and we will stop them by hand.");
  }
  if (!(await unsubTokenValid(env.UNSUBSCRIBE_SECRET, email, token))) {
    return page("That link did not check out", "The stop link was not valid, so nothing changed. Use the link inside any Dadiosity Daily email, or reply to one and we will stop them by hand.");
  }

  const aud = env.DADIOSITY_AUDIENCE_ID;
  const headers = {
    "Authorization": "Bearer " + env.RESEND_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "curl/8.5.0"
  };

  // Find the contact by email, then mark it left + unsubscribed.
  const got = await fetch(API + "/audiences/" + aud + "/contacts/" + encodeURIComponent(email), { headers: headers });
  if (got.status !== 200) {
    return page("Already stopped", "That address is not on the list, so no lessons will go to it.");
  }
  const contact = await got.json();
  const patched = await fetch(API + "/audiences/" + aud + "/contacts/" + contact.id, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify({ unsubscribed: true, properties: { status: "left" } })
  });
  if (patched.status < 200 || patched.status >= 300) {
    return page("Something went wrong", "We could not update the list just now. Reply to any lesson email and we will stop them by hand.");
  }
  return page("You are unsubscribed", "No more daily lessons will go to that address. If you ever want them again, sign up fresh on dadiosity.com and they start again at Lesson 1.");
}
