/* global React, I, AREAS, StatusBadge, AreaDot, Card, PromoteModal */

const { useState, useEffect, useRef } = React;

const KIND_DEF = {
  gap:           { label: "GAP",    color: "var(--neon-amber)" },
  "status-fill": { label: "FILL",   color: "var(--neon-cyan)" },
  ingest:        { label: "SOURCE", color: "var(--accent-hi)" },
};

// =========================================================
// REVIEW QUEUE — the self-maintaining loop's front door
// =========================================================
const Ingest = () => {
  const [data, setData] = useState({ counts: {}, items: [] });
  const [busy, setBusy] = useState(null);
  const [drafting, setDrafting] = useState({});
  const [review, setReview] = useState(null);
  const [filter, setFilter] = useState("open");
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  const load = () => window.API.get("/api/review/queue").then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  const runAudit = async () => {
    setBusy("Scanning the vault for gaps + section-fills…"); setMsg(null);
    try {
      const r = await window.API.post("/api/review/run-audit", {});
      setMsg({ tone: "ok", text: `Audit complete — ${r.gaps} gaps + ${r.status_fills} section-fills queued` });
    } catch (e) { setMsg({ tone: "warn", text: "audit failed: " + e.message }); }
    finally { setBusy(null); load(); }
  };

  const ingestRaw = async () => {
    setBusy("Ingesting files already in raw/…"); setMsg(null);
    try {
      const r = await window.API.post("/api/ingest", {});
      setMsg(r.status === "ok"
        ? { tone: "ok", text: `Ingested ${(r.files || []).join(", ")} — ${r.queued} sections queued` }
        : { tone: "warn", text: r.message || "nothing to ingest" });
    } catch (e) { setMsg({ tone: "warn", text: "ingest failed: " + e.message }); }
    finally { setBusy(null); load(); }
  };

  const uploadFiles = async (files) => {
    files = Array.from(files || []);
    if (!files.length) return;
    setBusy(`Uploading + extracting ${files.length} file(s)…`); setMsg(null);
    let queued = 0;
    for (const f of files) {
      try {
        const r = await fetch("/api/ingest/upload",
          { method: "POST", headers: { "X-Filename": f.name }, body: f }).then(x => x.json());
        queued += (r.queued || 0);
      } catch { /* ignore one bad file */ }
    }
    setMsg({ tone: "ok", text: `Uploaded + ingested — ${queued} sections queued` });
    setBusy(null); load();
  };

  const draft = async (id) => {
    setDrafting(s => ({ ...s, [id]: true }));
    try { await window.API.post(`/api/review/${id}/draft`, {}); }
    catch { /* surfaced via status */ }
    finally { setDrafting(s => { const n = { ...s }; delete n[id]; return n; }); load(); }
  };

  const approve = async (content) => {
    if (!review) return;
    const r = await window.API.post(`/api/review/${review.id}/approve`, { content }).catch(() => ({}));
    const ok = r.status === "ok" && r.result && r.result.applied;
    setMsg(ok ? { tone: "ok", text: `Promoted to vault: ${review.title}` }
              : { tone: "warn", text: "approve was blocked by an integrity check — see the modal warnings" });
    setReview(null); load();
  };

  const reject = async (id) => {
    await window.API.post(`/api/review/${id}/reject`, {}).catch(() => {});
    setReview(null); load();
  };

  const c = data.counts || {};
  const open = (c.suggested || 0) + (c.pending || 0) + (c.drafting || 0) + (c.error || 0);
  const items = data.items.filter(it =>
    filter === "open" ? ["suggested", "pending", "drafting", "error"].includes(it.status) :
    filter === "pending" ? it.status === "pending" :
    filter === "suggested" ? it.status === "suggested" :
    ["applied", "rejected"].includes(it.status));

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "18px 24px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="t-label" style={{ marginBottom: 4 }}>REVIEW QUEUE · SELF-MAINTAINING VAULT</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>Feed the vault</h1>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              Gaps + section-fills + dropped sources → you draft (Claude) → review → promote. Nothing enters without your OK.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Stat label="OPEN" val={open} tone="accent" />
            <Stat label="DRAFTED" val={c.pending || 0} tone="ok" />
            <Stat label="PROMOTED" val={c.applied || 0} tone="ok" />
            <Stat label="REJECTED" val={c.rejected || 0} />
          </div>
        </div>

        {/* actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{
              padding: "34px 24px", borderRadius: 12, cursor: "pointer",
              border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`,
              background: drag ? "rgba(139,125,255,0.06)" : "rgba(15,19,34,0.5)",
              textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
            <input ref={fileRef} type="file" multiple accept=".pdf,.md,.markdown,.txt" style={{ display: "none" }}
              onChange={(e) => uploadFiles(e.target.files)} />
            <div style={{ width: 50, height: 50, borderRadius: 12, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", display: "grid", placeItems: "center" }}>
              <I.Ingest size={24} stroke="var(--accent-hi)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text-hi)", fontWeight: 600 }}>
              {drag ? "Drop to ingest" : "Drop a PDF / markdown, or click to browse"}
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>extracts → sections → queued for your review</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button className="btn btn--accent btn--sm" onClick={(e) => { e.stopPropagation(); runAudit(); }} disabled={!!busy}><I.Sparkle size={11} /> Run audit</button>
              <button className="btn btn--sm" onClick={(e) => { e.stopPropagation(); ingestRaw(); }} disabled={!!busy}><I.Vault size={11} /> Ingest raw/ folder</button>
            </div>
          </div>

          <Card title="How this works" glyph={<I.Bolt size={12} />}>
            <ol style={{ margin: 0, paddingLeft: 18, color: "var(--text-body)", fontSize: 12.5, lineHeight: 1.7 }}>
              <li><b style={{ color: "var(--neon-amber)" }}>Detect</b> — Run audit finds planned-but-missing pages + mature pages missing a section. Drop a PDF to add its sections.</li>
              <li><b style={{ color: "var(--accent-hi)" }}>Draft</b> — click Draft on any item; Claude Sonnet writes a schema-valid page.</li>
              <li><b style={{ color: "var(--neon-green)" }}>Review</b> — read/edit, then Promote (or Reject). It's compiled into the vault + auto-synced.</li>
            </ol>
            {busy && <div className="t-mono" style={{ marginTop: 12, fontSize: 11, color: "var(--accent-hi)" }}>⟳ {busy}</div>}
            {msg && <div className="t-mono" style={{ marginTop: 10, fontSize: 11, color: msg.tone === "ok" ? "var(--neon-green)" : "var(--neon-amber)" }}>{msg.tone === "ok" ? "✓ " : "⚠ "}{msg.text}</div>}
          </Card>
        </div>

        {/* filters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {[["open", `Open · ${open}`], ["suggested", `Suggested · ${c.suggested || 0}`],
            ["pending", `Needs review · ${c.pending || 0}`], ["done", `Done · ${(c.applied || 0) + (c.rejected || 0)}`]].map(([k, lbl]) => (
            <button key={k} onClick={() => setFilter(k)} className="btn btn--sm" style={{
              background: filter === k ? "var(--accent-soft)" : "var(--bg-card)",
              borderColor: filter === k ? "var(--accent-line)" : "var(--border)",
              color: filter === k ? "var(--text-hi)" : "var(--text-dim)" }}>{lbl}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="btn btn--ghost btn--sm" onClick={load}><I.ArrowR size={11} /> Refresh</button>
        </div>

        {/* queue */}
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          {items.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-dim)" }}>
              <I.Check size={26} stroke="var(--neon-green)" />
              <div style={{ marginTop: 10, fontSize: 14 }}>Nothing here. Run audit or drop a source to populate the queue.</div>
            </div>
          ) : items.map(it => (
            <ReviewRow key={it.id} it={it} drafting={!!drafting[it.id]}
              onDraft={() => draft(it.id)} onReview={() => setReview(it)} onReject={() => reject(it.id)} />
          ))}
        </div>
      </div>

      {review && review.payload && (
        <PromoteModal proposal={review.payload} onClose={() => setReview(null)} onConfirm={approve} />
      )}
    </div>
  );
};

