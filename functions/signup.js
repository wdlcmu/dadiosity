export async function onRequestPost(context) {
  const { request } = context;
  const raw = await request.text();
  let parsed = null, err = null;
  try { parsed = JSON.parse(raw); } catch (e) { err = String(e); }
  return new Response(JSON.stringify({
    ct: request.headers.get('content-type'),
    cl: request.headers.get('content-length'),
    te: request.headers.get('transfer-encoding'),
    rawLen: raw.length,
    rawHead: raw.slice(0, 80),
    parsed: parsed, err: err
  }), { headers: { 'Content-Type': 'application/json' } });
}
