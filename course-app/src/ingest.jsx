/* global React, I, AREAS, AREA_ORDER, StatusBadge, AreaDot, Card */

const { useState, useRef, useEffect } = React;

// =========================================================
// MOCK INGEST QUEUE
// =========================================================
const INITIAL_QUEUE = [
  { id: "i1", filename: "DDIA — Designing Data-Intensive Applications.pdf", kind: "PDF",  size: "13.4 MB",  area: "databases",               state: "embedding", progress: 78, chunks: 412, eta: "1m 12s" },
  { id: "i2", filename: "Kafka Definitive Guide — Ch 7-8.pdf",              kind: "PDF",  size: "3.1 MB",   area: "messaging",               state: "compiling", progress: 42, chunks: 96,  eta: "44s" },
  { id: "i3", filename: "raft-paper.pdf",                                   kind: "PDF",  size: "612 KB",   area: "distributed-systems",     state: "done",      progress: 100, chunks: 28,  promoted: 6 },
  { id: "i4", filename: "system-design-primer.md",                          kind: "MD",   size: "180 KB",   area: "system-design-interview", state: "done",      progress: 100, chunks: 142, promoted: 12 },
  { id: "i5", filename: "papers/exactly-once-kafka.pdf",                    kind: "PDF",  size: "1.4 MB",   area: "messaging",               state: "queued",    progress: 0,   chunks: 0 },
  { id: "i6", filename: "Discord — How we built it (transcript).txt",       kind: "TXT",  size: "62 KB",    area: "case-studies",            state: "queued",    progress: 0,   chunks: 0 },
  { id: "i7", filename: "old-notes-export.zip",                             kind: "ZIP",  size: "8.8 MB",   area: "—",                       state: "failed",    progress: 32, error: "Unsupported container — extract first" },
];

const STATE_DEFS = {
  queued:    { label: "QUEUED",    color: "var(--text-dim)",    pulse: false },
  extracting:{ label: "EXTRACT",   color: "var(--neon-cyan)",   pulse: true  },
  chunking:  { label: "CHUNK",     color: "var(--neon-cyan)",   pulse: true  },
  compiling: { label: "COMPILE",   color: "var(--accent-hi)",   pulse: true  },
  embedding: { label: "EMBED",     color: "var(--accent-hi)",   pulse: true  },
  done:      { label: "DONE",      color: "var(--neon-green)",  pulse: false },
  failed:    { label: "FAILED",    color: "var(--neon-red)",    pulse: false },
};

