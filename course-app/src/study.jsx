/* global React, API, I, AREAS,
   MOCK_SESSION, StatusBadge, AreaDot, AreaChip, SourceChip, Card */

const { useState, useEffect, useRef } = React;

// =========================================================
// LEFT — session context column (live from the conversation)
// =========================================================
const StudyLeft = ({ session, onCompile, onCollapse, collapsed, compiling }) => {
  const s = session || MOCK_SESSION;
  const [historyOpen, setHistoryOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="study-left" style={{ width: 36, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "12px 0", background: "rgba(15,19,34,0.4)" }}>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Expand"><I.ChevR size={12} /></button>
        <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.18em" }}>SESSION</div>
      </div>
    );
  }

  return (
    <div className="study-left" style={{ width: 280, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "rgba(15,19,34,0.4)", minHeight: 0 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card__title"><I.Timer size={11} stroke="var(--accent)" /><span>Session · {s.elapsedMin}m</span></div>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Collapse"><I.ChevL size={12} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
        <MiniStat n={s.queries} lbl="Q" />
        <MiniStat n={s.promotions} lbl="PROM" accent />
        <MiniStat n={s.retrievals} lbl="RET" />
      </div>

      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        <button onClick={() => setHistoryOpen(o => !o)} style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "transparent" }}>
          <span className="t-label">HISTORY · {s.history.length}</span>
          <I.ChevD size={11} stroke="var(--text-dim)" style={{ transform: historyOpen ? "none" : "rotate(-90deg)", transition: "transform 150ms" }} />
        </button>
        {historyOpen && (
          <div style={{ padding: "4px 6px" }}>
            {s.history.length === 0 && <div className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)", padding: "8px 10px" }}>No questions yet.</div>}
            {s.history.map((h, i) => (
              <div key={h.id} style={{ padding: "8px 10px", display: "grid", gridTemplateColumns: "16px 1fr", gap: 8, alignItems: "flex-start", borderRadius: 6, color: i === s.history.length - 1 ? "var(--text-hi)" : "var(--text-body)", background: i === s.history.length - 1 ? "rgba(139,125,255,0.06)" : "transparent", borderLeft: i === s.history.length - 1 ? "2px solid var(--accent)" : "2px solid transparent", fontSize: 12, lineHeight: 1.4 }}>
                <span className="t-mono t-faint" style={{ fontSize: 10, marginTop: 2 }}>{i + 1}</span>
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{h.q}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="t-label">PAGES RETRIEVED</span>
            <span className="t-mono t-faint" style={{ fontSize: 10 }}>LIVE</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {s.retrieved.map((r) => (
              <div key={r.page} style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 4, background: "rgba(148,158,200,0.025)" }}>
                <AreaDot area={r.area} size={6} />
                <div style={{ minWidth: 0 }}><div style={{ color: "var(--text)", fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</div></div>
                <span className="t-mono t-num" style={{ fontSize: 10, color: "var(--text-faint)" }}>{Math.round((r.score || 0) * 100)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 10, borderTop: "1px solid var(--border)" }}>
        <button className="btn btn--accent" style={{ width: "100%", justifyContent: "center" }} onClick={onCompile} disabled={s.queries === 0 || compiling}>
          <I.Compile size={12} /> {compiling ? "Compiling…" : "Compile session"}
        </button>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6, textAlign: "center" }}>
          {s.queries} queries → notes that improve the vault
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
// RIGHT — page preview column (live page body)
// =========================================================
const StudyRight = ({ onCollapse, collapsed, page }) => {
  if (collapsed) {
    return (
      <div className="study-right" style={{ width: 36, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "12px 0", background: "rgba(15,19,34,0.4)" }}>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Show preview"><I.ChevL size={12} /></button>
        <div style={{ writingMode: "vertical-rl", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.18em" }}>PREVIEW</div>
      </div>
    );
  }

  return (
    <div className="study-right" style={{ width: 360, borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "rgba(15,19,34,0.4)", minHeight: 0 }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card__title"><I.File size={11} /><span>Page preview</span></div>
        <button className="btn btn--ghost btn--sm" onClick={onCollapse} title="Collapse"><I.ChevR size={12} /></button>
      </div>

      {!page ? (
        <div style={{ margin: "auto", textAlign: "center", color: "var(--text-faint)", padding: 24 }}>
          <I.File size={20} stroke="var(--text-faint)" />
          <div style={{ marginTop: 10, fontSize: 12 }}>Click a source chip to preview the note.</div>
        </div>
      ) : (
        <>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AreaDot area={page.area} />
              <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{page.page}</span>
            </div>
            <div style={{ marginTop: 8, color: "var(--text-hi)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{page.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <StatusBadge status={page.status} />
              {page.score != null && <span className="t-mono t-faint" style={{ fontSize: 10 }}>· score {Math.round(page.score * 100)}</span>}
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "14px 16px", fontFamily: "var(--font-body)", color: "var(--text-body)", fontSize: 13, lineHeight: 1.65, minHeight: 0, whiteSpace: "pre-wrap" }}>
            {page._loading ? <span className="t-faint">Loading…</span> : (page.body || page.snippet || "")}
          </div>
        </>
      )}
    </div>
  );
};

// =========================================================
// CENTER — live conversation
// =========================================================
const StudyCenter = ({ messages, busy, onAsk, onPromote, promoteBusy, onOpenPage }) => {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });

  const lastAi = [...messages].reverse().find(m => m.role === "assistant");
  const fellBack = lastAi && lastAi.notice;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
      {fellBack && (
        <div className="fallback-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <I.Alert size={13} stroke="var(--neon-amber)" />
            <span>{lastAi.notice}</span>
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "22px 36px 16px", display: "flex", flexDirection: "column", gap: 24, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--text-faint)" }}>
            <I.Sparkle size={22} stroke="var(--accent)" />
            <div style={{ marginTop: 10, fontSize: 14, color: "var(--text-dim)" }}>Ask the vault anything about system design.</div>
            <div className="t-mono" style={{ fontSize: 11, marginTop: 4 }}>Grounded in your notes · Qwen answers · Sonnet compiles</div>
          </div>
        )}
        {messages.map((m, i) => m.role === "user" ? (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Avatar kind="you" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-label" style={{ marginBottom: 6 }}>YOU</div>
              <div style={{ color: "var(--text-hi)", fontSize: 16, lineHeight: 1.5, fontWeight: 500 }}>{m.q}</div>
            </div>
          </div>
        ) : (
          <AssistantTurn key={i} m={m} onPromote={onPromote} promoteBusy={promoteBusy} onOpenPage={onOpenPage} />
        ))}
      </div>

      <StudyInput onSend={onAsk} busy={busy} />
    </div>
  );
};

const AssistantTurn = ({ m, onPromote, promoteBusy, onOpenPage }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {m.sources && m.sources.length > 0 && (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar kind="ai" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div className="t-label">RETRIEVED · {m.sources.length} PAGES{m.backend ? " · " + (m.backend.backend || "").toUpperCase() : ""}</div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>hybrid + rerank + graph</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {m.sources.map((s) => <SourceChip key={s.page} src={s} onClick={onOpenPage} />)}
          </div>
        </div>
      </div>
    )}
    {(m.answer || m.streaming) && (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar kind="ai" active={m.streaming} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div className="t-label">{m.backend ? (m.backend.backend || "").toUpperCase() + (m.backend.model ? " · " + m.backend.model : "") : "ANSWER"}</div>
            {!m.streaming && m.answer && (
              <button className="btn btn--accent btn--sm" onClick={onPromote} disabled={promoteBusy}>
                <I.Promote size={12} /> {promoteBusy ? "Compiling…" : "Promote to vault"}
              </button>
            )}
          </div>
          <MdAnswer text={m.answer || ""} streaming={!!m.streaming} />
        </div>
      </div>
    )}
  </div>
);

const Avatar = ({ kind, active }) => {
  if (kind === "you") {
    return <div style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--border-strong)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text)", flexShrink: 0 }}>YOU</div>;
  }
  return <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(140deg, var(--accent), #5b4ed8 70%)", display: "grid", placeItems: "center", color: "#0a0d18", boxShadow: active ? "0 0 0 1px var(--accent-line), 0 0 16px rgba(139,125,255,0.4)" : "0 0 0 1px var(--accent-line)", flexShrink: 0 }}>
    <I.Sparkle size={14} stroke="#0a0d18" sw={2} />
  </div>;
};

const MdAnswer = ({ text, streaming }) => {
  const renderInline = (s) => {
    const parts = []; let rest = s; let key = 0;
    const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/;
    while (true) {
      const m = re.exec(rest);
      if (!m) { parts.push(rest); break; }
      parts.push(rest.slice(0, m.index));
      const tok = m[0];
      if (tok.startsWith("**")) parts.push(<b key={key++} style={{ color: "var(--text-hi)", fontWeight: 600 }}>{tok.slice(2, -2)}</b>);
      else if (tok.startsWith("[[")) parts.push(<span key={key++} style={{ color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{tok}</span>);
      else parts.push(<code key={key++} style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "1px 5px", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 3, color: "var(--accent-hi)" }}>{tok.slice(1, -1)}</code>);
      rest = rest.slice(m.index + tok.length);
    }
    return parts;
  };

  const lines = text.split("\n");
  const blocks = []; let cur = { type: "p", lines: [] };
  const flush = () => { if (cur.lines.length || cur.type !== "p") blocks.push(cur); cur = { type: "p", lines: [] }; };
  for (const line of lines) {
    if (line.startsWith("## ") || line.startsWith("### ")) { flush(); blocks.push({ type: "h", lines: [line.replace(/^#+\s/, "")] }); }
    else if (line.startsWith("- ") || line.startsWith("* ")) { if (cur.type !== "ul") { flush(); cur = { type: "ul", lines: [] }; } cur.lines.push(line.slice(2)); }
    else if (line.trim() === "") flush();
    else { if (cur.type !== "p") flush(); cur.lines.push(line); }
  }
  flush();

  return (
    <div style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.7, fontFamily: "var(--font-body)", letterSpacing: "-0.005em" }}>
      {blocks.map((b, i) => {
        const last = i === blocks.length - 1;
        if (b.type === "h") return <h4 key={i} style={{ color: "var(--text-hi)", margin: "16px 0 6px", fontSize: 14, fontWeight: 600 }}>{renderInline(b.lines[0])}</h4>;
        if (b.type === "ul") return <ul key={i} style={{ paddingLeft: 18, margin: "0 0 14px" }}>{b.lines.map((l, j) => <li key={j} style={{ marginBottom: 6 }}>{renderInline(l)}</li>)}</ul>;
        return <p key={i} style={{ margin: "0 0 14px" }}>{renderInline(b.lines.join(" "))}{last && streaming && <span className="streaming-cursor" />}</p>;
      })}
    </div>
  );
};

const StudyInput = ({ onSend, busy }) => {
  const [val, setVal] = useState("");
  const send = () => { const q = val.trim(); if (!q || busy) return; setVal(""); onSend(q); };
  return (
    <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)", background: "rgba(10,13,24,0.5)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "flex-end", background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: 10, boxShadow: "var(--glow-soft)" }}>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
          placeholder="Ask the vault — ⌘⏎ to send, ⇧⏎ for newline…"
          style={{ background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--text-hi)", fontSize: 14, lineHeight: 1.5, padding: "6px 8px", width: "100%", fontFamily: "var(--font-body)" }} />
        <button className="btn btn--primary btn--sm" onClick={send} disabled={busy}>
          <I.Send size={11} /> {busy ? "…" : "Send"}
          <span className="kbd kbd--inline" style={{ background: "rgba(10,13,24,0.4)", color: "#0a0d18", borderColor: "rgba(0,0,0,0.2)" }}>⌘⏎</span>
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 4px" }}>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
          ROUTING → <span style={{ color: "var(--text-dim)" }}>QWEN</span> → <span style={{ color: "var(--accent)" }}>CLAUDE</span> fallback
        </div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", display: "flex", gap: 12 }}>
          <span>⌘K palette</span><span>⌘⇧P promote</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// STUDY ROOT — owns the live ask + promote flow
// =========================================================
const Study = () => {
  const [leftCol, setLeftCol] = useState(false);
  const [rightCol, setRightCol] = useState(true);
  const [previewPage, setPreviewPage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteCount, setPromoteCount] = useState(0);
  const [sessionProposals, setSessionProposals] = useState(null);  // whole-session compile
  const [reviewIdx, setReviewIdx] = useState(null);                // which session proposal is open
  const [compiling, setCompiling] = useState(false);
  const startedAt = useRef(Date.now());

  const updateLast = (fn) => setMessages(m => {
    const c = [...m];
    for (let i = c.length - 1; i >= 0; i--) { if (c[i].role === "assistant") { c[i] = fn(c[i]); break; } }
    return c;
  });

  const ask = (q) => {
    setBusy(true);
    setMessages(m => [...m, { role: "user", q }, { role: "assistant", answer: "", sources: [], streaming: true }]);
    API.streamAsk(q, null, {
      onSources: (s) => updateLast(a => ({ ...a, sources: s })),
      onBackend: (b) => updateLast(a => ({ ...a, backend: b })),
      onChunk: (t) => updateLast(a => ({ ...a, answer: (a.answer || "") + t })),
      onNotice: (t) => updateLast(a => ({ ...a, notice: t })),
      onError: (t) => updateLast(a => ({ ...a, answer: (a.answer || "") + "\n\n_[" + t + "]_", streaming: false })),
      onDone: () => { updateLast(a => ({ ...a, streaming: false })); setBusy(false); },
    });
  };

  const promote = async () => {
    const convo = messages.map(x => x.role === "user" ? "Q: " + x.q : "A: " + (x.answer || "")).join("\n\n");
    if (!convo.trim()) return;
    setPromoteBusy(true);
    try {
      const r = await API.post("/api/promote", { conversation: convo });
      if (r.status === "ok") setProposal({ ...r.proposal, _blocking: r.blocking || [], _warnings: r.warnings || [] });
      else setProposal({ decision: "SKIP", reason: r.message || "Compile failed.", wikilinks: [], conflicts_with: [] });
    } catch (e) { setProposal({ decision: "SKIP", reason: String(e), wikilinks: [], conflicts_with: [] }); }
    setPromoteBusy(false);
  };

  const confirm = async (edited) => {
    const p = { ...proposal };
    if (edited != null) { if (p.decision === "CREATE") p.content = edited; else p.new_content = edited; }
    try {
      const r = await API.post("/api/confirm_promotion", { proposal: p });
      if (r.status === "ok" && r.result && r.result.applied) setPromoteCount(c => c + 1);
    } catch (e) { /* ignore */ }
    setProposal(null);
  };

  // Compile the WHOLE conversation into multiple vault improvements (enrich, not consolidate).
  const compileSession = async () => {
    const convo = messages.map(x => x.role === "user" ? "Q: " + x.q : "A: " + (x.answer || "")).join("\n\n");
    if (!convo.trim() || compiling) return;
    setCompiling(true);
    try {
      const r = await API.post("/api/compile_session", { conversation: convo });
      if (r.status === "ok") setSessionProposals((r.proposals || []).map(p => ({ ...p, _done: false })));
      else setSessionProposals([{ decision: "SKIP", reason: r.message || "Compile failed." }]);
    } catch (e) { setSessionProposals([{ decision: "SKIP", reason: String(e) }]); }
    setCompiling(false);
  };

  const confirmSession = async (edited) => {
    if (reviewIdx == null) return;
    const p = { ...sessionProposals[reviewIdx] };
    if (edited != null) p[p.decision === "CREATE" ? "content" : "new_content"] = edited;
    try {
      const r = await API.post("/api/confirm_promotion", { proposal: p });
      if (r.status === "ok" && r.result && r.result.applied) {
        setSessionProposals(arr => arr.map((x, i) => i === reviewIdx ? { ...x, _done: true } : x));
        setPromoteCount(c => c + 1);
      }
    } catch (e) { /* ignore */ }
    setReviewIdx(null);
  };

  const openPage = async (src) => {
    setRightCol(false);
    setPreviewPage({ ...src, body: "", _loading: true });
    try {
      const d = await API.get("/api/page/" + encodeURIComponent(src.page));
      setPreviewPage({ ...src, body: d.body, frontmatter: d.frontmatter, _loading: false });
    } catch (e) { setPreviewPage({ ...src, body: "(could not load page)", _loading: false }); }
  };

  // Derived session for the left rail.
  const retrievedUnion = (() => {
    const map = {};
    for (const m of messages) for (const s of (m.sources || [])) {
      if (!map[s.page] || (s.score || 0) > (map[s.page].score || 0)) map[s.page] = s;
    }
    return Object.values(map);
  })();
  const session = {
    elapsedMin: Math.max(0, Math.floor((Date.now() - startedAt.current) / 60000)),
    queries: messages.filter(m => m.role === "user").length,
    promotions: promoteCount,
    retrievals: retrievedUnion.length,
    history: messages.filter(m => m.role === "user").map((m, i) => ({ id: "q" + i, q: m.q })),
    retrieved: retrievedUnion,
  };

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <StudyLeft session={session} collapsed={leftCol} onCollapse={() => setLeftCol(c => !c)} onCompile={compileSession} compiling={compiling} />
      <StudyCenter messages={messages} busy={busy} onAsk={ask} onPromote={promote} promoteBusy={promoteBusy} onOpenPage={openPage} />
      <StudyRight collapsed={rightCol} onCollapse={() => setRightCol(c => !c)} page={previewPage} />
      {proposal && <PromoteModal proposal={proposal} onClose={() => setProposal(null)} onConfirm={confirm} />}
      {sessionProposals && reviewIdx == null && (
        <SessionReview proposals={sessionProposals} onReview={setReviewIdx} onClose={() => setSessionProposals(null)} />
      )}
      {sessionProposals && reviewIdx != null && (
        <PromoteModal proposal={sessionProposals[reviewIdx]} onClose={() => setReviewIdx(null)} onConfirm={confirmSession} />
      )}
    </div>
  );
};

// =========================================================
// PROMOTE MODAL — real proposal (CREATE or EXTEND)
// =========================================================
const PromoteModal = ({ proposal, onClose, onConfirm }) => {
  const isExtend = proposal.decision === "EXTEND";
  const [content, setContent] = useState(proposal.new_content || proposal.content || "");
  const title = proposal.target_title || proposal.title || (proposal.decision === "SKIP" ? "Nothing to promote" : "(new note)");
  const conflicts = proposal.conflicts_with || [];
  const wikilinks = proposal.wikilinks || [];
  const blocking = proposal._blocking || [];

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <span className={`decision-tag ${(proposal.decision || "skip").toLowerCase()}`}>{proposal.decision}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.01em" }}>{title}</div>
            {(proposal.target_section || proposal.area) && (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                {proposal.target_section || proposal.area}
                {proposal.merge_strategy && <><span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span><span style={{ color: "var(--accent-hi)" }}>{proposal.merge_strategy}</span></>}
              </div>
            )}
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}><I.X size={12} /></button>
        </div>

        <div className="modal__body">
          <div style={{ padding: "10px 12px", background: "rgba(139,125,255,0.05)", border: "1px solid var(--accent-line)", borderRadius: 6, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <I.Sparkle size={14} stroke="var(--accent-hi)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div className="t-label" style={{ color: "var(--accent-hi)", marginBottom: 4 }}>COMPILER REASONING</div>
              <div style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}>{proposal.reason}</div>
            </div>
          </div>

          {blocking.length > 0 && (
            <div className="conflict" style={{ marginBottom: 16 }}>
              <I.Alert size={14} stroke="var(--neon-red)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--text-hi)", marginBottom: 4, fontSize: 13 }}><b style={{ color: "var(--neon-red)" }}>Blocked by {blocking.length} integrity check(s)</b></div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{blocking.map((b, i) => <div key={i}>· {b}</div>)}</div>
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="conflict" style={{ marginBottom: 16 }}>
              <I.Alert size={14} stroke="var(--neon-red)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ color: "var(--text-hi)", marginBottom: 4, fontSize: 13 }}><b style={{ color: "var(--neon-red)" }}>Conflict</b> with {conflicts.length} note(s)</div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>{conflicts.map(c => <span key={c} style={{ marginRight: 12 }}>{c}</span>)}</div>
                {proposal.conflict_description && <div style={{ color: "var(--text-body)", fontSize: 12.5, lineHeight: 1.5 }}>{proposal.conflict_description}</div>}
              </div>
            </div>
          )}

          {proposal.decision !== "SKIP" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div className="t-label">{isExtend ? "CONTENT TO MERGE" : "NEW NOTE"} · MARKDOWN</div>
              </div>
              <textarea className="md-area" value={content} onChange={(e) => setContent(e.target.value)} />
              {wikilinks.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="t-label" style={{ marginBottom: 6 }}>WIKILINKS · {wikilinks.length}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {wikilinks.map(w => <span key={w} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--accent-line)", background: "var(--accent-soft)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent-hi)" }}>[[{w}]]</span>)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal__foot">
          <div className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>esc cancel</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            {proposal.decision !== "SKIP" && (
              <button className="btn btn--primary" onClick={() => onConfirm(content)} disabled={blocking.length > 0}>
                <I.Check size={12} /> Confirm {proposal.decision === "CREATE" ? "create" : "extend"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// SESSION REVIEW — the whole-conversation compile result
// =========================================================
const SessionReview = ({ proposals, onReview, onClose }) => {
  const actionable = proposals.filter(p => p.decision !== "SKIP");
  const skipped = proposals.length - actionable.length;
  const promoted = proposals.filter(p => p._done).length;
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(720px, 92vw)", maxHeight: "86vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <I.Compile size={14} stroke="var(--accent-hi)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, color: "var(--text-hi)" }}>
              Session compiled into {actionable.length} vault note{actionable.length === 1 ? "" : "s"}
            </div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
              Promote the ones you want — Claude wrote depth your vault was missing{skipped ? ` · ${skipped} skipped (already covered)` : ""}
            </div>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={onClose}><I.X size={12} /></button>
        </div>

        <div style={{ overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
          {actionable.length === 0 && (
            <div style={{ padding: 28, textAlign: "center", color: "var(--text-dim)" }}>
              Nothing to add — the vault already covers this conversation.
            </div>
          )}
          {proposals.map((p, i) => p.decision === "SKIP" ? null : (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, opacity: p._done ? 0.55 : 1 }}>
              <span className={`decision-tag ${(p.decision || "skip").toLowerCase()}`}>{p.decision}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--text-hi)", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.target_title || p.title || "(note)"}</div>
                <div className="t-mono" style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.target_section || p.area} · {p.reason}</div>
              </div>
              {p._done ? <span className="t-mono" style={{ fontSize: 11, color: "var(--neon-green)" }}>✓ promoted</span>
                : (p._blocking && p._blocking.length)
                  ? <button className="btn btn--sm" onClick={() => onReview(i)} title={p._blocking.join("; ")}><I.Eye size={11} /> Review ⚠</button>
                  : <button className="btn btn--primary btn--sm" onClick={() => onReview(i)}><I.Eye size={11} /> Review</button>}
            </div>
          ))}
        </div>

        <div className="modal__foot">
          <div className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>{promoted} promoted · unchosen notes are discarded</div>
          <button className="btn btn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Study, PromoteModal });
