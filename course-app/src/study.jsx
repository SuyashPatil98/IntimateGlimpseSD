/* global React, I, AREAS,
   MOCK_SESSION, MOCK_STUDY_THREAD, MOCK_PROMOTE_PROPOSAL,
   StatusBadge, AreaDot, AreaChip, SourceChip, Card */

const { useState, useEffect, useRef } = React;

// =========================================================
// LEFT — session context column
// =========================================================
const StudyLeft = ({ onCompile, onCollapse, collapsed }) => {
  const s = MOCK_SESSION;
  const [historyOpen, setHistoryOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="study-left" style={{
        width: 36,
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        padding: "12px 0",
        background: "rgba(15,19,34,0.4)",
      }}>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Expand"><I.ChevR size={12} /></button>
        <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.18em" }}>
          SESSION
        </div>
      </div>
    );
  }

  return (
    <div className="study-left" style={{
      width: 280,
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      background: "rgba(15,19,34,0.4)",
      minHeight: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card__title">
          <I.Timer size={11} stroke="var(--accent)" />
          <span>Session · {s.elapsedMin}m</span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Collapse"><I.ChevL size={12} /></button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <MiniStat n={s.queries} lbl="Q" />
        <MiniStat n={s.promotions} lbl="PROM" accent />
        <MiniStat n={s.retrievals} lbl="RET" />
      </div>

      {/* History */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <button onClick={() => setHistoryOpen(o => !o)} style={{
          width: "100%",
          padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "transparent",
        }}>
          <span className="t-label">HISTORY · {s.history.length}</span>
          <I.ChevD size={11} stroke="var(--text-dim)" style={{ transform: historyOpen ? "none" : "rotate(-90deg)", transition: "transform 150ms" }} />
        </button>
        {historyOpen && (
          <div style={{ padding: "4px 6px" }}>
            {s.history.map((h, i) => (
              <button key={h.id} style={{
                width: "100%", textAlign: "left",
                padding: "8px 10px",
                display: "grid", gridTemplateColumns: "16px 1fr", gap: 8, alignItems: "flex-start",
                borderRadius: 6,
                color: i === s.history.length - 1 ? "var(--text-hi)" : "var(--text-body)",
                background: i === s.history.length - 1 ? "rgba(139,125,255,0.06)" : "transparent",
                borderLeft: i === s.history.length - 1 ? "2px solid var(--accent)" : "2px solid transparent",
                fontSize: 12,
                lineHeight: 1.4,
              }}>
                <span className="t-mono t-faint" style={{ fontSize: 10, marginTop: 2 }}>{i+1}</span>
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Live retrieved */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="t-label">PAGES RETRIEVED</span>
            <span className="t-mono t-faint" style={{ fontSize: 10 }}>LIVE</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {s.retrieved.map((r) => (
              <div key={r.page} style={{
                display: "grid", gridTemplateColumns: "8px 1fr auto", alignItems: "center", gap: 8,
                padding: "5px 6px",
                borderRadius: 4,
                background: "rgba(148,158,200,0.025)",
              }}>
                <AreaDot area={r.area} size={6} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--text)", fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div>
                </div>
                <span className="t-mono t-num" style={{ fontSize: 10, color: "var(--text-faint)" }}>{(r.score*100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compile session */}
      <div style={{ padding: 10, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn--accent" style={{ width: "100%", justifyContent: "center" }} onClick={onCompile}>
          <I.Compile size={12} /> Compile session
        </button>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6, textAlign: "center" }}>
          Distill {s.queries} queries → 1 master note
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ n, lbl, accent }) => (
  <div style={{ textAlign: "center" }}>
    <div className="t-mono t-num" style={{ fontSize: 16, color: accent ? "var(--accent-hi)" : "var(--text-hi)", lineHeight: 1 }}>{n}</div>
    <div className="t-label" style={{ marginTop: 2, fontSize: 9 }}>{lbl}</div>
  </div>
);

// =========================================================
// RIGHT — page preview column
// =========================================================
const StudyRight = ({ onCollapse, collapsed, page }) => {
  if (collapsed) {
    return (
      <div className="study-right" style={{
        width: 36,
        borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        padding: "12px 0",
        background: "rgba(15,19,34,0.4)",
      }}>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Show preview"><I.ChevL size={12} /></button>
        <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.18em" }}>
          PREVIEW
        </div>
      </div>
    );
  }

  return (
    <div className="study-right" style={{
      width: 360,
      borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      background: "rgba(15,19,34,0.4)",
      minHeight: 0,
    }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card__title">
          <I.File size={11} />
          <span>Page preview</span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Collapse"><I.ChevR size={12} /></button>
      </div>

      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AreaDot area={page.area} />
          <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{page.page}</span>
        </div>
        <div style={{ marginTop: 8, color: "var(--text-hi)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.25 }}>
          {page.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <StatusBadge status={page.status} />
          <span className="t-mono t-faint" style={{ fontSize: 10 }}>· score {(page.score*100).toFixed(0)} · 7 inbound</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px", fontFamily: "var(--font-body)", color: "var(--text-body)", fontSize: 13, lineHeight: 1.65, minHeight: 0 }}>
        <p style={{ margin: "0 0 12px" }}>
          Kafka exposes <span style={{ color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: 12 }}>idempotent</span> and
          {" "}<span style={{ color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: 12 }}>transactional</span> producer configurations. Together they form the substrate for what's marketed as "exactly-once" — though strictly it's exactly-once <em>processing</em>, not delivery.
        </p>
        <h4 style={{ color: "var(--text-hi)", margin: "18px 0 6px", fontSize: 13, fontWeight: 600 }}>Producer-side</h4>
        <p style={{ margin: "0 0 12px" }}>
          Each producer is assigned a Producer ID (PID) by the broker. The producer attaches monotonically increasing sequence numbers to every record. On retry, the broker detects duplicates by (PID, partition, sequence) and drops them.
        </p>
        <h4 style={{ color: "var(--text-hi)", margin: "18px 0 6px", fontSize: 13, fontWeight: 600 }}>Transactional writes</h4>
        <p style={{ margin: "0 0 12px" }}>
          A producer with a stable <span style={{ color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: 12 }}>transactional.id</span> can open a transaction across multiple partitions, write atomic batches, and commit them via the transaction coordinator.
        </p>
        <h4 style={{ color: "var(--text-hi)", margin: "18px 0 6px", fontSize: 13, fontWeight: 600 }}>Links</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Idempotent Producers","Transaction Coordinator","Consumer Isolation Levels","At-Least-Once vs Exactly-Once"].map(t => (
            <span key={t} style={{
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid var(--accent-line)",
              background: "var(--accent-soft)",
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--accent-hi)",
            }}>[[{t}]]</span>
          ))}
        </div>
      </div>

      <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="btn btn--accent" style={{ justifyContent: "center" }}>
          <I.Plus size={12} /> Extend this page
        </button>
        <button className="btn" style={{ justifyContent: "center" }}>
          <I.Link size={12} /> Open in vault
        </button>
      </div>
    </div>
  );
};

// =========================================================
// CENTER — conversation with streaming
// =========================================================
const StudyCenter = ({ onPromote, onOpenPage }) => {
  const t = MOCK_STUDY_THREAD;
  const [streamLen, setStreamLen] = useState(0);
  const [sourcesShown, setSourcesShown] = useState(0);
  const scrollRef = useRef(null);

  // Animated streaming on mount
  useEffect(() => {
    setSourcesShown(0); setStreamLen(0);
    let i = 0;
    const sourceTimer = setInterval(() => {
      i++;
      setSourcesShown(i);
      if (i >= t.sources.length) clearInterval(sourceTimer);
    }, 120);

    const startStream = setTimeout(() => {
      let n = 0;
      const step = Math.max(4, Math.floor(t.answer.length / 600));
      const streamTimer = setInterval(() => {
        n = Math.min(t.answer.length, n + step);
        setStreamLen(n);
        if (n >= t.answer.length) clearInterval(streamTimer);
      }, 16);
    }, 900);

    return () => { clearInterval(sourceTimer); clearTimeout(startStream); };
  }, []);

  const streaming = streamLen < t.answer.length;
  const partial = t.answer.slice(0, streamLen);

  return (
    <div style={{
      flex: 1,
      display: "flex", flexDirection: "column",
      minWidth: 0, minHeight: 0,
    }}>
      {/* Fallback banner */}
      <div className="fallback-banner">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <I.Alert size={13} stroke="var(--neon-amber)" />
          <span>Primary backend <b style={{ color: "var(--text-hi)" }}>Qwen 2.5</b> was rate-limited at 09:51 — routed this answer through <b style={{ color: "var(--text-hi)" }}>Claude Sonnet 4</b>.</span>
        </div>
        <button className="btn btn--ghost btn--sm"><I.X size={11} /></button>
      </div>

      {/* Scroll body */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: "auto", padding: "22px 36px 16px",
        display: "flex", flexDirection: "column", gap: 24, minHeight: 0,
      }}>
        {/* User question */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <Avatar kind="you" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-label" style={{ marginBottom: 6 }}>YOU · 09:51:34</div>
            <div style={{ color: "var(--text-hi)", fontSize: 16, lineHeight: 1.5, letterSpacing: "-0.005em", fontWeight: 500 }}>
              {t.question}
            </div>
          </div>
        </div>

        {/* Sources row (renders before answer streams) */}
        {sourcesShown > 0 && (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Avatar kind="ai" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div className="t-label">RETRIEVED · {t.sources.length} PAGES · COMPILER → CLAUDE SONNET 4</div>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>top-k 6 · graph expand 2</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {t.sources.slice(0, sourcesShown).map((s) => (
                  <SourceChip key={s.page} src={s} onClick={onOpenPage} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vault gap banner */}
        {!streaming && (
          <div style={{ marginLeft: 46 }}>
            <div className="gap-banner">
              <I.Alert size={14} stroke="var(--neon-amber)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--text-hi)", marginBottom: 2 }}><b>Vault gap detected.</b> {t.vaultGap.desc}</div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                  Suggested new note: <span style={{ color: "var(--neon-amber)" }}>messaging/producer-fencing.md</span>
                  <button className="btn btn--sm" style={{ marginLeft: 10 }}>
                    <I.Plus size={10} /> Create stub
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer body */}
        {streamLen > 0 && (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Avatar kind="ai" active />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div className="t-label">
                  COMPILER · CLAUDE SONNET 4 <span style={{ color: "var(--accent)", marginLeft: 6 }}>· FALLBACK ROUTE</span>
                </div>
                {!streaming && (
                  <button className="btn btn--accent btn--sm" onClick={onPromote}>
                    <I.Promote size={12} /> Promote to vault
                    <span className="kbd kbd--inline" style={{ marginLeft: 4 }}>⌘ ↑</span>
                  </button>
                )}
              </div>
              <MdAnswer text={partial} streaming={streaming} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <StudyInput />
    </div>
  );
};

const Avatar = ({ kind, active }) => {
  if (kind === "you") {
    return <div style={{
      width: 32, height: 32, borderRadius: 8,
      border: "1px solid var(--border-strong)",
      display: "grid", placeItems: "center",
      fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)",
      flexShrink: 0,
    }}>YOU</div>;
  }
  return <div style={{
    width: 32, height: 32, borderRadius: 8,
    background: "linear-gradient(140deg, var(--accent), #5b4ed8 70%)",
    display: "grid", placeItems: "center",
    color: "#0a0d18",
    boxShadow: active ? "0 0 0 1px var(--accent-line), 0 0 16px rgba(139,125,255,0.4)" : "0 0 0 1px var(--accent-line)",
    flexShrink: 0,
  }}>
    <I.Sparkle size={14} stroke="#0a0d18" sw={2} />
  </div>;
};

const MdAnswer = ({ text, streaming }) => {
  // Tiny inline markdown renderer for **bold**, `code`, headings, lists
  const renderInline = (s) => {
    const parts = [];
    let rest = s;
    let key = 0;
    const re = /(\*\*[^*]+\*\*|`[^`]+`)/;
    while (true) {
      const m = re.exec(rest);
      if (!m) { parts.push(rest); break; }
      parts.push(rest.slice(0, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) {
        parts.push(<b key={key++} style={{ color: "var(--text-hi)", fontWeight: 600 }}>{tok.slice(2,-2)}</b>);
      } else {
        parts.push(<code key={key++} style={{
          fontFamily: "var(--font-mono)", fontSize: 12, padding: "1px 5px",
          background: "var(--bg-deep)", border: "1px solid var(--border)",
          borderRadius: 3, color: "var(--accent-hi)",
        }}>{tok.slice(1,-1)}</code>);
      }
      rest = rest.slice(m.index + tok.length);
    }
    return parts;
  };

  // Block-level parse
  const lines = text.split("\n");
  const blocks = [];
  let cur = { type: "p", lines: [] };
  const flush = () => { if (cur.lines.length || cur.type !== "p") blocks.push(cur); cur = { type: "p", lines: [] }; };
  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (cur.type !== "ul") { flush(); cur = { type: "ul", lines: [] }; }
      cur.lines.push(line.slice(2));
    } else if (line.trim() === "") {
      flush();
    } else {
      if (cur.type !== "p") { flush(); }
      cur.lines.push(line);
    }
  }
  flush();

  return (
    <div style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7, fontFamily: "var(--font-body)", letterSpacing: "-0.005em" }}>
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        if (b.type === "ul") {
          return (
            <ul key={i} style={{ paddingLeft: 18, margin: "0 0 14px" }}>
              {b.lines.map((l, j) => (
                <li key={j} style={{ marginBottom: 6, color: "var(--text)" }}>{renderInline(l)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ margin: "0 0 14px" }}>
            {renderInline(b.lines.join(" "))}
            {last && streaming && <span className="streaming-cursor" />}
          </p>
        );
      })}
    </div>
  );
};

const StudyInput = () => {
  const [val, setVal] = useState("");
  return (
    <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)", background: "rgba(10,13,24,0.5)" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 10,
        alignItems: "flex-end",
        background: "var(--bg-card)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: 10,
        boxShadow: "var(--glow-soft)",
      }}>
        <textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          rows={2}
          placeholder="Ask the vault — ⌘⏎ to send, ⇧⏎ for newline…"
          style={{
            background: "transparent", border: "none", outline: "none", resize: "none",
            color: "var(--text-hi)", fontSize: 14, lineHeight: 1.5,
            padding: "6px 8px", width: "100%", fontFamily: "var(--font-body)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn--sm" title="Context: scoped to current area">
            <I.Vault size={11} /> All areas
            <I.ChevD size={10} />
          </button>
          <button className="btn btn--primary btn--sm">
            <I.Send size={11} /> Send
            <span className="kbd kbd--inline" style={{ background: "rgba(10,13,24,0.4)", color: "#0a0d18", borderColor: "rgba(0,0,0,0.2)" }}>⌘⏎</span>
          </button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 4px" }}>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
          ROUTING → <span style={{ color: "var(--text-dim)" }}>QWEN 2.5</span> → <span style={{ color: "var(--accent)" }}>CLAUDE</span> fallback · ctx 16k / 200k
        </div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", display: "flex", gap: 12 }}>
          <span>⌘K palette</span><span>⌘⇧P promote</span><span>⌘\ toggle panels</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// STUDY ROOT
// =========================================================
const Study = ({ onPromote }) => {
  const [leftCol, setLeftCol] = useState(false);
  const [rightCol, setRightCol] = useState(false);
  const [previewPage, setPreviewPage] = useState(MOCK_STUDY_THREAD.sources[0]);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <StudyLeft  collapsed={leftCol}  onCollapse={() => setLeftCol(c => !c)} />
      <StudyCenter onPromote={onPromote} onOpenPage={setPreviewPage} />
      <StudyRight collapsed={rightCol} onCollapse={() => setRightCol(c => !c)} page={previewPage} />
    </div>
  );
};

// =========================================================
// PROMOTE MODAL
// =========================================================
const PromoteModal = ({ proposal, onClose, onConfirm }) => {
  const [content, setContent] = useState(proposal.new_content);
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className={`decision-tag ${proposal.decision.toLowerCase()}`}>{proposal.decision}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.01em" }}>
              {proposal.target_title}
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
              {proposal.target_section} <span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>
              <span style={{ color: "var(--accent-hi)" }}>{proposal.merge_strategy}</span>
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}><I.X size={12} /></button>
        </div>

        <div className="modal__body">
          {/* Reasoning */}
          <div style={{ padding: "10px 12px", background: "rgba(139,125,255,0.05)", border: "1px solid var(--accent-line)", borderRadius: 6, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <I.Sparkle size={14} stroke="var(--accent-hi)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div className="t-label" style={{ color: "var(--accent-hi)", marginBottom: 4 }}>COMPILER REASONING</div>
              <div style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}>{proposal.reason}</div>
            </div>
          </div>

          {/* Conflict warning */}
          {proposal.conflicts_with && proposal.conflicts_with.length > 0 && (
            <div className="conflict" style={{ marginBottom: 16 }}>
              <I.Alert size={14} stroke="var(--neon-red)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--text-hi)", marginBottom: 4, fontSize: 13 }}>
                  <b style={{ color: "var(--neon-red)" }}>Conflict</b> with {proposal.conflicts_with.length} existing note(s)
                </div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>
                  {proposal.conflicts_with.map(c => <span key={c} style={{ marginRight: 12 }}>{c}</span>)}
                </div>
                <div style={{ color: "var(--text-body)", fontSize: 12.5, lineHeight: 1.5 }}>{proposal.conflict_description}</div>
              </div>
            </div>
          )}

          {/* Markdown editor */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div className="t-label">PROPOSED CONTENT · MARKDOWN</div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="btn btn--ghost btn--sm">Edit</button>
              <button className="btn btn--ghost btn--sm">Preview</button>
              <button className="btn btn--ghost btn--sm">Diff</button>
            </div>
          </div>
          <textarea className="md-area" value={content} onChange={(e) => setContent(e.target.value)} />

          {/* Wikilinks chips */}
          <div style={{ marginTop: 12 }}>
            <div className="t-label" style={{ marginBottom: 6 }}>WIKILINKS · {proposal.wikilinks.length}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {proposal.wikilinks.map(w => (
                <span key={w} style={{
                  padding: "3px 8px", borderRadius: 4,
                  border: "1px solid var(--accent-line)", background: "var(--accent-soft)",
                  fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-hi)",
                }}>[[{w}]]</span>
              ))}
              <button style={{
                padding: "3px 8px", borderRadius: 4,
                border: "1px dashed var(--border-strong)", background: "transparent",
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <I.Plus size={9} /> link
              </button>
            </div>
          </div>
        </div>

        <div className="modal__foot">
          <div className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
            ⏎ confirm · esc cancel · ⌘e edit target
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn">Skip this</button>
            <button className="btn btn--primary" onClick={onConfirm}>
              <I.Check size={12} /> Confirm extend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Study, PromoteModal });
