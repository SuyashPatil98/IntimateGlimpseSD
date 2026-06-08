// Lightweight API client for the cockpit (exposed on window.API).
// Dev server proxies /api -> http://localhost:8000 (see vite.config.js).

async function get(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error("GET " + path + " -> " + r.status);
  return r.json();
}

async function post(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return r.json();
}

// Stream POST /api/ask (or a session ask). Parses the SSE event stream and
// dispatches to handlers: onSources / onBackend / onChunk / onNotice / onError / onDone.
async function streamAsk(question, sessionId, h) {
  const path = sessionId ? `/api/session/${sessionId}/ask` : "/api/ask";
  let res;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch (e) {
    h.onError && h.onError("backend unreachable — is the API running on :8000? (" + e.message + ")");
    h.onDone && h.onDone();
    return;
  }
  if (!res.body) { h.onError && h.onError("no response body"); h.onDone && h.onDone(); return; }

  const reader = res.body.getReader();
  const dec = new TextDecoder("utf-8");
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop();
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        let ev;
        try { ev = JSON.parse(data); } catch { continue; }
        switch (ev.type) {
          case "sources": h.onSources && h.onSources(ev.sources || []); break;
          case "backend": h.onBackend && h.onBackend(ev); break;
          case "chunk":   h.onChunk && h.onChunk(ev.text || ""); break;
          case "notice":  h.onNotice && h.onNotice(ev.text || ""); break;
          case "error":   h.onError && h.onError(ev.text || "error"); break;
          default: break;
        }
      }
    }
  }
  h.onDone && h.onDone();
}

window.API = { get, post, streamAsk };