// =========================================================
// INGEST VIEW
// =========================================================
const Ingest = () => {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  useEffect(() => {
    fetch("/api/ingest/queue").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d && Array.isArray(d.queue)) setQueue(d.queue);
    }).catch(() => {});
  }, []);
  const [drag, setDrag] = useState(false);
  const [defaults, setDefaults] = useState({
    area: "databases",
    chunkSize: 1200,
    overlap: 150,
    autoPromote: false,
  });
  const dropRef = useRef(null);

  // simulate progress ticks for in-flight items
  useEffect(() => {
    const t = setInterval(() => {
      setQueue(qs => qs.map(it => {
        if (["embedding","compiling","extracting","chunking"].includes(it.state)) {
          const next = Math.min(100, it.progress + Math.random() * 4 + 1);
          let state = it.state, eta = it.eta;
          if (next >= 100) {
            state = "done";
            eta = undefined;
          } else {
            const remaining = ((100 - next) / 100) * 90; // sec-ish
            eta = remaining > 60 ? `${Math.floor(remaining/60)}m ${Math.floor(remaining%60)}s` : `${Math.floor(remaining)}s`;
          }
          return { ...it, progress: next, state, eta };
        }
        return it;
      }));
    }, 1100);
    return () => clearInterval(t);
  }, []);

  // simulate "start next queued" every few seconds
  useEffect(() => {
    const t = setInterval(() => {
      setQueue(qs => {
        const active = qs.filter(q => ["embedding","compiling","extracting","chunking"].includes(q.state)).length;
        if (active >= 2) return qs;
        const first = qs.find(q => q.state === "queued");
        if (!first) return qs;
        return qs.map(it => it.id === first.id ? { ...it, state: "extracting", progress: 4, eta: "1m 20s" } : it);
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer.files || []).slice(0, 4);
    if (!files.length) return;
    setQueue(qs => [
      ...files.map((f, i) => ({
        id: `n${Date.now()}-${i}`,
        filename: f.name,
        kind: (f.name.split(".").pop() || "FILE").toUpperCase(),
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        area: defaults.area,
        state: "queued", progress: 0, chunks: 0,
      })),
      ...qs,
    ]);
  };

  const counts = {
    queued:  queue.filter(q => q.state === "queued").length,
    active:  queue.filter(q => ["embedding","compiling","extracting","chunking"].includes(q.state)).length,
    done:    queue.filter(q => q.state === "done").length,
    failed:  queue.filter(q => q.state === "failed").length,
    promoted: queue.reduce((s, q) => s + (q.promoted || 0), 0),
  };

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "18px 24px 60px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div className="t-label" style={{ marginBottom: 4 }}>INGEST · PIPELINE</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>
              Feed the vault
            </h1>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              Drop PDFs, markdown, text, transcripts. The compiler extracts → chunks → embeds → suggests promotions.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Stat label="ACTIVE"   val={counts.active}   tone="accent" />
            <Stat label="QUEUED"   val={counts.queued} />
            <Stat label="DONE"     val={counts.done}     tone="ok" />
            <Stat label="PROMOTED" val={counts.promoted} tone="accent" />
            <Stat label="FAILED"   val={counts.failed}   tone="err" />
          </div>
        </div>

        {/* Drop zone + defaults grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            style={{
              padding: "44px 30px",
              borderRadius: 12,
              border: `1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`,
              background: drag ? "rgba(139,125,255,0.06)" : "rgba(15,19,34,0.5)",
              textAlign: "center",
              transition: "border-color 150ms, background 150ms",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              cursor: "pointer",
            }}
            onClick={() => alert("Mock — wire to a real file input")}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 12,
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-line)",
              display: "grid", placeItems: "center",
              transform: drag ? "scale(1.06)" : "scale(1)",
              transition: "transform 150ms",
            }}>
              <I.Ingest size={26} stroke="var(--accent-hi)" />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text-hi)", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {drag ? "Drop to ingest" : "Drop files here, or click to browse"}
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: 0.06 }}>
              PDF · MD · TXT · DOCX · EPUB · TRANSCRIPTS · &lt; 50 MB each
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn--sm" onClick={(e) => e.stopPropagation()}>
                <I.Link size={11} /> From URL
              </button>
              <button className="btn btn--sm" onClick={(e) => e.stopPropagation()}>
                <I.File size={11} /> Paste raw text
              </button>
              <button className="btn btn--sm" onClick={(e) => e.stopPropagation()}>
                <I.Vault size={11} /> Re-scan vault folder
              </button>
            </div>
          </div>

          {/* Defaults */}
          <Card title="Ingest defaults" glyph={<I.Bolt size={12} />}>
            <div className="t-label" style={{ marginBottom: 8 }}>DEFAULT AREA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
              {AREA_ORDER.map(a => {
                const on = defaults.area === a;
                const c = AREAS[a].color;
                return (
                  <button key={a} onClick={() => setDefaults(d => ({ ...d, area: a }))} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 8px", borderRadius: 999,
                    background: on ? `color-mix(in oklab, ${c} 12%, transparent)` : "transparent",
                    border: `1px solid ${on ? c : "var(--border)"}`,
                    color: on ? "var(--text-hi)" : "var(--text-dim)",
                    fontSize: 10, fontFamily: "var(--font-mono)",
                  }}>
                    <AreaDot area={a} size={5} />
                    {AREAS[a].short}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <NumField label="CHUNK SIZE (TOK)" val={defaults.chunkSize} onChange={(v) => setDefaults(d => ({ ...d, chunkSize: v }))} step={50} />
              <NumField label="OVERLAP (TOK)"    val={defaults.overlap}   onChange={(v) => setDefaults(d => ({ ...d, overlap: v }))}   step={25} />
            </div>

            <button onClick={() => setDefaults(d => ({ ...d, autoPromote: !d.autoPromote }))} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
              padding: "8px 10px", borderRadius: 6,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 12, textAlign: "left",
            }}>
              <span>
                <span style={{ color: "var(--text-hi)" }}>Auto-promote high-confidence chunks</span>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>Skip the review step for confidence ≥ 0.92.</div>
              </span>
              <div className={`toggle ${defaults.autoPromote ? "on" : ""}`} />
            </button>
          </Card>
        </div>

        {/* Queue */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="section-title"><span className="num">01</span>Ingest queue</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--ghost btn--sm"><I.X size={11} /> Clear done</button>
              <button className="btn btn--accent btn--sm"><I.Play size={11} /> Process all</button>
            </div>
          </div>
          <div style={{
            background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8,
            overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto 1.6fr 0.8fr 1fr 1fr 0.4fr",
              gap: 14, padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              background: "rgba(148,158,200,0.025)",
            }}>
              <span className="t-label" style={{ width: 36 }}>KIND</span>
              <span className="t-label">FILE</span>
              <span className="t-label">AREA</span>
              <span className="t-label">PROGRESS</span>
              <span className="t-label">STATE</span>
              <span></span>
            </div>
            {queue.map(it => <QueueRow key={it.id} item={it} />)}
          </div>
        </div>

      </div>
    </div>
  );
};

const QueueRow = ({ item }) => {
  const s = STATE_DEFS[item.state];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1.6fr 0.8fr 1fr 1fr 0.4fr",
      gap: 14, padding: "12px 14px", alignItems: "center",
      borderBottom: "1px solid var(--border)",
      background: item.state === "done" ? "rgba(61,255,166,0.02)" :
                  item.state === "failed" ? "rgba(255,94,106,0.02)" :
                  "transparent",
    }}>
      {/* Kind badge */}
      <div style={{
        width: 36, height: 36, borderRadius: 6,
        background: item.state === "failed" ? "rgba(255,94,106,0.06)" : "var(--bg-card)",
        border: `1px solid ${item.state === "failed" ? "rgba(255,94,106,0.25)" : "var(--border)"}`,
        display: "grid", placeItems: "center",
        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
        color: item.state === "failed" ? "var(--neon-red)" : "var(--text-body)",
        letterSpacing: 0.1,
      }}>{item.kind}</div>

      {/* File */}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.filename}</div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
          {item.size} · {item.chunks ? `${item.chunks} chunks` : "—"}
          {item.error && <span style={{ color: "var(--neon-red)", marginLeft: 6 }}>· {item.error}</span>}
          {item.promoted && <span style={{ color: "var(--neon-green)", marginLeft: 6 }}>· {item.promoted} promoted</span>}
        </div>
      </div>

      {/* Area */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        {item.area === "—" ? (
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>—</span>
        ) : (
          <>
            <AreaDot area={item.area} size={7} />
            <span className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {AREAS[item.area].short}
            </span>
          </>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="pbar"><i style={{
          width: `${item.progress}%`,
          background: s.color,
          boxShadow: s.pulse ? `0 0 6px ${s.color}` : "none",
        }} /></div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
          <span>{Math.round(item.progress)}%</span>
          {item.eta && <span>{item.eta}</span>}
        </div>
      </div>

      {/* State */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: s.color,
          boxShadow: s.pulse ? `0 0 6px ${s.color}` : "none",
          animation: s.pulse ? "pulseDot 1.1s ease-in-out infinite" : "none",
        }} />
        <span className="t-mono" style={{ fontSize: 11, color: s.color, fontWeight: 500, letterSpacing: 0.08 }}>
          {s.label}
        </span>
      </div>

      {/* Action */}
      <div style={{ textAlign: "right" }}>
        {item.state === "failed" ? (
          <button className="btn btn--ghost btn--sm"><I.Sparkle size={10} /> Retry</button>
        ) : item.state === "done" ? (
          <button className="btn btn--ghost btn--sm" title="Review promotions"><I.ArrowR size={10} /></button>
        ) : (
          <button className="btn btn--ghost btn--sm"><I.X size={10} /></button>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, val, tone }) => (
  <div style={{ textAlign: "right" }}>
    <div className="t-label">{label}</div>
    <div className="t-mono t-num" style={{
      fontSize: 18, lineHeight: 1, marginTop: 3,
      color: tone === "accent" ? "var(--accent-hi)" : tone === "ok" ? "var(--neon-green)" : tone === "err" ? "var(--neon-red)" : "var(--text-hi)",
    }}>{val}</div>
  </div>
);

const NumField = ({ label, val, onChange, step = 1 }) => (
  <div>
    <div className="t-label" style={{ marginBottom: 5 }}>{label}</div>
    <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
      <button style={{
        padding: "6px 10px",
        background: "var(--bg-deep)", color: "var(--text-dim)",
        borderRight: "1px solid var(--border)",
      }} onClick={() => onChange(Math.max(0, val - step))}>−</button>
      <input className="input"
        type="number"
        value={val}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        style={{ border: "none", borderRadius: 0, textAlign: "center", fontSize: 13 }} />
      <button style={{
        padding: "6px 10px",
        background: "var(--bg-deep)", color: "var(--text-dim)",
        borderLeft: "1px solid var(--border)",
      }} onClick={() => onChange(val + step)}>+</button>
    </div>
  </div>
);

Object.assign(window, { Ingest });
