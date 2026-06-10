/* global React, I, AREAS, Ring, AreaDot, Sparkline, Card */

const { useState, useEffect } = React;

const KIND = {
  "weak-recall":  { label: "WEAK RECALL",  color: "var(--neon-red)" },
  "thin-page":    { label: "THIN PAGE",    color: "var(--neon-amber)" },
  "low-coverage": { label: "LOW COVERAGE", color: "var(--accent-hi)" },
};

// =========================================================
// STUDY PLANNER — analytics feedback loop (M6)
// =========================================================
const Roadmap = () => {
  const [d, setD] = useState(null);
  useEffect(() => {
    window.API.get("/api/analytics").then(setD).catch(() => setD({ _err: true }));
  }, []);
  const go = (v) => window.__sdaGo && window.__sdaGo(v);

  if (!d) return <Centered>Loading insights…</Centered>;
  if (d._err) return <Centered>Couldn't load analytics — is the backend running?</Centered>;

  const fw = d.flywheel || {};
  const hasData = (fw.queries_total || 0) > 0 || (fw.cards_total || 0) > 0;

  return (
    <div style={{ height: "100%", overflow: "auto", padding: "18px 28px 60px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* header */}
        <div>
          <div className="t-label" style={{ marginBottom: 4 }}>STUDY PLANNER · FROM YOUR USAGE</div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>What to study next</h1>
          <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
            Driven by what you query, the flashcards you miss, and where the vault is still thin — not just coverage.
          </div>
        </div>

        {/* flywheel stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) auto", gap: 12, alignItems: "center", padding: "14px 16px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <Stat n={fw.queries_week} label="QUERIES · WK" sub={`${fw.queries_total || 0} all-time`} />
          <Stat n={fw.promotions_week} label="PROMOTED · WK" sub={`${fw.promotions_total || 0} all-time`} accent />
          <Stat n={fw.cards_struggling} label="STRUGGLING CARDS" tone={fw.cards_struggling ? "red" : ""} />
          <Stat n={fw.reviews_pending} label="REVIEW QUEUE" />
          <Stat n={fw.vault_pages} label="VAULT PAGES" />
          <div style={{ textAlign: "right" }}>
            <div className="t-label" style={{ marginBottom: 6 }}>QUERIES · 14d</div>
            <Sparkline data={(d.activity && d.activity.some(x => x)) ? d.activity : [0, 0, 0, 0, 0]} w={120} h={32} />
          </div>
        </div>

        {!hasData && (
          <div className="t-mono" style={{ padding: 24, textAlign: "center", color: "var(--text-dim)", border: "1px dashed var(--border)", borderRadius: 8 }}>
            Ask questions and review flashcards — your personalised study plan appears here as you use the app.
          </div>
        )}

        {/* study next */}
        {d.study_next && d.study_next.length > 0 && (
          <div>
            <div className="section-title"><span className="num">01</span>Study next</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10, marginTop: 10 }}>
              {d.study_next.map((it, i) => {
                const k = KIND[it.kind] || { label: it.kind, color: "var(--text-dim)" };
                return (
                  <div key={i} style={{ padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: `2px solid ${k.color}`, borderRadius: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="t-mono" style={{ fontSize: 9, fontWeight: 600, color: k.color, letterSpacing: 0.1 }}>{k.label}</span>
                      <AreaDot area={it.area} size={7} />
                    </div>
                    <div style={{ color: "var(--text-hi)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>{it.title}</div>
                    <div className="section-sub" style={{ margin: 0 }}>{it.why}</div>
                    <button className="btn btn--sm" style={{ alignSelf: "flex-start", marginTop: 2 }} onClick={() => go("study")}>
                      <I.Study size={10} /> Study this
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* two columns: weak cards + thin pages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Card title="You keep missing" glyph={<I.Cards size={12} />}>
            {(d.weak_cards || []).length === 0
              ? <Empty>No struggling cards yet — review the deck and the ones you fail land here.</Empty>
              : d.weak_cards.map((c, i) => <Row key={i} area={c.area} title={c.question} right={`${c.lapses}× missed`} tone="red" />)}
          </Card>
          <Card title="Queried a lot, still thin" glyph={<I.File size={12} />}>
            {(d.thin_pages || []).length === 0
              ? <Empty>Nothing thin that you query often.</Empty>
              : d.thin_pages.map((t, i) => <Row key={i} area={t.area} title={t.page} right={`${t.retrieved}× · ${t.status}`} tone="amber" />)}
          </Card>
        </div>

        {/* area mastery */}
        <div>
          <div className="section-title"><span className="num">02</span>Area mastery</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginTop: 10 }}>
            {(d.areas || []).map((a) => (
              <div key={a.area} style={{ padding: 12, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <Ring pct={a.coverage} color={AREAS[a.area]?.color || "var(--accent)"} size={46} stroke={4} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <AreaDot area={a.area} size={6} />
                    <span style={{ color: "var(--text-hi)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{AREAS[a.area]?.short || a.area}</span>
                  </div>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>{a.mature}/{a.total} mature</div>
                  <div className="t-mono" style={{ fontSize: 10, color: a.queries ? "var(--accent-hi)" : "var(--text-faint)", marginTop: 1 }}>{a.queries} quer{a.queries === 1 ? "y" : "ies"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* vault strong */}
        {(d.vault_strong || []).length > 0 && (
          <Card title="The vault answers you well here" glyph={<I.Check size={12} />}>
            <div className="section-sub" style={{ marginTop: 0, marginBottom: 8 }}>Pages you query often and never needed to promote — already well covered.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.vault_strong.map((p, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, background: "rgba(61,255,166,0.05)", border: "1px solid rgba(61,255,166,0.2)", fontSize: 11.5, color: "var(--text-body)" }}>
                  <AreaDot area={p.area} size={6} />{p.page}
                  <span className="t-mono" style={{ color: "var(--text-faint)", fontSize: 10 }}>{p.retrieved}×</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const Stat = ({ n, label, sub, accent, tone }) => (
  <div>
    <div className="t-label" style={{ marginBottom: 3 }}>{label}</div>
    <div className="t-mono t-num" style={{ fontSize: 22, lineHeight: 1, color: tone === "red" ? "var(--neon-red)" : accent ? "var(--accent-hi)" : "var(--text-hi)" }}>{n == null ? "—" : n}</div>
    {sub && <div className="t-mono" style={{ fontSize: 9.5, color: "var(--text-faint)", marginTop: 3 }}>{sub}</div>}
  </div>
);

const Row = ({ area, title, right, tone }) => (
  <div style={{ display: "grid", gridTemplateColumns: "8px 1fr auto", gap: 10, alignItems: "center", padding: "7px 6px", borderBottom: "1px solid var(--border)" }}>
    <AreaDot area={area} size={7} />
    <span style={{ color: "var(--text-body)", fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
    <span className="t-mono" style={{ fontSize: 10.5, color: tone === "red" ? "var(--neon-red)" : tone === "amber" ? "var(--neon-amber)" : "var(--text-faint)" }}>{right}</span>
  </div>
);

const Empty = ({ children }) => (
  <div className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)", padding: "12px 4px" }}>{children}</div>
);

const Centered = ({ children }) => (
  <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-dim)", fontSize: 14 }}>{children}</div>
);

Object.assign(window, { Roadmap });
