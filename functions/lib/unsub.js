// Shared unsubscribe-token helpers for Dadiosity Daily.
// A token is an HMAC-SHA256 of the subscriber email, keyed by the
// UNSUBSCRIBE_SECRET env var. Tokens appear only inside that
// subscriber's own email links. No email address is ever logged.

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function unsubToken(secret, email) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase()));
  return b64url(new Uint8Array(sig));
}

export async function unsubTokenValid(secret, email, token) {
  if (!secret || !email || !token) return false;
  const expected = await unsubToken(secret, email);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export function unsubUrl(email, token) {
  return "https://dadiosity.com/unsubscribe?e=" +
    encodeURIComponent(email) + "&t=" + encodeURIComponent(token);
}