const ReviewRow = ({ it, drafting, onDraft, onReview, onReject }) => {
  const k = KIND_DEF[it.kind] || { label: (it.kind || "?").toUpperCase(), color: "var(--text-dim)" };
  const area = AREAS[it.area];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "66px 1fr auto", gap: 14, padding: "12px 16px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
      <span style={{ justifySelf: "start", padding: "2px 7px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, color: k.color, border: `1px solid ${k.color}55`, background: `${k.color}11` }}>{k.label}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {area && <AreaDot area={it.area} size={7} />}
          <span style={{ color: "var(--text-hi)", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</span>
          {it.decision && <span className="t-mono" style={{ fontSize: 9, color: "var(--text-faint)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 5px" }}>{it.decision}</span>}
        </div>
        <div className="t-mono" style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {(area ? area.short : (it.area || "?"))} · {it.source} · {it.summary}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {it.status === "suggested" && (
          <button className="btn btn--accent btn--sm" onClick={onDraft} disabled={drafting}>
            <I.Sparkle size={11} stroke={drafting ? "var(--accent)" : undefined} /> {drafting ? "Drafting…" : "Draft"}
          </button>
        )}
        {it.status === "drafting" && <span className="t-mono" style={{ fontSize: 11, color: "var(--accent-hi)" }}>⟳ drafting…</span>}
        {it.status === "pending" && <button className="btn btn--primary btn--sm" onClick={onReview}><I.Eye size={11} /> Review</button>}
        {it.status === "error" && <span className="t-mono" style={{ fontSize: 11, color: "var(--neon-red)" }}>draft error</span>}
        {it.status === "applied" && <StatusBadge status="mature" />}
        {it.status === "rejected" && <span className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>rejected</span>}
        {["suggested", "pending", "error"].includes(it.status) && (
          <button className="btn btn--ghost btn--sm" onClick={onReject} title="Reject"><I.X size={11} /></button>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, val, tone }) => (
  <div style={{ textAlign: "right" }}>
    <div className="t-label">{label}</div>
    <div className="t-mono t-num" style={{ fontSize: 18, lineHeight: 1, marginTop: 3,
      color: tone === "accent" ? "var(--accent-hi)" : tone === "ok" ? "var(--neon-green)" : "var(--text-hi)" }}>{val}</div>
  </div>
);

Object.assign(window, { Ingest });
